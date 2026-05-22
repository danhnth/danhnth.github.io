export { CommandRegistry } from './registry';
export { PluginManager } from './plugin';
export { helpCommand } from './impl/help';
export { clearCommand } from './impl/clear';
export type {
  CommandHandler,
  Command,
  CommandResult,
  CommandContext,
  PluginManifest,
  CommandMap,
  CommandFilter,
} from './types';
export type { CommandRegistry as ICommandRegistry } from './types';
