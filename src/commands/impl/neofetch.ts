import type { Command, CommandResult, CommandContext } from '../../types/commands';
import { getBootTime } from '../../utils/boot-time';
import { profile } from '../../data/profile';
import { skills } from '../../data/skills';
import { projects } from '../../data/projects';
import { certs } from '../../data/certs';

interface NeofetchOptions {
  user: string;
  host: string;
  bootTime: number;
  termName: string;
  shellName: string;
}

/**
 * Formats uptime from boot completion timestamp.
 */
function formatUptime(bootTime: number): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - bootTime);

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Gets resolution string.
 */
function getResolution(): string {
  if (typeof window === 'undefined') return 'unknown';
  return `${window.innerWidth}x${window.innerHeight}`;
}

/**
 * Counts total skills across all categories.
 */
function getSkillsCount(): number {
  return Object.values(skills).reduce((sum, arr) => sum + arr.length, 0);
}

/**
 * Builds the ASCII art logo.
 */
function buildAsciiLogo(): string[] {
  return [
    '    ___  ____  _  _  _   _ ',
    '   / _ \\/ __ \\| || || | | |',
    '  | (_) | |__| || || || |_| |',
    '   \\___/|  ___/|_||_|| \\___/ ',
    '        |_|            |_|   ',
  ];
}

/**
 * Builds info lines for neofetch output.
 */
function buildInfoLines(opts: NeofetchOptions): Array<{ label: string; value: string }> {
  return [
    { label: 'User', value: opts.user },
    { label: 'Host', value: opts.host },
    { label: 'Uptime', value: formatUptime(opts.bootTime) },
    { label: 'Shell', value: opts.shellName },
    { label: 'Resolution', value: getResolution() },
    { label: 'Theme', value: 'Green Phosphor' },
    { label: 'Education', value: `${profile.university} (${profile.year})` },
    { label: 'Major', value: profile.major },
    { label: 'Skills', value: `${getSkillsCount()} categories` },
    { label: 'Projects', value: `${projects.length} active` },
    { label: 'Certs', value: `${certs.length} earned` },
  ];
}

/**
 * Formats and aligns neofetch output.
 */
function formatNeofetchOutput(
  logoLines: string[],
  infoLines: Array<{ label: string; value: string }>
): string[] {
  const lines: string[] = [];
  const maxLabelLen = Math.max(...infoLines.map((i) => i.label.length));

  for (let i = 0; i < Math.max(logoLines.length, infoLines.length); i++) {
    const logoPart = logoLines[i] ?? '';
    if (i < infoLines.length) {
      const paddedLabel = infoLines[i].label.padEnd(maxLabelLen);
      lines.push(`${logoPart}  ${paddedLabel}: ${infoLines[i].value}`);
    } else {
      lines.push(logoPart);
    }
  }

  return lines;
}

export const neofetchCommand: Command = {
  id: 'builtin:neofetch',
  name: 'neofetch',
  description: 'Display portfolio information',
  usage: 'neofetch',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const bootTime = getBootTime();
    const user = 'guest';
    const host = 'danhnth';

    const logoLines = buildAsciiLogo();
    const infoLines = buildInfoLines({
      user,
      host,
      bootTime,
      termName: 'danhn-term v2.0',
      shellName: 'danhn-sh',
    });

    const formattedLines = formatNeofetchOutput(logoLines, infoLines);

    return {
      lines: formattedLines.map((line) => ({ text: line, type: 'ascii' as const })),
      exitStatus: 0,
    };
  },
};