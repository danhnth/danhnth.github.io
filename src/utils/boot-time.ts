let bootTimestamp: number | null = null;

export function setBootTime(timestamp: number): void {
  bootTimestamp = timestamp;
}

export function getBootTime(): number {
  return bootTimestamp ?? performance.timeOrigin ?? Date.now();
}
