/**
 * Blinking block cursor with typing-aware pause.
 * Default blink interval: 530ms.
 * Pauses while typing, resumes after 1s inactivity.
 */
export class Cursor {
  private element: HTMLSpanElement;
  private blinkInterval: number | null = null;
  private pauseTimeout: number | null = null;
  private isPaused = false;
  private readonly blinkMs: number;
  private readonly pauseAfterMs: number;

  constructor(options?: { blinkMs?: number; pauseAfterMs?: number }) {
    this.blinkMs = options?.blinkMs ?? 530;
    this.pauseAfterMs = options?.pauseAfterMs ?? 1000;

    this.element = document.createElement('span');
    this.element.className = 'crt-terminal__cursor';
    this.element.setAttribute('aria-hidden', 'true');
    this.startBlink();
  }

  getElement(): HTMLSpanElement {
    return this.element;
  }

  /** Call when user types to pause blinking. */
  onTyping(): void {
    if (this.pauseTimeout) {
      window.clearTimeout(this.pauseTimeout);
    }
    this.pauseBlink();
    this.pauseTimeout = window.setTimeout(() => {
      this.resumeBlink();
    }, this.pauseAfterMs);
  }

  /** Set cursor style: block for shell, line for boot. */
  setStyle(style: 'block' | 'line'): void {
    if (style === 'line') {
      this.element.style.backgroundColor = 'var(--crt-dim)';
      this.element.style.width = '2px';
      this.element.style.height = '1em';
    } else {
      this.element.style.backgroundColor = 'var(--crt-green)';
      this.element.style.width = '0.6em';
      this.element.style.height = '1.2em';
    }
  }

  /** Show or hide the cursor. */
  setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'inline-block' : 'none';
  }

  destroy(): void {
    this.stopBlink();
    if (this.pauseTimeout) {
      window.clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
  }

  private startBlink(): void {
    if (this.blinkInterval) return;
    this.blinkInterval = window.setInterval(() => {
      if (!this.isPaused) {
        this.element.style.opacity =
          this.element.style.opacity === '0' ? '1' : '0';
      }
    }, this.blinkMs);
  }

  private stopBlink(): void {
    if (this.blinkInterval) {
      window.clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
  }

  private pauseBlink(): void {
    this.isPaused = true;
    this.element.style.opacity = '1';
  }

  private resumeBlink(): void {
    this.isPaused = false;
  }
}
