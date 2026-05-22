/**
 * Shader warmup utility
 *
 * Compiles CRT shader programs offscreen on a 1x1 canvas during boot.
 * This avoids Safari's 6-second shader compilation stall when the
 * terminal shell first appears.
 *
 * Re-exports the existing warmupShaders from gpu-detect for convenience.
 */

import { warmupShaders as warmupShadersOriginal } from '../utils/gpu-detect';

/**
 * Wraps the original warmupShaders with a diagnostic log.
 * Runs offscreen and does not block the main thread.
 */
export function warmupShaders(): void {
  // eslint-disable-next-line no-console
  console.log('Warming up shaders...');
  warmupShadersOriginal();
}
