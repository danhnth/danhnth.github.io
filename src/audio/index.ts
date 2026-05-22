/**
 * Audio module — re-exports all audio sub-modules
 *
 * Usage:
 *   import { audioManager, playBeep, playBootSequence, playKeyUp, playEnter, loadSprite, playSprite, preloadSprites } from './audio';
 */

export { AudioManager, audioManager } from './audio-manager';

export { playBeep, playBootSequence, playKeyUp, playEnter } from './oscillator';

export { loadSprite, playSprite, preloadSprites } from './sprite-loader';
