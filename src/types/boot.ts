import type { Terminal } from './terminal';

export type BootPhase =
  | 'power-off'
  | 'bios-post'
  | 'hardware-detect'
  | 'kernel-load'
  | 'init'
  | 'login'
  | 'shell-ready';

export interface BootStep {
  phase: BootPhase;
  duration: number;
  render: (terminal: Terminal) => Promise<void>;
  skippable: boolean;
}

export interface BootConfig {
  skipOnRevisit: boolean;
  totalDurationEstimate: number;
}