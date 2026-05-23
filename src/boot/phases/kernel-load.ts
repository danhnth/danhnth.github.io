/**
 * Kernel Load Phase
 *
 * Duration: ~5 seconds
 * - Loading kernel message
 * - Module initialization with [OK] status
 * - Kernel loaded confirmation
 */

import type { Terminal } from '../../types/terminal';
import { sleep } from '../typing';
import { KERNEL_STRINGS } from '../../data/boot-strings';

const KERNEL_DATA = {
  version: 'Linux version 6.8.0-danhnth-generic',
  compiler: '(gcc version 13.2.0)',
  drivers: [
    { name: 'usbcore: registered new interface driver usbfs', status: 'OK' as const },
    { name: 'usbcore: registered new interface driver hub', status: 'OK' as const },
    { name: 'usbcore: registered new device driver usb', status: 'OK' as const },
    { name: 'ACPI: bus type USB registered', status: 'OK' as const },
    { name: 'scsi host0: ahci', status: 'OK' as const },
    { name: 'scsi host1: ahci', status: 'OK' as const },
    { name: 'ata1.00: ATA-10: WDC WD10EZEX', status: 'OK' as const },
    { name: 'ata1.00: 1953525168 sectors', status: 'OK' as const },
    { name: 'ata2.00: ATA-11: Samsung SSD 860', status: 'OK' as const },
    { name: 'ata2.00: 976773168 sectors', status: 'OK' as const },
    { name: 'nvme nvme0: pci function 0000:03:00.0', status: 'OK' as const },
    { name: 'nvme nvme0: missing interrupt handler', status: 'FAILED' as const },
    { name: 'nvme nvme0: 8/0/0 default/read/poll queues', status: 'OK' as const },
    { name: 'input: AT Translated Set 2 keyboard', status: 'OK' as const },
    { name: 'input: SynPS/2 Synaptics TouchPad', status: 'OK' as const },
    { name: 'input: USB Optical Mouse', status: 'OK' as const },
    { name: 'rtc_cmos 00:01: rtc core: registered', status: 'OK' as const },
    { name: 'NET: Registered PF_INET protocol family', status: 'OK' as const },
    { name: 'NET: Registered PF_INET6 protocol family', status: 'OK' as const },
    { name: 'Loading compiled-in X.509 certificates', status: 'OK' as const },
  ],
};

export async function kernelLoadPhase(terminal: Terminal): Promise<void> {
  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: KERNEL_STRINGS.loading, type: 'heading' as const },
  ]);

  await sleep(800);

  terminal.writeOutput([
    { text: KERNEL_DATA.version, type: 'text' as const },
    { text: KERNEL_DATA.compiler, type: 'dim' as const },
    { text: '', type: 'text' as const },
  ]);

  await sleep(400);

  for (const driver of KERNEL_DATA.drivers) {
    const statusType = driver.status === 'OK' ? 'success' : 'error';
    terminal.writeOutput([
      {
        text: `${driver.name} ... [${driver.status}]`,
        type: statusType,
      },
    ]);
    await sleep(180);
  }

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: KERNEL_STRINGS.loaded, type: 'success' as const },
  ]);

  await sleep(400);
}
