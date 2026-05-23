/**
 * BootSequence orchestrator
 *
 * Manages the linear progression of boot phases with async/await.
 * No state machine library — just sequential phase execution.
 *
 * Features:
 * - Checks localStorage 'crt-boot-seen' to skip full boot on revisit
 * - Emits events: 'boot:start', 'boot:phase', 'boot:complete'
 * - Calls warmupShaders() during BIOS POST phase
 * - skip() jumps to shell-ready
 */

import type { Terminal } from '../types/terminal';
import type { BootPhase, BootStep, BootConfig } from '../types/boot';
import { biosPostPhase } from './phases/bios-post';
import { hardwareDetectPhase } from './phases/hardware-detect';
import { kernelLoadPhase } from './phases/kernel-load';
import { initSystemPhase } from './phases/init-system';
import { loginPhase } from './phases/login';
import { warmupShaders } from './warmup';
import { setBootTime } from '../utils/boot-time';

const BOOT_CONFIG: BootConfig = {
  skipOnRevisit: true,
  totalDurationEstimate: 18000, // ~18 seconds for full boot
};

const BOOT_SEEN_KEY = 'crt-boot-seen';

export type BootEvent = 'boot:start' | 'boot:phase' | 'boot:complete';

export class BootSequence {
  private terminal: Terminal;
  private steps: BootStep[];
  private currentPhase: BootPhase = 'power-off';
  private skipped = false;
  private running = false;
  private eventListeners: Map<BootEvent, Array<() => void>> = new Map();

  constructor(terminal: Terminal) {
    this.terminal = terminal;

    this.steps = [
      {
        phase: 'bios-post',
        duration: 4000,
        render: biosPostPhase,
        skippable: true,
      },
      {
        phase: 'hardware-detect',
        duration: 3000,
        render: hardwareDetectPhase,
        skippable: true,
      },
      {
        phase: 'kernel-load',
        duration: 5000,
        render: kernelLoadPhase,
        skippable: true,
      },
      {
        phase: 'init',
        duration: 3000,
        render: initSystemPhase,
        skippable: true,
      },
      {
        phase: 'login',
        duration: 3000,
        render: loginPhase,
        skippable: true,
      },
    ];
  }

  /** Execute the full boot sequence. */
  async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.skipped = false;

    const hasSeenBoot = localStorage.getItem(BOOT_SEEN_KEY) !== null;

    this.emit('boot:start');

    if (hasSeenBoot && BOOT_CONFIG.skipOnRevisit) {
      await this.playResumeAnimation();
    } else {
      await this.playFullBoot();
      localStorage.setItem(BOOT_SEEN_KEY, 'true');
    }

    this.currentPhase = 'shell-ready';
    this.terminal.setState('ready');
    setBootTime(Date.now());
    this.emit('boot:complete');
    this.running = false;
  }

  /** Skip to shell-ready immediately. */
  skip(): void {
    if (!this.running) return;
    this.skipped = true;
  }

  /** Subscribe to boot events. */
  on(event: BootEvent, callback: () => void): void {
    const listeners = this.eventListeners.get(event) ?? [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  /** Unsubscribe from boot events. */
  off(event: BootEvent, callback: () => void): void {
    const listeners = this.eventListeners.get(event) ?? [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  /** Get the current boot phase. */
  getCurrentPhase(): BootPhase {
    return this.currentPhase;
  }

  /** Check if boot is currently running. */
  isRunning(): boolean {
    return this.running;
  }

  /** Play the brief system resume animation for returning visitors. */
  private async playResumeAnimation(): Promise<void> {
    this.terminal.clear();
    this.terminal.setState('booting');

    this.terminal.writeOutput([
      { text: '', type: 'text' },
      { text: 'Resuming system...', type: 'heading' },
    ]);

    await this.delay(1000);

    this.terminal.writeOutput([
      { text: 'Restoring session state...', type: 'dim' },
    ]);

    await this.delay(800);

    this.terminal.writeOutput([
      { text: 'Ready.', type: 'success' },
      { text: '', type: 'text' },
    ]);

    await this.delay(200);
  }

  /** Play the full 5-phase boot sequence. */
  private async playFullBoot(): Promise<void> {
    for (const step of this.steps) {
      if (this.skipped) break;

      this.currentPhase = step.phase;
      this.emit('boot:phase');

      // Warm up shaders during BIOS POST phase
      if (step.phase === 'bios-post') {
        warmupShaders();
      }

      await step.render(this.terminal);
    }
  }

  /** Emit an event to all listeners. */
  private emit(event: BootEvent): void {
    const listeners = this.eventListeners.get(event) ?? [];
    for (const callback of listeners) {
      try {
        callback();
      } catch (err) {
        console.warn(`[BootSequence] Event listener failed for ${event}:`, err);
      }
    }
  }

  /** Promise-based delay that respects skip(). */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = (): void => {
        if (this.skipped || Date.now() - startTime >= ms) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
}
