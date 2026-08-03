/**
 * Shared typing animation helpers for boot phases.
 *
 * Typing effects write one line, then rewrite it in place per character
 * via Terminal.replaceLastLine, so text grows horizontally like a real
 * terminal instead of cascading down the screen.
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

/** Type text one character at a time onto a single line. */
export async function typeText(
  terminal: Terminal,
  text: string,
  type: OutputLine['type'] = 'text',
  charDelayMs = 30
): Promise<void> {
  if (text.length === 0) {
    return;
  }

  terminal.writeOutput([{ text: text.slice(0, 1), type }]);
  await sleep(charDelayMs);

  for (let i = 2; i <= text.length; i++) {
    terminal.replaceLastLine({ text: text.slice(0, i), type }, i === text.length);
    await sleep(charDelayMs);
  }
}

/** Type a value after a static prefix, all on one line ("login: guest"). */
export async function typePrefixed(
  terminal: Terminal,
  prefix: string,
  value: string,
  type: OutputLine['type'] = 'text',
  charDelayMs = 40
): Promise<void> {
  if (value.length === 0) {
    terminal.writeOutput([{ text: prefix, type }]);
    return;
  }

  const full = prefix + value;

  terminal.writeOutput([{ text: full.slice(0, prefix.length + 1), type }]);
  await sleep(charDelayMs);

  for (let i = prefix.length + 2; i <= full.length; i++) {
    terminal.replaceLastLine({ text: full.slice(0, i), type }, i === full.length);
    await sleep(charDelayMs);
  }
}

/** Count from start to end in place on a single line. */
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
  if (step <= 0 || start > end) {
    return;
  }

  terminal.writeOutput([{ text: `${prefix}${start}${suffix}`, type }]);
  await sleep(delayMs);

  for (let value = start + step; value <= end; value += step) {
    const isLast = value + step > end;
    terminal.replaceLastLine({ text: `${prefix}${value}${suffix}`, type }, isLast);
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
