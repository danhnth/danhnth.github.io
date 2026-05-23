/**
 * Hardware Detect Phase
 *
 * Duration: ~3 seconds
 * - Detecting hardware message
 * - Individual device checks with [OK] status
 * - Summary line
 */

import type { Terminal } from '../../types/terminal';
import { sleep } from '../typing';
import { HARDWARE_STRINGS } from '../../data/boot-strings';

const HARDWARE_DATA = {
  ideDrives: [
    { name: 'HDA: WDC WD10EZEX-00BN5A0', size: '1.0 TB', status: 'OK' as const },
    { name: 'HDB: SAMSUNG SSD 860 EVO', size: '500 GB', status: 'OK' as const },
  ],
  networkInterfaces: [
    { name: 'eth0', mac: '00:1a:2b:3c:4d:5e', status: 'OK' as const },
    { name: 'wlan0', mac: '00:1a:2b:3c:4d:5f', status: 'OK' as const },
    { name: 'lo', mac: '00:00:00:00:00:00', status: 'OK' as const },
  ],
  otherDevices: [
    { name: 'USB Bus 001', status: 'OK' as const },
    { name: 'USB Bus 002', status: 'OK' as const },
    { name: 'ACPI Thermal Zone', status: 'OK' as const },
    { name: 'PCI Bridge', status: 'OK' as const },
  ],
};

export async function hardwareDetectPhase(terminal: Terminal): Promise<void> {
  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: HARDWARE_STRINGS.detectingIde, type: 'dim' as const },
  ]);

  await sleep(600);

  for (const drive of HARDWARE_DATA.ideDrives) {
    terminal.writeOutput([
      {
        text: `  ${drive.name} (${drive.size}) ... [${drive.status}]`,
        type: 'text' as const,
      },
    ]);
    await sleep(400);
  }

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: HARDWARE_STRINGS.detectingNetwork, type: 'dim' as const },
  ]);

  await sleep(600);

  for (const iface of HARDWARE_DATA.networkInterfaces) {
    terminal.writeOutput([
      {
        text: `  ${iface.name} (${iface.mac}) ... [${iface.status}]`,
        type: 'text' as const,
      },
    ]);
    await sleep(300);
  }

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: HARDWARE_STRINGS.detectingPeripheral, type: 'dim' as const },
  ]);

  await sleep(400);

  for (const device of HARDWARE_DATA.otherDevices) {
    terminal.writeOutput([
      {
        text: `  ${device.name} ... [${device.status}]`,
        type: 'text' as const,
      },
    ]);
    await sleep(200);
  }

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: HARDWARE_STRINGS.complete, type: 'success' as const },
  ]);

  await sleep(400);
}
