/**
 * Welcome Message Renderer
 *
 * Displays a formatted welcome sequence after successful login.
 * Features line-by-line typing animation for visual effect.
 */

import type { Terminal } from '../types/terminal';
import { sleep } from './typing';

const WELCOME_LINES = [
  { text: 'Last login: %DATETIME% from localhost', type: 'dim' as const },
  { text: '', type: 'text' as const },
  {
    text: '╔══════════════════════════════════════════════════════════════╗',
    type: 'ascii' as const,
  },
  {
    text: '║                                                              ║',
    type: 'ascii' as const,
  },
  {
    text: '║       W E L C O M E   T O   D A N H N T H   S Y S T E M S  ║',
    type: 'ascii' as const,
  },
  {
    text: '║                                                              ║',
    type: 'ascii' as const,
  },
  {
    text: '╚══════════════════════════════════════════════════════════════╝',
    type: 'ascii' as const,
  },
  { text: '', type: 'text' as const },
  {
    text: 'Kernel: danhn-term v1.0 | Uptime: just started | Shell: danhn-sh',
    type: 'dim' as const,
  },
  { text: '', type: 'text' as const },
  { text: "Type 'help' for available commands", type: 'text' as const },
  { text: "Hint: Try 'neofetch' for system info", type: 'dim' as const },
];

const ABBREVIATED_WELCOME = [
  { text: '', type: 'text' as const },
  { text: 'Welcome back. Type \'help\' for commands.', type: 'text' as const },
  { text: '', type: 'text' as const },
];

/** Get current date/time in terminal-style format */
function getLastLoginTime(): string {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  // year not needed for terminal-style format
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${month} ${day} ${hours}:${minutes}:${seconds}`;
}

/** Replace %DATETIME% placeholder with actual time */
function getWelcomeLines(): Array<{ text: string; type: 'text' | 'dim' | 'ascii' }> {
  return WELCOME_LINES.map((line) => ({
    ...line,
    text: line.text.replace('%DATETIME%', getLastLoginTime()),
  }));
}

/**
 * Show full welcome message with typing animation.
 * Called after successful login during full boot sequence.
 */
export async function showWelcomeMessage(terminal: Terminal): Promise<void> {
  const lines = getWelcomeLines();

  for (const line of lines) {
    terminal.writeOutput([{ text: line.text, type: line.type }]);
    await sleep(150);
  }
}

/**
 * Show abbreviated welcome message for returning visitors.
 * Called when skipping boot sequence (revisit scenario).
 */
export function showAbbreviatedWelcome(terminal: Terminal): void {
  terminal.writeOutput(ABBREVIATED_WELCOME);
}