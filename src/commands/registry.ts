import type {
  Command,
  CommandContext,
  CommandRegistry as ICommandRegistry,
  CommandResult,
} from '../types/commands';
import { helpCommand } from './impl/help';
import { clearCommand } from './impl/clear';
import { echoCommand } from './impl/echo';
import { neofetchCommand } from './impl/neofetch';

export class CommandRegistry implements ICommandRegistry {
  private readonly commands = new Map<string, Command>();
  private readonly context?: CommandContext;

  constructor(context?: CommandContext) {
    this.context = context;
    this.registerBuiltIns();
  }

  register(cmd: Command): void {
    this.commands.set(cmd.name, cmd);
  }

  async execute(name: string, args: string[]): Promise<CommandResult> {
    const cmd = this.commands.get(name);
    if (!cmd) {
      return {
        lines: [
          {
            text: `Command not found: ${name}`,
            type: 'error',
          },
        ],
        exitStatus: 1,
      };
    }

    if (!this.context) {
      return {
        lines: [
          {
            text: 'Terminal context not available',
            type: 'error',
          },
        ],
        exitStatus: 1,
      };
    }

    const result = await Promise.resolve(cmd.handler(args, this.context));
    return result;
  }

  getByName(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  getCompletions(prefix: string): string[] {
    const names: string[] = [];
    for (const name of this.commands.keys()) {
      if (name.startsWith(prefix)) {
        names.push(name);
      }
    }
    return names.sort();
  }

  private registerBuiltIns(): void {
    this.register(helpCommand);
    this.register(clearCommand);
    this.register(echoCommand);
    this.register(neofetchCommand);
  }
}
