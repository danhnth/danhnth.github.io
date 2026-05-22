import { Cursor } from './cursor.ts';

/**
 * Renders the terminal input line: prompt + typed text + blinking cursor.
 * Manages cursor position within the input text.
 */
export class InputLine {
  private container: HTMLDivElement;
  private promptEl: HTMLSpanElement;
  private inputEl: HTMLSpanElement;
  private cursor: Cursor;
  private value = '';
  private cursorPosition = 0;

  constructor(prompt: string, cursor: Cursor) {
    this.cursor = cursor;

    this.container = document.createElement('div');
    this.container.className = 'crt-terminal__input-line';

    this.promptEl = document.createElement('span');
    this.promptEl.className = 'crt-terminal__prompt';
    this.promptEl.textContent = prompt;

    this.inputEl = document.createElement('span');
    this.inputEl.className = 'crt-terminal__input';
    this.inputEl.style.whiteSpace = 'pre-wrap';
    this.inputEl.style.wordBreak = 'break-word';

    this.container.appendChild(this.promptEl);
    this.container.appendChild(this.inputEl);

    this.render();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  /** Return the current input text. */
  getValue(): string {
    return this.value;
  }

  /** Set the input text and move cursor to the end. */
  setValue(text: string): void {
    this.value = text;
    this.cursorPosition = text.length;
    this.render();
  }

  /** Clear the input text. */
  clear(): void {
    this.value = '';
    this.cursorPosition = 0;
    this.render();
  }

  /** Move cursor one character to the left. */
  moveCursorLeft(): void {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
      this.render();
    }
  }

  /** Move cursor one character to the right. */
  moveCursorRight(): void {
    if (this.cursorPosition < this.value.length) {
      this.cursorPosition++;
      this.render();
    }
  }

  /** Insert a character at the current cursor position. */
  insertChar(char: string): void {
    const before = this.value.slice(0, this.cursorPosition);
    const after = this.value.slice(this.cursorPosition);
    this.value = before + char + after;
    this.cursorPosition++;
    this.render();
    this.cursor.onTyping();
  }

  /** Delete the character before the cursor (backspace). */
  deleteChar(): void {
    if (this.cursorPosition > 0) {
      const before = this.value.slice(0, this.cursorPosition - 1);
      const after = this.value.slice(this.cursorPosition);
      this.value = before + after;
      this.cursorPosition--;
      this.render();
      this.cursor.onTyping();
    }
  }

  /** Delete the character at the cursor position (delete key). */
  deleteCharForward(): void {
    if (this.cursorPosition < this.value.length) {
      const before = this.value.slice(0, this.cursorPosition);
      const after = this.value.slice(this.cursorPosition + 1);
      this.value = before + after;
      this.render();
      this.cursor.onTyping();
    }
  }

  /** Move cursor to the beginning of the line. */
  moveCursorToStart(): void {
    this.cursorPosition = 0;
    this.render();
  }

  /** Move cursor to the end of the line. */
  moveCursorToEnd(): void {
    this.cursorPosition = this.value.length;
    this.render();
  }

  private render(): void {
    const before = this.value.slice(0, this.cursorPosition);
    const after = this.value.slice(this.cursorPosition);

    this.inputEl.innerHTML = '';

    if (before) {
      this.inputEl.appendChild(document.createTextNode(before));
    }

    this.inputEl.appendChild(this.cursor.getElement());

    if (after) {
      this.inputEl.appendChild(document.createTextNode(after));
    }
  }
}
