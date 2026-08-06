/**
 * Audio integration — wires sound effects to the terminal and boot sequence.
 *
 * - Plays key clicks on character input and enter sounds on submission.
 * - Plays a POST beep during the BIOS POST boot phase.
 * - Activates audio after the first user gesture (click or keypress).
 * - Provides a mute toggle (Ctrl+M) and a visual mute indicator.
 */

import { audioManager } from './audio-manager';
import { playBootSequence, playKeyUp, playEnter } from './oscillator';
import type { Terminal } from '../types/terminal';
import { BootSequence } from '../boot/boot-sequence';

const INDICATOR_CLASS = 'audio-indicator';

const INDICATOR_OFF = '[ SND OFF ]';
const INDICATOR_ON = '[ SND  ON ]';

function createIndicator(container: HTMLElement): HTMLDivElement {
  const indicator = document.createElement('div');
  indicator.className = INDICATOR_CLASS;
  indicator.textContent = INDICATOR_OFF;
  indicator.title = 'Click to enable sound';
  indicator.style.position = 'absolute';
  indicator.style.top = '0.5rem';
  indicator.style.right = '0.5rem';
  indicator.style.color = '#1a8033';
  indicator.style.cursor = 'pointer';
  indicator.style.userSelect = 'none';
  indicator.style.zIndex = '50';
  indicator.style.pointerEvents = 'auto';
  container.appendChild(indicator);
  return indicator;
}

function updateIndicator(indicator: HTMLDivElement): void {
  if (!audioManager.isReady()) {
    indicator.textContent = INDICATOR_OFF;
    indicator.title = 'Click to enable sound';
    return;
  }

  if (audioManager.isMuted()) {
    indicator.textContent = INDICATOR_OFF;
    indicator.title = 'Audio muted (Ctrl+M to unmute)';
  } else {
    indicator.textContent = INDICATOR_ON;
    indicator.title = 'Audio on (Ctrl+M to mute)';
  }
}

export function initAudioIntegration(
  terminal: Terminal,
  bootSequence: BootSequence
): void {
  const container = terminal.getElement();
  const indicator = createIndicator(container);

  indicator.addEventListener('click', () => {
    audioManager.initFromGesture();
    // First click initializes audio; once ready the indicator acts as a
    // mute toggle instead of being stuck showing SND ON forever.
    if (audioManager.isReady()) {
      audioManager.setMuted(!audioManager.isMuted());
    }
    updateIndicator(indicator);
  });

  audioManager.onReadyChange(() => {
    updateIndicator(indicator);
  });

  bootSequence.on('boot:phase', () => {
    if (bootSequence.getCurrentPhase() === 'bios-post') {
      playBootSequence();
    }
  });

  const keyHandler = (event: KeyboardEvent): void => {
    audioManager.initFromGesture();

    const activeElement = document.activeElement;
    const isTerminalFocused =
      activeElement === container || container.contains(activeElement as Node);
    const isOtherInputFocused =
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement;

    if (!isTerminalFocused && isOtherInputFocused) {
      return;
    }

    if (terminal.getState() !== 'ready') {
      return;
    }

    if (event.key.toLowerCase() === 'm' && event.ctrlKey) {
      event.preventDefault();
      audioManager.setMuted(!audioManager.isMuted());
      updateIndicator(indicator);
      return;
    }

    if (event.key === 'Enter') {
      playEnter();
      return;
    }

    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      playKeyUp();
    }
  };

  document.addEventListener('keydown', keyHandler);

  container.addEventListener('click', () => {
    audioManager.initFromGesture();
    updateIndicator(indicator);
  });
}
