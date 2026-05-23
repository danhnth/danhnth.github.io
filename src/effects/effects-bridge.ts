import { WebGLPipeline } from './webgl-pipeline.ts';

interface BridgeConfig {
  scanlineIntensity: number;
  bloomStrength: number;
  curvatureAmount: number;
  flickerRate: number;
  noiseIntensity: number;
  beamIntensity: number;
  vignetteStrength: number;
  hSyncIntensity: number;
  rgbShift: number;
  brightness: number;
  jitterIntensity: number;
  phosphorMaskIntensity: number;
  colorBleedIntensity: number;
  reflectionIntensity: number;
  cornerPinch: number;
  moiréScale: number;
}

/**
 * EffectsBridge connects the CRT effects pipeline to the terminal DOM element.
 * Manages overlay canvas positioning, z-index layering, and resize handling.
 */
export class EffectsBridge {
  private terminalElement: HTMLElement | null = null;
  private webglPipeline: WebGLPipeline | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private boundWindowResizeHandler: (() => void) | null = null;
  private isAttached = false;

  constructor(config: BridgeConfig) {
    this.webglPipeline = new WebGLPipeline(config);
  }

  /**
   * Attach the effects overlay to a terminal DOM element.
   * Positions the overlay canvas absolutely over the terminal.
   * @param terminalElement - The terminal container element
   */
  attach(terminalElement: HTMLElement): void {
    if (this.isAttached) {
      this.detach();
    }

    this.terminalElement = terminalElement;

    // Ensure terminal has positioning context
    const computedStyle = window.getComputedStyle(terminalElement);
    if (computedStyle.position === 'static') {
      terminalElement.style.position = 'relative';
    }

    // Initialize WebGL pipeline
    const success = this.webglPipeline?.initialize() ?? false;
    if (!success) {
      this.webglPipeline?.destroy();
      this.webglPipeline = null;
      return;
    }

    // Insert overlay canvas into terminal
    const canvas = this.webglPipeline?.getCanvas();
    if (canvas) {
      canvas.style.zIndex = 'var(--crt-z-overlay, 40)';
      terminalElement.appendChild(canvas);
    }

    // Set up resize handling
    this.setupResizeHandling();
    this.handleResize();

    this.isAttached = true;
  }

  /**
   * Detach the effects overlay and clean up.
   */
  detach(): void {
    if (!this.isAttached) return;

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
  }

  /**
   * Enable effects rendering.
   */
  enable(): void {
    this.webglPipeline?.start();
  }

  /**
   * Disable effects rendering.
   */
  disable(): void {
    this.webglPipeline?.stop();
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
