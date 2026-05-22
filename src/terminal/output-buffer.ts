import type { OutputLine } from '../types/terminal.ts';

/**
 * Renders OutputLine objects into a scrollable DOM container.
 * Auto-scrolls to bottom on new output.
 * Supports clearing the buffer.
 */
export class OutputBuffer {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'crt-terminal__output';
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  /** Append lines to the output buffer. */
  append(lines: OutputLine[]): void {
    for (const line of lines) {
      const el = this.createLineElement(line);
      this.container.appendChild(el);
    }
    this.scrollToBottom();
  }

  /** Clear all output. */
  clear(): void {
    this.container.innerHTML = '';
  }

  /** Scroll to the bottom of the output. */
  scrollToBottom(): void {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      this.container.scrollTop = this.container.scrollHeight;
    });
  }

  private createLineElement(line: OutputLine): HTMLDivElement {
    const el = document.createElement('div');
    el.className = this.getClassForType(line.type);
    if (line.className) {
      el.classList.add(line.className);
    }

    if (line.type === 'link') {
      const anchor = document.createElement('a');
      anchor.href = line.text;
      anchor.textContent = line.text;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      el.appendChild(anchor);
    } else {
      el.textContent = line.text;
    }

    return el;
  }

  private getClassForType(type: OutputLine['type']): string {
    switch (type) {
      case 'heading':
        return 'crt-line--heading';
      case 'error':
        return 'crt-line--error';
      case 'success':
        return 'crt-line--success';
      case 'dim':
        return 'crt-line--dim';
      case 'ascii':
        return 'crt-line--ascii';
      case 'link':
        return 'crt-line--link';
      case 'text':
      default:
        return 'crt-line--text';
    }
  }
}
