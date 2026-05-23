/**
 * Key definition for the touch keyboard.
 */
interface KeyDef {
  label: string;
  value: string;
  className?: string;
  span?: number;
}

/**
 * TouchKeyboard provides a virtual QWERTY keyboard overlay for mobile devices.
 *
 * Only activates on viewports < 768px or touch-capable devices.
 * On desktop the toggle button and overlay are both hidden.
 *
 * Usage:
 *   const kb = new TouchKeyboard(terminalEl, (key) => {
 *     // dispatch key to terminal input handler
 *   });
 *   kb.show();  // or let the user tap the toggle
 */
export class TouchKeyboard {
  private element: HTMLDivElement;
  private toggleButton: HTMLButtonElement;
  private visible = false;
  private onKeyPress: (key: string) => void;
  private mediaQuery: MediaQueryList;
  private isTouchDevice: boolean;
  private shiftActive = false;

  constructor(terminalElement: HTMLElement, onKeyPress: (key: string) => void) {
    this.onKeyPress = onKeyPress;
    this.isTouchDevice = this.detectTouch();
    this.mediaQuery = window.matchMedia('(max-width: 768px)');

    this.element = this.buildKeyboard();
    this.toggleButton = this.buildToggle();

    terminalElement.appendChild(this.element);
    terminalElement.appendChild(this.toggleButton);

    // Initial visibility based on viewport + touch
    this.updateVisibility();

    this.mediaQuery.addEventListener('change', () => this.updateVisibility());
  }

  /**
   * Show the keyboard overlay.
   */
  show(): void {
    if (!this.shouldBeVisible()) return;
    this.visible = true;
    this.element.classList.add('touch-keyboard--visible');
    this.toggleButton.setAttribute('aria-expanded', 'true');
  }

  /**
   * Hide the keyboard overlay.
   */
  hide(): void {
    this.visible = false;
    this.element.classList.remove('touch-keyboard--visible');
    this.toggleButton.setAttribute('aria-expanded', 'false');
  }

  /**
   * Check whether the keyboard is currently visible.
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Clean up event listeners and remove elements.
   */
  destroy(): void {
    this.element.remove();
    this.toggleButton.remove();
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Determine if the keyboard should be available on this device.
   */
  private shouldBeVisible(): boolean {
    return this.mediaQuery.matches || this.isTouchDevice;
  }

  /**
   * Update visibility based on current viewport/device state.
   */
  private updateVisibility(): void {
    const available = this.shouldBeVisible();
    this.toggleButton.style.display = available ? '' : 'none';
    if (!available) {
      this.hide();
    }
  }

  /**
   * Simple touch detection.
   */
  private detectTouch(): boolean {
    const nav = navigator as Navigator & { msMaxTouchPoints?: number };
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (nav.msMaxTouchPoints !== undefined && nav.msMaxTouchPoints > 0)
    );
  }

  /**
   * Build the keyboard overlay element.
   */
  private buildKeyboard(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'touch-keyboard';
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Virtual keyboard');

    const rows: KeyDef[][] = [
      // Row 1: QWERTY top
      'qwertyuiop'.split('').map((ch) => ({ label: ch.toUpperCase(), value: ch })),
      // Row 2: ASDF home
      'asdfghjkl'.split('').map((ch) => ({ label: ch.toUpperCase(), value: ch })),
      // Row 3: Shift + ZXCVBNM + Backspace
      [
        { label: '⇧', value: 'Shift', className: 'touch-keyboard__key--shift' },
        ...'zxcvbnm'.split('').map((ch) => ({ label: ch.toUpperCase(), value: ch })),
        { label: '⌫', value: 'Backspace', className: 'touch-keyboard__key--wide' },
      ],
      // Row 4: Numbers
      '0123456789'.split('').map((ch) => ({ label: ch, value: ch })),
      // Row 5: Special keys
      [
        { label: 'Tab', value: 'Tab', className: 'touch-keyboard__key--special' },
        { label: 'Cancel', value: 'Ctrl+C', className: 'touch-keyboard__key--special' },
        { label: 'Clear', value: 'Ctrl+L', className: 'touch-keyboard__key--special' },
        { label: '←', value: 'ArrowLeft', className: 'touch-keyboard__key--arrow' },
        { label: '→', value: 'ArrowRight', className: 'touch-keyboard__key--arrow' },
        { label: '↑', value: 'ArrowUp', className: 'touch-keyboard__key--arrow' },
        { label: '↓', value: 'ArrowDown', className: 'touch-keyboard__key--arrow' },
        { label: '␣', value: ' ', className: 'touch-keyboard__key--space', span: 2 },
        { label: 'Enter', value: 'Enter', className: 'touch-keyboard__key--enter' },
      ],
    ];

    for (const row of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'touch-keyboard__row';

      for (const key of row) {
        const keyEl = document.createElement('button');
        keyEl.className = 'touch-keyboard__key';
        if (key.className) {
          keyEl.classList.add(...key.className.split(' '));
        }
        if (key.span) {
          keyEl.style.gridColumn = `span ${key.span}`;
        }
        keyEl.textContent = key.label;
        keyEl.setAttribute('type', 'button');
        keyEl.setAttribute('tabindex', '-1');
        keyEl.setAttribute('aria-label', key.label);

        // Use pointerdown for instant feedback on touch
        keyEl.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          keyEl.classList.add('touch-keyboard__key--active');
        });

        keyEl.addEventListener('pointerup', (e) => {
          e.preventDefault();
          keyEl.classList.remove('touch-keyboard__key--active');
          this.handleKey(key.value);
        });

        keyEl.addEventListener('pointercancel', () => {
          keyEl.classList.remove('touch-keyboard__key--active');
        });

        keyEl.addEventListener('pointerleave', () => {
          keyEl.classList.remove('touch-keyboard__key--active');
        });

        rowEl.appendChild(keyEl);
      }

      container.appendChild(rowEl);
    }

    return container;
  }

  /**
   * Build the floating toggle button.
   */
  private buildToggle(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'touch-keyboard__toggle';
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Toggle virtual keyboard');
    btn.setAttribute('aria-expanded', 'false');
    // Keyboard icon using simple SVG
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/><line x1="18" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>';

    btn.addEventListener('click', () => {
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
    });

    return btn;
  }

  /**
   * Handle a key press and dispatch to the callback.
   */
  private handleKey(value: string): void {
    if (value === 'Shift') {
      this.shiftActive = !this.shiftActive;
      this.updateShiftState();
      return;
    }

    // Reset shift after a non-shift key press
    if (this.shiftActive) {
      this.shiftActive = false;
      this.updateShiftState();
    }

    this.onKeyPress(value);
  }

  /**
   * Update letter key labels based on shift state.
   */
  private updateShiftState(): void {
    const letterKeys = this.element.querySelectorAll<HTMLButtonElement>(
      '.touch-keyboard__key:not(.touch-keyboard__key--shift):not(.touch-keyboard__key--special):not(.touch-keyboard__key--arrow):not(.touch-keyboard__key--space):not(.touch-keyboard__key--enter):not(.touch-keyboard__key--wide)'
    );

    for (const keyEl of letterKeys) {
      const currentLabel = keyEl.textContent ?? '';
      if (this.shiftActive) {
        keyEl.textContent = currentLabel.toUpperCase();
      } else {
        keyEl.textContent = currentLabel.toLowerCase();
      }
    }

    const shiftKey = this.element.querySelector<HTMLButtonElement>(
      '.touch-keyboard__key--shift'
    );
    if (shiftKey) {
      shiftKey.classList.toggle('touch-keyboard__key--shift-active', this.shiftActive);
    }
  }
}
