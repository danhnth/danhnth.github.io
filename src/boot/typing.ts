/**
 * Shared typing animation helpers for boot phases.
 *
 * All effects use the Terminal interface (append-only output).
 * "Cascade typing" prints progressively longer strings as new lines,
 * creating a terminal-style typing effect without needing a
 * "replace last line" API.
 */

import type { Terminal, OutputLine } from '../types/terminal.ts';

/** Delay for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Write a single line to the terminal immediately. */
export function writeLine(
  terminal: Terminal,
  text: string,
  type: OutputLine['type'] = 'text'
): void {
  terminal.writeOutput([{ text, type }]);
}

/**
 * Cascade-type text into the terminal.
 * Each character step is emitted as a new line, creating a
 * vertical cascade that simulates real-time typing.
 */
export async function typeText(
  terminal: Terminal,
  text: string,
  type: OutputLine['type'] = 'text',
  charDelayMs = 30
): Promise<void> {
  for (let i = 1; i <= text.length; i++) {
    terminal.writeOutput([{ text: text.slice(0, i), type }]);
    await sleep(charDelayMs);
  }
}

/**
 * Type a prefix, then "type" a value after it with a small delay.
 * Useful for "login: guest" style animations.
 */
export async function typePrefixed(
  terminal: Terminal,
  prefix: string,
  value: string,
  type: OutputLine['type'] = 'text',
  charDelayMs = 40
): Promise<void> {
  const full = prefix + value;
  const prefixLen = prefix.length;

  for (let i = prefixLen + 1; i <= full.length; i++) {
    terminal.writeOutput([{ text: full.slice(0, i), type }]);
    await sleep(charDelayMs);
  }
}

/**
 * Animate a numeric counter from start to end, appending each
 * intermediate value as a new line.
 */
export async function animateCounter(
  terminal: Terminal,
  prefix: string,
  start: number,
  end: number,
  step: number,
  suffix: string,
  type: OutputLine['type'] = 'text',
  delayMs = 60
): Promise<void> {
  for (let value = start; value <= end; value += step) {
    terminal.writeOutput([{ text: `${prefix}${value}${suffix}`, type }]);
    await sleep(delayMs);
  }
}

/**
 * Print a list of lines with a small stagger delay between each.
 */
export async function printLines(
  terminal: Terminal,
  lines: Array<{ text: string; type?: OutputLine['type'] }>,
  delayMs = 200
): Promise<void> {
  for (const line of lines) {
    terminal.writeOutput([{ text: line.text, type: line.type ?? 'text' }]);
    await sleep(delayMs);
  }
}
