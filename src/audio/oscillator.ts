/**
 * Oscillator-based sound synthesis
 *
 * All functions defer to the AudioManager singleton. If audio is not yet
 * initialized (no user gesture), the sound is queued and played later.
 */

import { audioManager } from './audio-manager';

/** Play a single-tone beep at the given frequency and duration. */
export function playBeep(frequency: number, duration: number, volume = 0.3): void {
  const play = (): void => {
    const ctx = audioManager.getContext();
    if (!ctx || audioManager.isMuted()) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  };

  if (audioManager.isReady()) {
    play();
  } else {
    audioManager.playWhenReady(play);
  }
}

/** POST boot beep: short high beep (~800 Hz, 100 ms). */
export function playBootSequence(): void {
  playBeep(800, 100, 0.3);
}

/** Key-up click: short high click (~1200 Hz, 30 ms, low volume). */
export function playKeyUp(): void {
  playBeep(1200, 30, 0.15);
}

/** Enter key sound: moderate tone (~600 Hz, 50 ms). */
export function playEnter(): void {
  playBeep(600, 50, 0.3);
}
