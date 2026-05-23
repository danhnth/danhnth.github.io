import type { GPUTier, CRTConfig } from '../types/effects.ts';
import { EffectsBridge } from './effects-bridge.ts';

/**
 * CRTEffectsManager initializes and controls CRT effects based on GPU tier.
 * - High tier: WebGL shader pipeline with full effects
 * - Low tier: CSS scanlines + vignette + beam + noise
 * - Minimal tier: CSS only
 *
 * Respects prefers-reduced-motion: reduce (disable all animations)
 * Respects prefers-contrast: more (disable bloom/glow)
 */
export class CRTEffectsManager {
  private tier: GPUTier;
  private config: CRTConfig;
  private terminalElement: HTMLElement | null = null;
  private bridge: EffectsBridge | null = null;
  private isEnabled = false;
  private reducedMotion = false;
  private highContrast = false;

  constructor(tier: GPUTier, config: CRTConfig) {
    this.tier = tier;
    this.config = config;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.highContrast = window.matchMedia('(prefers-contrast: more)').matches;

    // Listen for accessibility preference changes
    this.setupMediaQueryListeners();
  }

  /**
   * Set the terminal element to apply effects to.
   */
  setTerminalElement(element: HTMLElement): void {
    this.terminalElement = element;
  }

  /**
   * Setup listeners for accessibility media query changes.
   */
  private setupMediaQueryListeners(): void {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList): void => {
      this.reducedMotion = e.matches;
      if (this.reducedMotion && this.isEnabled) {
        this.disable();
      }
    };

    const handleContrastChange = (e: MediaQueryListEvent | MediaQueryList): void => {
      this.highContrast = e.matches;
      if (this.highContrast) {
        this.config = { ...this.config, bloomStrength: 0 };
      }
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

  /**
   * Initialize effects based on GPU tier.
   * - high: initialize WebGLPipeline + EffectsBridge
   * - low/minimal: add CSS fallback class to terminal
   */
  initialize(): void {
    if (!this.terminalElement) return;

    if (this.tier === 'high' && !this.reducedMotion) {
      // Try WebGL pipeline
      this.bridge = new EffectsBridge(this.config);
      this.bridge.attach(this.terminalElement);
    } else {
      // Low or minimal tier: CSS fallback
      this.applyCSSFallback();
    }
  }

  /**
   * Apply CSS fallback classes and overlay elements to terminal.
   */
  private applyCSSFallback(): void {
    if (!this.terminalElement) return;

    this.terminalElement.classList.add('crt-effects--css');

    if (this.tier === 'low') {
      this.terminalElement.classList.add('crt-effects--css--low');
    } else if (this.tier === 'minimal') {
      this.terminalElement.classList.add('crt-effects--css--minimal');
    }

    // Add flicker if not reduced motion and tier supports it
    if (!this.reducedMotion && this.tier !== 'minimal') {
      this.terminalElement.classList.add('crt-effects--css--flicker');
    }

    // Add jitter if not reduced motion
    if (!this.reducedMotion && this.tier === 'high') {
      this.terminalElement.classList.add('crt-effects--css--jitter');
    }

    // Add scanning beam element
    if (!this.reducedMotion && this.tier !== 'minimal') {
      this.addScanningBeam();
    }

    // Add noise overlay element
    if (this.tier !== 'minimal') {
      this.addNoiseOverlay();
    }
  }

  /**
   * Add scanning beam element to terminal.
   */
  private addScanningBeam(): void {
    if (!this.terminalElement) return;
    if (this.terminalElement.querySelector('.crt-scanning-beam')) return;

    const beam = document.createElement('div');
    beam.className = 'crt-scanning-beam';
    this.terminalElement.appendChild(beam);
  }

  /**
   * Add noise overlay element to terminal.
   */
  private addNoiseOverlay(): void {
    if (!this.terminalElement) return;
    if (this.terminalElement.querySelector('.crt-noise-overlay')) return;

    const noise = document.createElement('div');
    noise.className = 'crt-noise-overlay';
    this.terminalElement.appendChild(noise);
  }

  /**
   * Remove CSS fallback overlay elements.
   */
  private removeCSSFallbackElements(): void {
    if (!this.terminalElement) return;

    const beam = this.terminalElement.querySelector('.crt-scanning-beam');
    if (beam) beam.remove();

    const noise = this.terminalElement.querySelector('.crt-noise-overlay');
    if (noise) noise.remove();
  }

  /**
   * Remove CSS fallback classes.
   */
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

  /**
   * Enable CRT effects.
   */
  enable(): void {
    if (this.isEnabled || this.reducedMotion) return;

    this.isEnabled = true;

    if (this.bridge) {
      this.bridge.enable();
    }
  }

  /**
   * Disable CRT effects.
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;

    if (this.bridge) {
      this.bridge.disable();
    }
  }

  /**
   * Update CRT configuration.
   * @param config - New configuration values
   */
  updateConfig(config: CRTConfig): void {
    this.config = config;

    // Respect high contrast
    if (this.highContrast) {
      this.config = { ...this.config, bloomStrength: 0 };
    }

    if (this.bridge) {
      this.bridge.updateConfig(this.config);
    }
  }

  /**
   * Clean up all effects and resources.
   */
  destroy(): void {
    this.disable();

    if (this.bridge) {
      this.bridge.detach();
      this.bridge = null;
    }

    this.removeCSSFallback();
    this.terminalElement = null;
  }
}
