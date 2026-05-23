import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { certs } from '../../data/certs';

function formatType(type: string): string {
  switch (type) {
    case 'certificate':
      return 'CERT';
    case 'proficiency':
      return 'PROF';
    case 'award':
      return 'AWARD';
    default:
      return type.toUpperCase().substring(0, 4);
  }
}

export const certsCommand: Command = {
  id: 'builtin:certs',
  name: 'certs',
  description: 'Display certifications',
  usage: 'certs',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [];

    lines.push({ text: 'CERTIFICATIONS', type: 'heading' });
    lines.push({ text: '', type: 'text' });

    const headerLine = '  Name                       Year  Issuer      Type';
    lines.push({ text: headerLine, type: 'dim' });
    lines.push({ text: '  ' + '─'.repeat(56), type: 'dim' });

    for (const cert of certs) {
      const name = cert.name.padEnd(26);
      const year = cert.year.toString().padEnd(5);
      const issuer = cert.issuer.padEnd(11);
      const type = formatType(cert.type);
      lines.push({ text: `  ${name} ${year} ${issuer} ${type}`, type: 'text' });
    }

    lines.push({ text: '', type: 'text' });

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default certsCommand;