/**
 * Audio sprite loader and player
 *
 * Loads audio files into AudioBuffers for efficient playback.
 * Uses the AudioManager's shared AudioContext.
 */

import { audioManager } from './audio-manager';

/**
 * Fetch an audio file and decode it into an AudioBuffer.
 * @param url — path to the audio file (e.g. '/assets/sounds/sprites.mp3')
 */
export async function loadSprite(url: string): Promise<AudioBuffer> {
  const ctx = audioManager.getContext();
  if (!ctx) {
    throw new Error('[SpriteLoader] AudioContext not available. Call initFromGesture() first.');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[SpriteLoader] Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/**
 * Play a region of an AudioBuffer (audio sprite).
 * @param buffer — decoded AudioBuffer
 * @param offset — start time within the buffer (seconds)
 * @param duration — how long to play (seconds). If omitted, plays to end.
 */
export function playSprite(buffer: AudioBuffer, offset = 0, duration?: number): void {
  const ctx = audioManager.getContext();
  if (!ctx) {
    console.warn('[SpriteLoader] AudioContext not available — skipping sprite playback.');
    return;
  }

  if (audioManager.isMuted()) {
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(gain);
  gain.connect(ctx.destination);

  const playDuration = duration ?? buffer.duration - offset;
  source.start(0, offset, playDuration);
}

/**
 * Preload multiple audio sprites in parallel.
 * @param urls — array of audio file URLs
 * @returns array of decoded AudioBuffers (in the same order as urls)
 */
export async function preloadSprites(urls: string[]): Promise<AudioBuffer[]> {
  const promises = urls.map(async (url) => {
    try {
      return await loadSprite(url);
    } catch (err) {
      console.warn(`[SpriteLoader] Failed to preload sprite from ${url}:`, err);
      throw err;
    }
  });

  return Promise.all(promises);
}
