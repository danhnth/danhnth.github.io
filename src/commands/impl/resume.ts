import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { profile } from '../../data/profile';

export const resumeCommand: Command = {
  id: 'builtin:resume',
  name: 'resume',
  description: 'Download resume PDF',
  usage: 'resume',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [
      { text: 'RESUME', type: 'heading' },
      { text: '', type: 'text' },
      { text: 'Download my resume as PDF:', type: 'text' },
      { text: '', type: 'text' },
      { text: profile.resumeUrl, type: 'link' },
    ];

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default resumeCommand;