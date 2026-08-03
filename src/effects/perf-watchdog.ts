/**
 * PerfWatchdog — runtime FPS monitor for the optimistic WebGL strategy.
 *
 * Instead of predicting GPU capability up front (unreliable), the pipeline
 * runs optimistically and this watchdog demotes to the static CSS fallback
 * only on measured, sustained slowness.
 *
 * Design invariants (deliberate — do not "tune"):
 * - Median frame time, not mean: one GC pause must not demote a healthy machine.
 * - 2s sampling window × 2 consecutive bad windows ≈ 4s of genuine slowness.
 * - 1.5s grace period skips shader-compile/first-capture warmup.
 * - Windows containing main-thread blocking work (DOM capture)
 *   are poisoned via markBlockingWork() and never judged.
 * - document.hidden guard: background tabs throttle rAF to ~1Hz, which would
 *   otherwise be a guaranteed false positive.
 * - Demotion is one-way and monitoring stops after 15s, so oscillation is
 *   structurally impossible.
 */
export class PerfWatchdog {
  private frames: number[] = [];
  private last = 0;
  private windowStart = 0;
  private badWindows = 0;
  private startAt = performance.now() + 1500;
  private deadline = performance.now() + 15000;
  private raf = 0;
  private suspectWindow = false;

  constructor(private onDemote: (reason: string) => void) {}

  /** Called when main-thread blocking work (DOM capture) occurred this window. */
  markBlockingWork(): void {
    this.suspectWindow = true;
  }

  start(): void {
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  private tick = (t: number): void => {
    this.raf = requestAnimationFrame(this.tick);
    if (t > this.deadline) {
      this.stop();
      return;
    }
    if (t < this.startAt) {
      this.last = t;
      this.windowStart = t;
      return;
    }
    if (document.hidden) {
      this.reset(t);
      return;
    }

    if (this.last) this.frames.push(t - this.last);
    this.last = t;

    if (t - this.windowStart < 2000) return;

    const poisoned = this.suspectWindow || this.frames.length < 20;
    const sorted = this.frames.slice().sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1] ?? 0;
    this.reset(t);

    if (poisoned) return;
    if (median > 33) {
      if (++this.badWindows >= 2) {
        this.stop();
        this.onDemote(`sustained-low-fps:${median.toFixed(1)}ms`);
      }
    } else {
      this.badWindows = 0;
    }
  };

  private reset(t: number): void {
    this.frames.length = 0;
    this.windowStart = t;
    this.suspectWindow = false;
  }
}
