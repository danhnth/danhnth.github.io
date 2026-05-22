import type {
  Command,
  CommandHandler,
  CommandResult,
  CommandContext,
  PluginManifest,
  CommandRegistry,
} from '../types/commands';

export type {
  Command,
  CommandHandler,
  CommandResult,
  CommandContext,
  PluginManifest,
  CommandRegistry,
};

/** Utility type for a map of command names to Command objects. */
export type CommandMap = Map<string, Command>;

/** Utility type for filtering commands by a predicate. */
export type CommandFilter = (cmd: Command) => boolean;
