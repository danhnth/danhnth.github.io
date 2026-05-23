import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { skills } from '../../data/skills';

const CATEGORY_LABELS: Record<keyof typeof skills, string> = {
  languages: 'LANGUAGES',
  tools: 'TOOLS',
  platforms: 'PLATFORMS',
  security: 'SECURITY & MONITORING',
};

const CATEGORY_ORDER: (keyof typeof skills)[] = ['languages', 'tools', 'platforms', 'security'];

function formatCategory(category: keyof typeof skills): OutputLine[] {
  const items = skills[category];
  const label = CATEGORY_LABELS[category];
  const lines: OutputLine[] = [];

  lines.push({ text: '', type: 'text' });
  lines.push({ text: label, type: 'heading' });
  lines.push({ text: '─'.repeat(40), type: 'dim' });

  for (const item of items) {
    lines.push({ text: `  ${item}`, type: 'text' });
  }

  return lines;
}

export const skillsCommand: Command = {
  id: 'builtin:skills',
  name: 'skills',
  description: 'Display skills grouped by category',
  usage: 'skills',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [
      { text: 'SKILLS', type: 'heading' },
      { text: '', type: 'text' },
    ];

    for (const category of CATEGORY_ORDER) {
      lines.push(...formatCategory(category));
    }

    lines.push({ text: '', type: 'text' });

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default skillsCommand;