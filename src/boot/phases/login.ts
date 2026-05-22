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
import { sleep } from '../typing';

const LOGIN_DATA = {
  username: 'guest',
  passwordLength: 8,
  passwordChar: '•',
};

function getLoginName(): string {
  // Derive a short login name from the profile email
  const emailUser = profile.email.split('@')[0];
  return emailUser || LOGIN_DATA.username;
}

export async function loginPhase(terminal: Terminal): Promise<void> {
  const loginName = getLoginName();

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: `${loginName} login: `, type: 'text' as const },
  ]);

  // Auto-type username character by character
  let typedUsername = '';
  for (const char of LOGIN_DATA.username) {
    await sleep(120);
    typedUsername += char;
    terminal.writeOutput([
      {
        text: `${loginName} login: ${typedUsername}`,
        type: 'text' as const,
      },
    ]);
  }

  await sleep(400);

  // Password prompt
  terminal.writeOutput([
    { text: 'Password: ', type: 'text' as const },
  ]);

  // Auto-type password dots
  let typedPassword = '';
  for (let i = 0; i < LOGIN_DATA.passwordLength; i++) {
    await sleep(80);
    typedPassword += LOGIN_DATA.passwordChar;
    terminal.writeOutput([
      {
        text: `Password: ${typedPassword}`,
        type: 'text' as const,
      },
    ]);
  }

  await sleep(600);

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: 'Login successful', type: 'success' as const },
    {
      text: `Welcome to DANHNTH Systems, ${profile.name}.`,
      type: 'text' as const,
    },
    { text: '', type: 'text' as const },
  ]);

  await sleep(600);
}
