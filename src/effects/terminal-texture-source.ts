import { toCanvas } from 'html-to-image';

/**
 * TerminalTextureSource captures the terminal DOM element to a canvas texture
 * using html-to-image's toCanvas() function. This enables the WebGL shader
 * to sample actual terminal content rather than generating procedural colors.
 *
 * Captures are throttled to a maximum of once every 50ms to avoid performance issues.
 */
export class TerminalTextureSource {
  private terminalElement: HTMLElement;
  private lastCanvas: HTMLCanvasElement | null = null;
  private lastCaptureTime = 0;
  private readonly captureThrottleMs = 50;

  constructor(terminalElement: HTMLElement) {
    this.terminalElement = terminalElement;
  }

  /**
   * Capture the terminal element to a canvas.
   * Throttled: only captures if at least 50ms have passed since the last capture.
   * @returns The captured canvas, or null if throttled
   */
  async capture(): Promise<HTMLCanvasElement | null> {
    const now = performance.now();
    if (now - this.lastCaptureTime < this.captureThrottleMs) {
      return this.lastCanvas;
    }

    try {
      const canvas = await toCanvas(this.terminalElement, {
        pixelRatio: 1,
        backgroundColor: '#0a0a0a',
        // The webfont is already loaded in the document; letting html-to-image
        // re-fetch and inline it hits a cross-origin CSSStyleSheet read that
        // throws SecurityError on every single capture.
        skipFonts: true,
        filter: (node: Node) => {
          if (!(node instanceof HTMLElement)) return true;
          // Exclude the WebGL overlay canvas to prevent feedback loops,
          // and the dev tuning panel so it never enters the simulation.
          if (node.classList.contains('crt-webgl-overlay')) return false;
          if (node.classList.contains('crt-tuner')) return false;
          return true;
        },
      });
      this.lastCanvas = canvas;
      this.lastCaptureTime = now;
      return canvas;
    } catch (error) {
      // Capture can fail if the element is not visible or during transitions
      console.warn('[TerminalTextureSource] Capture failed:', error);
      return this.lastCanvas;
    }
  }

  /**
   * Returns the last captured canvas, or null if no capture has been made yet.
   */
  getLastCanvas(): HTMLCanvasElement | null {
    return this.lastCanvas;
  }
}
