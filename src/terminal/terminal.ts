import type { Terminal as ITerminal, TerminalState, OutputLine } from '../types/terminal.ts';
import type { CommandContext, CommandRegistry } from '../types/commands.ts';
import * as data from '../data/index.ts';
import { OutputBuffer } from './output-buffer.ts';
import { InputLine } from './input-line.ts';
import { Cursor } from './cursor.ts';
import { AriaLive } from './aria-live.ts';

const PROMPT_TEXT = 'guest@danhnth:~$ ';
const HISTORY_KEY = 'crt-terminal-history';
const MAX_HISTORY = 100;

export class Terminal implements ITerminal {
  private container: HTMLDivElement;
  private outputBuffer: OutputBuffer;
  private inputLine: InputLine;
  private cursor: Cursor;
  private ariaLive: AriaLive;
  private registry: CommandRegistry | undefined;
  private state: TerminalState = 'idle';
  private history: string[] = [];
  private historyPosition = -1;
  private historyDraft = '';
  private keydownHandler: (event: KeyboardEvent) => void;
  private clickHandler: () => void;

  constructor(container?: HTMLElement, registry?: CommandRegistry) {
    this.registry = registry;
    this.loadHistory();

    if (container) {
      this.container = container as HTMLDivElement;
    } else {
      this.container = document.createElement('div');
      this.container.className = 'crt-terminal';
      document.body.appendChild(this.container);
    }

    if (!this.container.classList.contains('crt-terminal')) {
      this.container.classList.add('crt-terminal');
    }

    this.container.tabIndex = 0;
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', 'CRT Terminal');

    this.outputBuffer = new OutputBuffer();
    this.cursor = new Cursor();
    this.cursor.setStyle('block');
    this.inputLine = new InputLine(PROMPT_TEXT, this.cursor);
    this.ariaLive = new AriaLive();

    this.container.appendChild(this.outputBuffer.getElement());
    this.container.appendChild(this.inputLine.getElement());
    this.container.appendChild(this.ariaLive.getElement());

    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);

    this.clickHandler = () => {
      this.focus();
    };
    this.container.addEventListener('click', this.clickHandler);

    this.focus();
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  writeOutput(lines: OutputLine[]): void {
    this.outputBuffer.append(lines);
    const textLines = lines
      .filter((line) => line.type !== 'ascii')
      .map((line) => line.text);
    if (textLines.length > 0) {
      this.ariaLive.announceLines(textLines);
    }
  }

  clear(): void {
    this.outputBuffer.clear();
    this.ariaLive.announce('Terminal cleared');
  }

  focus(): void {
    this.container.focus();
  }

  setState(state: TerminalState): void {
    this.state = state;
    if (state === 'booting') {
      this.ariaLive.setPrefix('Boot: ');
      this.cursor.setStyle('line');
      this.inputLine.getElement().style.display = 'none';
    } else if (state === 'ready') {
      this.ariaLive.setPrefix('');
      this.cursor.setStyle('block');
      this.inputLine.getElement().style.display = '';
      this.focus();
    } else if (state === 'processing') {
      this.inputLine.getElement().style.display = 'none';
    } else {
      this.inputLine.getElement().style.display = '';
    }
  }

  getState(): TerminalState {
    return this.state;
  }

  setRegistry(registry: CommandRegistry): void {
    this.registry = registry;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    this.container.removeEventListener('click', this.clickHandler);
    this.cursor.destroy();
    this.ariaLive.destroy();
    if (this.container.parentElement && this.container.parentElement !== document.body) {
      this.container.remove();
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    const activeElement = document.activeElement;
    const isTerminalFocused =
      activeElement === this.container || this.container.contains(activeElement as Node);
    const isOtherInputFocused =
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement;

    if (!isTerminalFocused && isOtherInputFocused) {
      return;
    }

    if (this.state === 'booting') {
      return;
    }

    if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.clear();
      return;
    }

    if (event.key === 'c' && event.ctrlKey) {
      event.preventDefault();
      this.inputLine.clear();
      this.writeOutput([{ text: '^C', type: 'dim' }]);
      this.resetHistoryNavigation();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      this.handleTab();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitInput();
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.inputLine.deleteChar();
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      this.inputLine.deleteCharForward();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.inputLine.moveCursorLeft();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.inputLine.moveCursorRight();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.historyUp();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.historyDown();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.inputLine.moveCursorToStart();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.inputLine.moveCursorToEnd();
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.inputLine.insertChar(event.key);
      return;
    }
  }

  private async submitInput(): Promise<void> {
    const input = this.inputLine.getValue();
    const trimmed = input.trim();

    this.writeOutput([{ text: PROMPT_TEXT + input, type: 'text' }]);

    if (trimmed) {
      this.addToHistory(trimmed);
    }

    this.resetHistoryNavigation();
    this.inputLine.clear();

    if (!trimmed) {
      return;
    }

    const parts = trimmed.split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    await this.executeCommand(name, args);
  }

  private async executeCommand(name: string, args: string[]): Promise<void> {
    if (!this.registry) {
      this.writeOutput([
        { text: `Command not found: ${name}. Type 'help' for available commands.`, type: 'error' },
      ]);
      return;
    }

    this.setState('processing');

    const context: CommandContext = {
      terminal: this,
      data,
      registry: this.registry,
    };

    try {
      const result = await this.registry.execute(name, args, context);

      if (result.clearBefore) {
        this.clear();
      }

      if (result.lines.length > 0) {
        this.writeOutput(result.lines);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.writeOutput([
        { text: `Error executing "${name}": ${message}`, type: 'error' },
      ]);
    } finally {
      this.setState('ready');
    }
  }

  private handleTab(): void {
    if (!this.registry) return;

    const input = this.inputLine.getValue().trim();
    if (!input) return;

    const prefix = input.split(/\s+/)[0];
    const completions = this.registry.getCompletions(prefix);

    if (completions.length === 1) {
      const rest = input.slice(prefix.length);
      this.inputLine.setValue(completions[0] + rest);
    } else if (completions.length > 1) {
      this.writeOutput([
        { text: completions.join('  '), type: 'dim' },
      ]);
    }
  }

  private historyUp(): void {
    if (this.history.length === 0) return;

    if (this.historyPosition === -1) {
      this.historyDraft = this.inputLine.getValue();
    }

    if (this.historyPosition < this.history.length - 1) {
      this.historyPosition++;
      const command = this.history[this.history.length - 1 - this.historyPosition];
      this.inputLine.setValue(command);
    }
  }

  private historyDown(): void {
    if (this.historyPosition === -1) return;

    this.historyPosition--;

    if (this.historyPosition === -1) {
      this.inputLine.setValue(this.historyDraft);
    } else {
      const command = this.history[this.history.length - 1 - this.historyPosition];
      this.inputLine.setValue(command);
    }
  }

  private resetHistoryNavigation(): void {
    this.historyPosition = -1;
    this.historyDraft = '';
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch {
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {
      // Ignore localStorage errors
    }
  }

  private addToHistory(command: string): void {
    if (this.history.length > 0 && this.history[this.history.length - 1] === command) {
      return;
    }
    this.history.push(command);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    this.saveHistory();
  }
}
