import type { Command, CommandResult } from '../../types/commands';

export const clearCommand: Command = {
  id: 'builtin:clear',
  name: 'clear',
  description: 'Clear the terminal screen',
  usage: 'clear',
  handler: (): CommandResult => {
    return {
      lines: [],
      clearBefore: true,
      exitStatus: 0,
    };
  },
};
