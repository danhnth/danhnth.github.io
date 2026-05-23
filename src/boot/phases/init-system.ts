/**
 * Init System Phase
 *
 * Duration: ~3 seconds
 * - Starting system services message
 * - Service startup confirmations
 * - System initialization complete
 */

import type { Terminal } from '../../types/terminal';
import { sleep } from '../typing';
import { INIT_STRINGS } from '../../data/boot-strings';

const INIT_DATA = {
  services: [
    { name: 'Mounting local filesystems', status: 'OK' as const },
    { name: 'Activating swap', status: 'OK' as const },
    { name: 'Setting hostname', status: 'OK' as const },
    { name: 'Configuring network interfaces', status: 'OK' as const },
    { name: 'Starting system logger', status: 'OK' as const },
    { name: 'Starting cron daemon', status: 'OK' as const },
    { name: 'Starting network daemon', status: 'OK' as const },
    { name: 'Starting security module', status: 'OK' as const },
    { name: 'Starting SSH server', status: 'OK' as const },
    { name: 'Starting web server', status: 'OK' as const },
  ],
};

export async function initSystemPhase(terminal: Terminal): Promise<void> {
  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: INIT_STRINGS.startingServices, type: 'heading' as const },
  ]);

  await sleep(500);

  for (const service of INIT_DATA.services) {
    terminal.writeOutput([
      {
        text: `${service.name} ... [${service.status}]`,
        type: 'text' as const,
      },
    ]);
    await sleep(250);
  }

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: INIT_STRINGS.complete, type: 'success' as const },
  ]);

  await sleep(400);
}
