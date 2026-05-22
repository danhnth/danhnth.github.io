/**
 * ARIA live region for screen reader announcements.
 * Announces terminal output politely so it does not interrupt.
 * Can prefix messages with context (e.g., boot phase descriptions).
 */
export class AriaLive {
  private element: HTMLDivElement;
  private prefix = '';

  constructor() {
    this.element = document.createElement('div');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
    this.element.style.position = 'absolute';
    this.element.style.left = '-10000px';
    this.element.style.width = '1px';
    this.element.style.height = '1px';
    this.element.style.overflow = 'hidden';
  }

  getElement(): HTMLDivElement {
    return this.element;
  }

  /** Set a prefix added to every announcement (e.g., "Boot: "). */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /** Announce text to screen readers. */
  announce(text: string): void {
    this.element.textContent = this.prefix + text;
    // Clear after a short delay so repeated identical messages still trigger
    window.setTimeout(() => {
      this.element.textContent = '';
    }, 150);
  }

  /** Announce multiple lines joined with spaces. */
  announceLines(lines: string[]): void {
    this.announce(lines.join(' '));
  }

  /** Announce a boot phase change to screen readers. */
  announceBootPhase(phase: string): void {
    this.announce(`Boot phase: ${phase}`);
  }

  destroy(): void {
    this.element.remove();
  }
}
