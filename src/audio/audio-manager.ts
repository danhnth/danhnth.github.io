/**
 * AudioManager — deferred audio initialization
 *
 * Browser autoplay policy requires a user gesture before AudioContext
 * can start. This manager queues all sound requests until the first
 * click/keypress, then plays them in order.
 */

export class AudioManager {
  private context: AudioContext | null = null;
  private audioReady = false;
  private muted = true;
  private queue: Array<() => void> = [];
  private readyCallbacks: Array<(ready: boolean) => void> = [];

  /**
   * Call once after the first user gesture (click, keypress, touch).
   * Creates the AudioContext, unmutes, and drains the queued sounds.
   */
  initFromGesture(): void {
    if (this.audioReady) return;

    try {
      if (!this.context) {
        this.context = new AudioContext();
      }

      this.context
        .resume()
        .then(() => {
          this.audioReady = true;
          this.muted = false;
          this.notifyReadyChange(true);
          this.drainQueue();
        })
        .catch((err: Error) => {
          if (err.name === 'NotAllowedError') {
            console.warn('[AudioManager] AudioContext.resume() blocked — waiting for next gesture.');
            return;
          }
          console.warn('[AudioManager] AudioContext.resume() failed:', err);
        });
    } catch (err) {
      console.warn('[AudioManager] Failed to create AudioContext:', err);
    }
  }

  /** Returns true when the AudioContext exists and is running. */
  isReady(): boolean {
    return this.audioReady && this.context !== null;
  }

  /** Toggle global mute (does not destroy the context). */
  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Returns true when audio is currently silenced. */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * If audio is ready, execute the sound function immediately.
   * Otherwise, queue it to play after the first user gesture.
   */
  playWhenReady(fn: () => void): void {
    if (this.isReady()) {
      fn();
    } else {
      this.queue.push(fn);
    }
  }

  /** Subscribe to audio-readiness changes. */
  onReadyChange(callback: (ready: boolean) => void): void {
    this.readyCallbacks.push(callback);
  }

  /**
   * Returns true when the UI should show a "click for sound" indicator.
   * This is true before the first user gesture (audio not ready).
   */
  shouldShowMuteIndicator(): boolean {
    return !this.audioReady;
  }

  /** Internal: drain the queue after context creation. */
  private drainQueue(): void {
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        try {
          fn();
        } catch (err) {
          console.warn('[AudioManager] Queued sound failed:', err);
        }
      }
    }
  }

  /** Internal: notify all subscribers of readiness change. */
  private notifyReadyChange(ready: boolean): void {
    for (const cb of this.readyCallbacks) {
      cb(ready);
    }
  }

  /** Expose the AudioContext for sprite-loader and other consumers. */
  getContext(): AudioContext | null {
    return this.context;
  }
}

/** Singleton instance used across the application. */
export const audioManager = new AudioManager();
