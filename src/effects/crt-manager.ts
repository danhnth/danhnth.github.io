import type { GPUTier, CRTConfig } from '../types/effects.ts';
import { EffectsBridge } from './effects-bridge.ts';
import { PerfWatchdog } from './perf-watchdog.ts';
import {
  checkWebGLCapability,
  applyReducedMotion,
  getCRTConfig,
} from '../utils/gpu-detect.ts';

/**
 * CRTEffectsManager owns the single authoritative effects decision:
 * attempt the WebGL pipeline optimistically, demote to the STATIC CSS
 * fallback only on real, observed failure (capability disqualifier,
 * pipeline init failure, unrecovered context loss, sustained low FPS).
 *
 * prefers-reduced-motion does NOT disable WebGL — static scanlines,
 * curvature, vignette, mask, and bloom are not motion. It zeroes the
 * animated shader parameters instead (see applyReducedMotion), which keeps
 * the accessibility contract intact while preserving the CRT look.
 *
 * The demotion target is deliberately the 'minimal' (static) CSS variant:
 * the animated CSS overlays are measurably MORE expensive on integrated
 * GPUs than the single WebGL quad, so demoting a struggling machine into
 * animated CSS would make things worse — and demotion is one-way.
 */
export class CRTEffectsManager {
  private tier: GPUTier;
  private config: CRTConfig;
  private terminalElement: HTMLElement | null = null;
  private bridge: EffectsBridge | null = null;
  private watchdog: PerfWatchdog | null = null;
  private contextLossTimer: number | null = null;
  private isEnabled = false;
  private reducedMotion = false;
  private highContrast = false;
  /** Pre-demotion tier/config so `display crt` can rebuild the FULL shader
   *  instead of the pinned minimal config. */
  private demotedTier: GPUTier | null = null;
  private demotedConfig: CRTConfig | null = null;

  constructor(tier: GPUTier, config: CRTConfig) {
    this.tier = tier;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.highContrast = window.matchMedia('(prefers-contrast: more)').matches;
    this.config = this.normalizeConfig(config);

    this.setupMediaQueryListeners();
  }

  setTerminalElement(element: HTMLElement): void {
    this.terminalElement = element;
  }

  private normalizeConfig(config: CRTConfig): CRTConfig {
    let next = this.highContrast ? { ...config, bloomStrength: 0 } : config;
    if (this.reducedMotion) {
      next = applyReducedMotion(next);
    }
    return next;
  }

  private setupMediaQueryListeners(): void {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList): void => {
      this.reducedMotion = e.matches;
      this.config = this.normalizeConfig(getCRTConfig(this.tier));
      if (this.bridge) {
        this.bridge.updateConfig(this.config);
      } else if (this.terminalElement?.classList.contains('crt-effects--css')) {
        this.removeCSSFallback();
        this.applyCSSFallback();
      }
    };

    const handleContrastChange = (e: MediaQueryListEvent | MediaQueryList): void => {
      this.highContrast = e.matches;
      this.config = this.normalizeConfig(getCRTConfig(this.tier));
      if (this.bridge) {
        this.bridge.updateConfig(this.config);
      }
    };

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', handleMotionChange);
      contrastQuery.addEventListener('change', handleContrastChange);
    } else {
      // Safari < 14 fallback
      (motionQuery as unknown as { addListener: (cb: (e: MediaQueryList) => void) => void }).addListener(handleMotionChange);
      (contrastQuery as unknown as { addListener: (cb: (e: MediaQueryList) => void) => void }).addListener(handleContrastChange);
    }
  }

  initialize(): void {
    if (!this.terminalElement) return;

    const cap = checkWebGLCapability();
    if (!cap.ok) {
      this.log(`css-fallback: ${cap.reason}`);
      this.applyCSSFallback();
      return;
    }

    this.bridge = new EffectsBridge(this.config);
    if (!this.bridge.attach(this.terminalElement)) {
      this.bridge = null;
      this.log('css-fallback: pipeline-init-failed');
      this.applyCSSFallback();
      return;
    }

    this.bridge.setContextEventCallbacks(
      () => this.handleContextLost(),
      () => this.handleContextRestored()
    );

    this.watchdog = new PerfWatchdog((reason) => this.demoteToCSS(reason));
    this.bridge.setCaptureWorkCallback(() => this.watchdog?.markBlockingWork());
    this.watchdog.start();
    this.log('webgl pipeline active');
  }

  private handleContextLost(): void {
    if (this.contextLossTimer !== null) return;
    this.contextLossTimer = window.setTimeout(() => {
      this.contextLossTimer = null;
      this.demoteToCSS('context-lost');
    }, 3000);
  }

  private handleContextRestored(): void {
    if (this.contextLossTimer !== null) {
      clearTimeout(this.contextLossTimer);
      this.contextLossTimer = null;
    }
  }

  private demoteToCSS(reason: string): void {
    this.log(`css-fallback (demoted): ${reason}`);
    this.watchdog?.stop();
    this.watchdog = null;
    if (this.contextLossTimer !== null) {
      clearTimeout(this.contextLossTimer);
      this.contextLossTimer = null;
    }
    this.bridge?.detach();
    this.bridge = null;
    // Remember what we demoted FROM so an explicit `display crt` can rebuild
    // the full shader instead of being trapped in the minimal config.
    this.demotedTier = this.tier;
    this.demotedConfig = this.config;
    this.isEnabled = false;
    // Static variant only: animated CSS overlays cost more than the WebGL
    // quad on weak GPUs, and demotion is one-way.
    this.tier = 'minimal';
    this.config = this.normalizeConfig(getCRTConfig('minimal'));
    this.applyCSSFallback();
  }

  private applyCSSFallback(): void {
    if (!this.terminalElement) return;

    this.terminalElement.classList.remove('crt-terminal--webgl-active');
    this.terminalElement.classList.add('crt-effects--css');

    if (this.tier === 'low') {
      this.terminalElement.classList.add('crt-effects--css--low');
    } else if (this.tier === 'minimal') {
      this.terminalElement.classList.add('crt-effects--css--minimal');
    }

    const allowAnimation = !this.reducedMotion && this.tier !== 'minimal';

    if (allowAnimation) {
      this.terminalElement.classList.add('crt-effects--css--flicker');
      this.addScanningBeam();
      this.addNoiseOverlay();
    }
  }

  private addScanningBeam(): void {
    if (!this.terminalElement) return;
    if (this.terminalElement.querySelector('.crt-scanning-beam')) return;

    const beam = document.createElement('div');
    beam.className = 'crt-scanning-beam';
    this.terminalElement.appendChild(beam);
  }

  private addNoiseOverlay(): void {
    if (!this.terminalElement) return;
    if (this.terminalElement.querySelector('.crt-noise-overlay')) return;

    const noise = document.createElement('div');
    noise.className = 'crt-noise-overlay';
    this.terminalElement.appendChild(noise);
  }

  private removeCSSFallbackElements(): void {
    if (!this.terminalElement) return;

    const beam = this.terminalElement.querySelector('.crt-scanning-beam');
    if (beam) beam.remove();

    const noise = this.terminalElement.querySelector('.crt-noise-overlay');
    if (noise) noise.remove();
  }

  private removeCSSFallback(): void {
    if (!this.terminalElement) return;

    this.terminalElement.classList.remove(
      'crt-effects--css',
      'crt-effects--css--low',
      'crt-effects--css--minimal',
      'crt-effects--css--flicker',
      'crt-effects--css--jitter'
    );

    this.removeCSSFallbackElements();
  }

  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;

    if (this.bridge) {
      this.bridge.enable();
    }
  }

  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;

    if (this.bridge) {
      this.bridge.disable();
    }
  }

  updateConfig(config: CRTConfig): void {
    this.config = this.normalizeConfig(config);

    if (this.bridge) {
      this.bridge.updateConfig(this.config);
    }
  }

  destroy(): void {
    this.disable();

    this.watchdog?.stop();
    this.watchdog = null;

    if (this.contextLossTimer !== null) {
      clearTimeout(this.contextLossTimer);
      this.contextLossTimer = null;
    }

    if (this.bridge) {
      this.bridge.detach();
      this.bridge = null;
    }

    this.removeCSSFallback();
    this.terminalElement = null;
  }

  /**
   * Switch to the plain, non-CRT display mode: stop the watchdog, detach the
   * WebGL bridge, and remove every CRT overlay element/class. The terminal
   * DOM stays fully interactive — only the effects layer goes away.
   */
  setModernMode(): void {
    if (!this.terminalElement) return;
    this.log('display: modern (effects off)');

    this.watchdog?.stop();
    this.watchdog = null;

    if (this.contextLossTimer !== null) {
      clearTimeout(this.contextLossTimer);
      this.contextLossTimer = null;
    }

    this.bridge?.disable();
    this.bridge?.detach();
    this.bridge = null;

    this.removeCSSFallback();
    this.isEnabled = false;
  }

  /**
   * Re-enable the CRT look after setModernMode(): re-run the optimistic
   * WebGL initialization (with CSS-fallback demotion on real failure).
   * Idempotent — a repeated call while the pipeline is already live is a
   * no-op instead of stacking a second bridge/canvas/watchdog.
   */
  setCRTMode(): void {
    if (!this.terminalElement || this.bridge || this.isEnabled) return;
    this.log('display: crt (effects on)');
    // Recover from a previous demotion: rebuild with the FULL config instead
    // of the pinned minimal one, and drop the CSS-fallback classes.
    if (this.demotedTier !== null) {
      this.tier = this.demotedTier;
      this.config = this.demotedConfig ?? this.normalizeConfig(getCRTConfig(this.demotedTier));
      this.demotedTier = null;
      this.demotedConfig = null;
      this.removeCSSFallback();
    }
    this.initialize();
    this.enable();
  }

  private log(msg: string): void {
    console.info(`[CRT] ${msg}`);
  }
}
