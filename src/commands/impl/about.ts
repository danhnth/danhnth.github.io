import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { profile } from '../../data/profile';

const KEYWORDS = ['HCMUT', 'Cybersecurity', 'Intrusion Detection Systems', 'SOC'];

function highlightKeywords(text: string): OutputLine[] {
  const lines: OutputLine[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let earliestKw = '';

    for (const kw of KEYWORDS) {
      const idx = remaining.indexOf(kw);
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        earliestKw = kw;
      }
    }

    if (earliestKw === '') {
      lines.push({ text: remaining, type: 'text' });
      break;
    }

    if (earliestIdx > 0) {
      lines.push({ text: remaining.substring(0, earliestIdx), type: 'text' });
    }

    lines.push({
      text: earliestKw,
      type: 'text',
      className: 'highlight-green',
    });

    remaining = remaining.substring(earliestIdx + earliestKw.length);
  }

  return lines;
}

export const aboutCommand: Command = {
  id: 'builtin:about',
  name: 'about',
  description: 'Display biography with highlighted keywords',
  usage: 'about',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [
      { text: 'ABOUT', type: 'heading' },
      { text: '', type: 'text' },
      ...highlightKeywords(profile.bio),
      { text: '', type: 'text' },
      { text: '─'.repeat(40), type: 'dim' },
      { text: '', type: 'text' },
      { text: 'Current Status', type: 'heading' },
      { text: '', type: 'text' },
      { text: `${profile.year} student at ${profile.university}`, type: 'text' },
      { text: `Major: ${profile.major}`, type: 'text' },
      { text: `Location: ${profile.location}`, type: 'text' },
    ];

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default aboutCommand;