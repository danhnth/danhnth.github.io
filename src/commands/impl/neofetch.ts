import type { Command, CommandResult, CommandContext } from '../../types/commands';
import { detectGPUTier } from '../../utils/gpu-detect';

interface NeofetchOptions {
  user: string;
  host: string;
  bootTime: number; // timestamp when boot completed
  termName: string;
  shellName: string;
}

/**
 * Formats uptime from boot completion timestamp.
 */
function formatUptime(bootTime: number): string {
  const now = Date.now();
  const diffMs = now - bootTime;

  // Calculate time components
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

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
 * Gets GPU tier display string.
 */
function getGPUDisplay(): string {
  const tier = detectGPUTier();
  const gpuLabels: Record<string, string> = {
    high: 'Virtual (High)',
    low: 'Virtual (Low)',
    minimal: 'Virtual (Minimal)',
  };
  return gpuLabels[tier] ?? 'Virtual';
}

/**
 * Builds the ASCII art logo for DANH.
 */
function buildAsciiLogo(): string[] {
  return [
    '  ██████╗ ',
    ' ██╔═══██╗',
    ' ██║   ██║',
    ' ██║   ██║',
    ' ╚██████╔╝',
    '  ╚═════╝ ',
    '',
    ' █████╗ ██████╗ ███████╗███╗   ██╗',
    '██╔══██╗██╔══██╗██╔════╝████╗  ██║',
    '███████║██████╔╝█████╗  ██╔██╗ ██║',
    '██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║',
    '██║  ██║██║  ██║███████╗██║ ╚████║',
    '╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝',
    '██████╗ ██╗  ██╗ █████╗ ███╗   ██╗████████╗███████╗██████╗ ███╗   ███╗',
    '██╔══██╗██║  ██║██╔══██╗████╗  ██║╚══██╔══╝██╔════╝██╔══██╗████╗ ████║',
    '██████╔╝███████║███████║██╔██╗ ██║   ██║   █████╗  ██████╔╝██╔████╔██║',
    '██╔══██╗██╔══██║██╔══██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║',
    '██║  ██║██║  ██║██║  ██║██║ ╚████║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║',
    '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝',
  ];
}

/**
 * Builds info lines for neofetch output.
 */
function buildInfoLines(opts: NeofetchOptions): Array<{ label: string; value: string }> {
  return [
    { label: 'Terminal', value: opts.termName },
    { label: 'Host', value: opts.host },
    { label: 'Uptime', value: formatUptime(opts.bootTime) },
    { label: 'Shell', value: opts.shellName },
    { label: 'Resolution', value: getResolution() },
    { label: 'Theme', value: 'Green Phosphor' },
    { label: 'CPU', value: 'virtual' },
    { label: 'Memory', value: getGPUDisplay() },
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

  for (let i = 0; i < logoLines.length; i++) {
    if (i < infoLines.length) {
      const paddedLabel = infoLines[i].label.padEnd(maxLabelLen);
      lines.push(`${logoLines[i]}  ${paddedLabel}  ${infoLines[i].value}`);
    } else if (i === infoLines.length) {
      lines.push(`${logoLines[i]}`);
    } else {
      lines.push(logoLines[i]);
    }
  }

  return lines;
}

export const neofetchCommand: Command = {
  id: 'builtin:neofetch',
  name: 'neofetch',
  description: 'Display system information',
  usage: 'neofetch',
  handler: (_args: string[], _context: CommandContext): CommandResult => {
    const bootTime = Date.now();
    const user = 'guest';
    const host = 'danhnth';

    const logoLines = buildAsciiLogo();
    const infoLines = buildInfoLines({
      user,
      host,
      bootTime,
      termName: 'danhn-term v1.0',
      shellName: 'danhn-sh',
    });

    const formattedLines = formatNeofetchOutput(logoLines, infoLines);

    return {
      lines: formattedLines.map((line) => ({ text: line, type: 'ascii' as const })),
      exitStatus: 0,
    };
  },
};