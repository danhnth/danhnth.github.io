import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { profile } from '../../data/profile';

const BOX_WIDTH = 52;
const INNER_WIDTH = BOX_WIDTH - 4;

function padCenter(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

function padRight(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  return text + ' '.repeat(padding);
}

function truncate(text: string, width: number): string {
  if (text.length <= width) return text;
  return text.slice(0, width - 3) + '...';
}

function buildAsciiBox(lines: string[]): OutputLine[] {
  const result: OutputLine[] = [];

  const top = `+${'-'.repeat(INNER_WIDTH)}+`;
  const bottom = `+${'-'.repeat(INNER_WIDTH)}+`;

  result.push({ text: top, type: 'ascii' });

  for (const line of lines) {
    const safeLine = truncate(line, INNER_WIDTH);
    const content = padRight(safeLine, INNER_WIDTH);
    result.push({ text: `| ${content} |`, type: 'ascii' });
  }

  result.push({ text: bottom, type: 'ascii' });

  return result;
}

export const whoamiCommand: Command = {
  id: 'builtin:whoami',
  name: 'whoami',
  description: 'Display profile information in ASCII box',
  usage: 'whoami',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [
      { text: 'PROFILE', type: 'heading' },
      { text: '', type: 'text' },
    ];

    const boxLines: string[] = [
      padCenter(profile.name, INNER_WIDTH),
      padCenter(profile.title, INNER_WIDTH),
      '',
      padCenter(profile.location, INNER_WIDTH),
      padCenter(`${profile.university} | ${profile.year}`, INNER_WIDTH),
      padCenter(profile.major, INNER_WIDTH),
      '',
      `Email: ${profile.emailDisplay}`,
      `LinkedIn: ${profile.linkedinDisplay}`,
      `GitHub: ${profile.githubDisplay}`,
    ];

    lines.push(...buildAsciiBox(boxLines));

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default whoamiCommand;