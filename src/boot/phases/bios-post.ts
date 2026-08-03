/**
 * BIOS POST Phase
 *
 * Duration: ~4 seconds
 * - ASCII logo with cascade typing
 * - BIOS date / version
 * - Animated memory test counter
 * - CPU and IDE device detection
 * - POST beep (queued via audioManager)
 * - Shader warmup triggered in background
 */

import type { Terminal } from '../../types/terminal';
import { audioManager } from '../../audio/audio-manager';
import {
  sleep,
  typeText,
  animateCounter,
  printLines,
} from '../typing';

import { playBootSequence } from '../../audio/oscillator';
import { BIOS_STRINGS } from '../../data/boot-strings';

const ASCII_LOGO = [
  '    ____  ___    _   ______  __  _______  ____  _____ ___________',
  '   / __ \\/   |  / | / / __ \\/  |/  / __ \\/ __ \\/ ___// ____/ ___/',
  '  / / / / /| | /  |/ / / / / /|_/ / /_/ / / / /\\__ \\/ __/  \\__ \\',
  ' / /_/ / ___ |/ /|  / /_/ / /  / / ____/ /_/ /___/ / /___ ___/ /',
  '/_____/_/  |_/_/ |_/_____/_/  /_/_/    /_____//____/_____//____/',
];

const MEMORY_CONFIG = {
  start: 0,
  end: 16384,
  step: 128,
  prefix: BIOS_STRINGS.memoryTest,
  suffix: 'K',
  finalSuffix: 'K OK',
};

// const HARDWARE_DEVICES = [
//   { name: 'Keyboard', status: 'OK' as const },
//   { name: 'Mouse', status: 'OK' as const },
//   { name: 'Primary Master', status: 'OK' as const },
//   { name: 'Primary Slave', status: 'OK' as const },
//   { name: 'Secondary Master', status: 'OK' as const },
//   { name: 'CD-ROM Drive', status: 'OK' as const },
//   { name: 'USB Controller', status: 'OK' as const },
//   { name: 'Network Controller', status: 'OK' as const },
// ];

export async function biosPostPhase(terminal: Terminal): Promise<void> {
  terminal.clear();
  terminal.setState('booting');

  // ASCII logo
  const logoLines = ASCII_LOGO.map((line) => ({ text: line, type: 'ascii' as const }));
  terminal.writeOutput(logoLines);
  terminal.writeOutput([{ text: '', type: 'text' as const }]);

  // POST beep (deferred until audio ready)
  audioManager.playWhenReady(() => {
    playBootSequence();
  });

  await sleep(400);

  // Memory test counter animation
  await animateCounter(
    terminal,
    MEMORY_CONFIG.prefix,
    MEMORY_CONFIG.start,
    MEMORY_CONFIG.end - MEMORY_CONFIG.step,
    MEMORY_CONFIG.step,
    MEMORY_CONFIG.suffix,
    'text',
    30
  );
  terminal.writeOutput([
    {
      text: `${MEMORY_CONFIG.prefix}${MEMORY_CONFIG.end}${MEMORY_CONFIG.finalSuffix}`,
      type: 'success',
    },
  ]);

  await sleep(200);

  // CPU detection
  await typeText(terminal, BIOS_STRINGS.cpu, 'text', 25);
  await sleep(200);

  // Hardware device list
  const hardwareDevices = [
    { name: BIOS_STRINGS.keyboard, status: 'OK' as const },
    { name: BIOS_STRINGS.mouse, status: 'OK' as const },
    { name: BIOS_STRINGS.primaryMaster, status: 'OK' as const },
    { name: BIOS_STRINGS.primarySlave, status: 'OK' as const },
    { name: BIOS_STRINGS.secondaryMaster, status: 'OK' as const },
    { name: BIOS_STRINGS.cdromDrive, status: 'OK' as const },
    { name: BIOS_STRINGS.usbController, status: 'OK' as const },
    { name: BIOS_STRINGS.networkController, status: 'OK' as const },
  ];
  await printLines(
    terminal,
    hardwareDevices.map((device) => ({
      text: `${device.name} ... [${device.status}]`,
      type: 'text' as const,
    })),
    150
  );

  await sleep(150);

  terminal.writeOutput([
    { text: '', type: 'text' as const },
    { text: BIOS_STRINGS.postComplete, type: 'success' as const },
  ]);

  await sleep(400);
}
