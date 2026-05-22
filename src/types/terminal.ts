export type TerminalState = 'idle' | 'booting' | 'ready' | 'processing';
export type TerminalEvent = 'input' | 'output' | 'clear' | 'resize';

export interface OutputLine {
  text: string;
  type: 'text' | 'heading' | 'error' | 'success' | 'dim' | 'ascii' | 'link';
  className?: string;
}

export interface CursorPosition {
  line: number;
  column: number;
  visible: boolean;
}

export interface Terminal {
  writeOutput(lines: OutputLine[]): void;
  clear(): void;
  focus(): void;
  setState(state: TerminalState): void;
  getState(): TerminalState;
}