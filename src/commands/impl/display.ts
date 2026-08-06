import type { Command, CommandResult } from '../../types/commands';
import {
  getStoredDisplayMode,
  isValidDisplayMode,
  setDisplayMode,
  type DisplayMode,
} from '../../utils/display-mode';

export const displayCommand: Command = {
  id: 'builtin:display',
  name: 'display',
  description: 'Switch between CRT and modern terminal look',
  usage: 'display [crt|modern]',
  handler: (args: string[]): CommandResult => {
    if (args.length === 0) {
      const current = getStoredDisplayMode();
      return {
        lines: [
          { text: `Current display mode: ${current}`, type: 'text' },
          { text: '', type: 'text' },
          { text: 'Choose a mode:', type: 'heading' },
          { text: '  crt     curved, glowing phosphor-CRT screen', type: 'dim' },
          { text: '  modern  flat, high-contrast modern terminal', type: 'dim' },
          { text: '', type: 'text' },
          { text: "Usage: display crt | display modern", type: 'dim' },
        ],
        exitStatus: 0,
      };
    }

    const target = args[0].toLowerCase();
    if (!isValidDisplayMode(target)) {
      return {
        lines: [
          {
            text: `Unknown display mode '${args[0]}'. Valid modes: crt, modern.`,
            type: 'error',
          },
        ],
        exitStatus: 1,
      };
    }

    setDisplayMode(target as DisplayMode);
    const applied =
      target === 'modern'
        ? 'Effects off — modern terminal UI applied.'
        : 'CRT effects re-enabled.';
    return {
      lines: [{ text: `Display mode: ${target}. ${applied}`, type: 'success' }],
      exitStatus: 0,
    };
  },
};