import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { contact } from '../../data/contact';

export const contactCommand: Command = {
  id: 'builtin:contact',
  name: 'contact',
  description: 'Display contact information',
  usage: 'contact',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [
      { text: 'CONTACT', type: 'heading' },
      { text: '', type: 'text' },
      { text: 'Email', type: 'heading' },
      { text: contact.email, type: 'link' },
      { text: '', type: 'text' },
      { text: 'LinkedIn', type: 'heading' },
      { text: contact.linkedin, type: 'link' },
      { text: '', type: 'text' },
      { text: 'GitHub', type: 'heading' },
      { text: contact.github, type: 'link' },
    ];

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default contactCommand;