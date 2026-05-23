import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';

export const helpCommand: Command = {
  id: 'builtin:help',
  name: 'help',
  description: 'Display available commands',
  usage: 'help [command]',
  handler: (args: string[], context: CommandContext): CommandResult => {
    const registry = context.registry;
    const allCommands = registry.getAll().sort((a: Command, b: Command) =>
      a.name.localeCompare(b.name)
    );

    if (args.length > 0) {
      const targetName = args[0];
      const target = registry.getByName(targetName);

      if (!target) {
        return {
          lines: [
            { text: `No help available for '${targetName}'`, type: 'error' },
          ],
          exitStatus: 1,
        };
      }

      return {
        lines: [
          { text: `NAME`, type: 'heading' },
          { text: `  ${target.name}`, type: 'text' },
          { text: ``, type: 'text' },
          { text: `DESCRIPTION`, type: 'heading' },
          { text: `  ${target.description}`, type: 'dim' },
          { text: ``, type: 'text' },
          { text: `USAGE`, type: 'heading' },
          { text: `  ${target.usage}`, type: 'text' },
        ],
        exitStatus: 0,
      };
    }

    const lines: OutputLine[] = [
      { text: 'Available commands:', type: 'heading' },
      { text: '', type: 'text' },
    ];

    for (const cmd of allCommands) {
      lines.push({
        text: cmd.name,
        type: 'success',
        className: 'command-name',
      });
      lines.push({
        text: `  ${cmd.description}`,
        type: 'dim',
        className: 'command-desc',
      });
    }

    lines.push({ text: '', type: 'text' });
    lines.push({
      text: "Type 'help <command>' for detailed usage.",
      type: 'dim',
    });

    return {
      lines,
      exitStatus: 0,
    };
  },
};
