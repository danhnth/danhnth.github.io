import type { Terminal, OutputLine } from './terminal';
import type { BootStep } from './boot';

export type CommandHandler = (
  args: string[],
  context: CommandContext
) => CommandResult | Promise<CommandResult>;

export interface Command {
  id: string;
  name: string;
  description: string;
  usage: string;
  handler: CommandHandler;
}

export interface CommandResult {
  lines: OutputLine[];
  clearBefore?: boolean;
  exitStatus: number;
}

export interface CommandContext {
  terminal: Terminal;
  data: typeof import('../data/index.ts');
  registry: CommandRegistry;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  commands: Command[];
  bootHooks?: BootStep[];
}

export interface CommandRegistry {
  register(cmd: Command): void;
  execute(name: string, args: string[]): Promise<CommandResult>;
  getByName(name: string): Command | undefined;
  getAll(): Command[];
  getCompletions(prefix: string): string[];
}