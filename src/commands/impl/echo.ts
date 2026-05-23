import type { Command, CommandResult } from '../../types/commands';

/**
 * Simple variable substitution for echo.
 * Only supports a limited set of variables for security.
 */
function substituteVariables(text: string): string {
  let result = text;

  // $USER → "guest"
  result = result.replace(/\$USER\b/g, 'guest');

  // $HOST → "danhnth"
  result = result.replace(/\$HOST\b/g, 'danhnth');

  // $DATE → current date in format "YYYY-MM-DD"
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  result = result.replace(/\$DATE\b/g, dateStr);

  return result;
}

export const echoCommand: Command = {
  id: 'builtin:echo',
  name: 'echo',
  description: 'Display a line of text',
  usage: 'echo <text>',
  handler: (args: string[]): CommandResult => {
    // Join all args to preserve spaces
    const text = args.join(' ');

    if (!text) {
      return {
        lines: [{ text: '', type: 'text' }],
        exitStatus: 0,
      };
    }

    // Apply variable substitution
    const substituted = substituteVariables(text);

    return {
      lines: [{ text: substituted, type: 'text' }],
      exitStatus: 0,
    };
  },
};