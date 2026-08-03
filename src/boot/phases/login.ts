/**
 * Login Phase
 *
 * Duration: ~3 seconds
 * - Auto-type "guest" username after prompt
 * - Auto-type password dots after prompt
 * - Login success and welcome message
 */

import type { Terminal } from '../../types/terminal';
import { profile } from '../../data/profile';
import { sleep, typePrefixed } from '../typing';
import { LOGIN_STRINGS } from '../../data/boot-strings';

const LOGIN_DATA = {
  username: 'guest',
  passwordLength: 8,
  passwordChar: '*',
};

export async function loginPhase(terminal: Terminal): Promise<void> {
  terminal.writeOutput([{ text: '', type: 'text' as const }]);

  await sleep(120);
  await typePrefixed(
    terminal,
    `${LOGIN_STRINGS.hostname} ${LOGIN_STRINGS.loginPrompt}`,
    LOGIN_DATA.username,
    'text',
    120
  );

  await sleep(400);

  terminal.writeOutput([
    { text: LOGIN_STRINGS.passwordPrompt, type: 'text' as const },
  ]);

  let typedPassword = '';
  for (let i = 0; i < LOGIN_DATA.passwordLength; i++) {
    await sleep(80);
    typedPassword += LOGIN_DATA.passwordChar;
    terminal.replaceLastLine(
      {
        text: `${LOGIN_STRINGS.passwordPrompt}${typedPassword}`,
        type: 'text' as const,
      },
      i === LOGIN_DATA.passwordLength - 1
    );
  }

  await sleep(600);

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: LOGIN_STRINGS.loginSuccess, type: 'success' as const },
    {
      text: `${LOGIN_STRINGS.welcome}, ${profile.name}.`,
      type: 'text' as const,
    },
    { text: '', type: 'text' as const },
  ]);

  await sleep(600);
}
