import { WebGLPipeline } from './webgl-pipeline.ts';
import { TerminalTextureSource } from './terminal-texture-source.ts';

interface BridgeConfig {
  scanlineIntensity: number;
  bloomStrength: number;
  curvatureAmount: number;
  flickerRate: number;
  noiseIntensity: number;
  vignetteStrength: number;
  brightness: number;
  jitterIntensity: number;
  phosphorMaskIntensity: number;
  cornerPinch: number;
  burnInStrength: number;
  sourceOpacity: number;
  hardScan: number;
  hardPix: number;
  beamMinWidth: number;
  beamMaxWidth: number;
  beamPower: number;
  maskPitch: number;
  maskDark: number;
  maskLight: number;
  bloomThreshold: number;
  bloomKnee: number;
  crtGamma: number;
  monitorGamma: number;
}

/**
 * EffectsBridge connects the CRT effects pipeline to the terminal DOM element.
 * Manages overlay canvas positioning, z-index layering, resize handling,
 * and DOM-to-texture capture for content-aware WebGL rendering.
 */
export class EffectsBridge {
  private terminalElement: HTMLElement | null = null;
  private webglPipeline: WebGLPipeline | null = null;
  private textureSource: TerminalTextureSource | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private boundWindowResizeHandler: (() => void) | null = null;
  private isAttached = false;
  private captureTimerId: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private scrollContainer: HTMLElement | null = null;
  private boundScrollHandler: (() => void) | null = null;
  private contentDirty = true;
  private captureInFlight = false;
  private readonly captureIntervalMs = 80;
  private onCaptureWork: (() => void) | null = null;

  constructor(config: BridgeConfig) {
    this.webglPipeline = new WebGLPipeline(config);
  }

  /**
   * Attach the effects overlay to a terminal DOM element.
   * Positions the overlay canvas absolutely over the terminal.
   * Initializes WebGL BEFORE any DOM mutation, so a failure leaves
   * zero side effects and the caller can apply the CSS fallback.
   * @param terminalElement - The terminal container element
   * @returns True if the WebGL pipeline initialized and the overlay attached
   */
  attach(terminalElement: HTMLElement): boolean {
    if (this.isAttached) {
      this.detach();
    }

    // Initialize WebGL pipeline first — no DOM side effects on failure
    const success = this.webglPipeline?.initialize() ?? false;
    if (!success) {
      this.webglPipeline?.destroy();
      this.webglPipeline = null;
      return false;
    }

    this.terminalElement = terminalElement;

    // Ensure terminal has positioning context
    const computedStyle = window.getComputedStyle(terminalElement);
    if (computedStyle.position === 'static') {
      terminalElement.style.position = 'relative';
    }

    // Create texture source for DOM capture
    this.textureSource = new TerminalTextureSource(terminalElement);

    // Insert overlay canvas into terminal
    const canvas = this.webglPipeline?.getCanvas();
    if (canvas) {
      canvas.style.zIndex = 'var(--crt-z-overlay, 40)';
      terminalElement.appendChild(canvas);
    }

    // Mark terminal as WebGL active
    terminalElement.classList.add('crt-terminal--webgl-active');

    // Set up resize handling
    this.setupResizeHandling();
    this.handleResize();

    this.isAttached = true;
    return true;
  }

  setCaptureWorkCallback(callback: (() => void) | null): void {
    this.onCaptureWork = callback;
  }

  setContextEventCallbacks(
    onLost: (() => void) | null,
    onRestored: (() => void) | null
  ): void {
    this.webglPipeline?.setContextEventCallbacks(onLost, onRestored);
  }

  /**
   * Detach the effects overlay and clean up.
   */
  detach(): void {
    if (!this.isAttached) return;

    // Stop capture loop
    this.stopCaptureLoop();

    // Stop WebGL pipeline
    if (this.webglPipeline) {
      this.webglPipeline.stop();
      const canvas = this.webglPipeline.getCanvas();
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this.webglPipeline.destroy();
      this.webglPipeline = null;
    }

    // Clean up texture source
    this.textureSource = null;

    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up window resize listener
    if (this.boundWindowResizeHandler) {
      window.removeEventListener('resize', this.boundWindowResizeHandler);
      this.boundWindowResizeHandler = null;
    }

    // Remove WebGL active class
    if (this.terminalElement) {
      this.terminalElement.classList.remove('crt-terminal--webgl-active');
    }

    this.terminalElement = null;
    this.isAttached = false;
  }

  /**
   * Set up resize handling via ResizeObserver and window resize fallback.
   */
  private setupResizeHandling(): void {
    if (!this.terminalElement) return;

    this.boundWindowResizeHandler = () => {
      this.handleResize();
    };

    window.addEventListener('resize', this.boundWindowResizeHandler);

    // Use ResizeObserver for element-level changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.terminalElement);
    }
  }

  /**
   * Update canvas size to match the terminal element.
   */
  handleResize(): void {
    if (!this.terminalElement || !this.webglPipeline) return;

    const rect = this.terminalElement.getBoundingClientRect();
    this.webglPipeline.resize(rect.width, rect.height);
    this.invalidateContent();
  }

  /**
   * Enable effects rendering and start the capture/render loop.
   */
  enable(): void {
    this.webglPipeline?.start();
    this.startCaptureLoop();
  }

  /**
   * Disable effects rendering and stop the capture loop.
   */
  disable(): void {
    this.webglPipeline?.stop();
    this.stopCaptureLoop();
  }

  /**
   * Start the capture loop.
   * Re-captures the terminal DOM to a texture whenever its content changes.
   */
  private startCaptureLoop(): void {
    if (this.captureTimerId !== null) return;

    // A DOM capture is orders of magnitude more expensive than a frame, and it
    // blocks the main thread — capturing every rAF starves the render loop down
    // to a few FPS. The terminal is static between writes, so only re-capture
    // when the DOM actually changed. The shader keeps animating at full rate
    // off the last captured texture.
    const pump = (): void => {
      this.captureTimerId = window.setTimeout(pump, this.captureIntervalMs);

      if (!this.contentDirty || this.captureInFlight) return;
      if (!this.textureSource || !this.webglPipeline) return;

      this.contentDirty = false;
      this.captureInFlight = true;

      void this.textureSource
        .capture()
        .then((canvas) => {
          if (canvas) {
            this.webglPipeline?.updateSourceTexture(canvas);
          }
        })
        .finally(() => {
          this.captureInFlight = false;
          this.onCaptureWork?.();
        });
    };

    this.observeContent();
    pump();
  }

  /**
   * Stop the capture/render loop.
   */
  private stopCaptureLoop(): void {
    if (this.captureTimerId !== null) {
      clearTimeout(this.captureTimerId);
      this.captureTimerId = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.scrollContainer && this.boundScrollHandler) {
      this.scrollContainer.removeEventListener('scroll', this.boundScrollHandler);
    }
    this.scrollContainer = null;
    this.boundScrollHandler = null;
  }

  /** Mark the texture stale whenever terminal content changes or scrolls. */
  private observeContent(): void {
    if (!this.terminalElement || this.mutationObserver) return;

    this.mutationObserver = new MutationObserver(() => {
      this.contentDirty = true;
    });

    this.mutationObserver.observe(this.terminalElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Changing the scroll position is not a DOM mutation — without this the
    // overlay would never refresh while the user scrolls the output history.
    const scroller =
      this.terminalElement.querySelector<HTMLElement>('.crt-terminal__output');
    if (scroller) {
      this.scrollContainer = scroller;
      this.boundScrollHandler = () => {
        this.contentDirty = true;
      };
      scroller.addEventListener('scroll', this.boundScrollHandler, {
        passive: true,
      });
    }
  }

  /** Force a re-capture on the next pump (used after resize). */
  private invalidateContent(): void {
    this.contentDirty = true;
  }

  /**
   * Update effect configuration.
   * @param config - New configuration values
   */
  updateConfig(config: BridgeConfig): void {
    this.webglPipeline?.updateConfig(config);
  }

  /**
   * Check if the bridge is currently attached.
   * @returns True if attached to a terminal element
   */
  isBridgeAttached(): boolean {
    return this.isAttached;
  }
}
