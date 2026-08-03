import { test, expect, Page } from '@playwright/test';
import { decodePNG, diffRatio } from './png-diff';

/**
 * Regression tests for the WebGL CRT overlay capture.
 *
 * Bug: the GPU/WebGL version froze the screen — the overlay texture was
 * captured with html-to-image at output-buffer scrollTop 0, so DOM scrolling
 * had zero visual effect ("can't scroll or autoscroll") and new bottom content
 * never appeared ("screen broken in half").
 *
 * These tests assert the overlay now mirrors the actual visible viewport:
 *   1. Changing the scroll position changes what is rendered on screen.
 *   2. Content appended at the bottom is visible after scrolling down.
 *
 * prefers-reduced-motion is emulated so shader flicker/jitter is zeroed and
 * screenshots are deterministic (the pipeline honors the media query live).
 */

const BASE = 'http://localhost:5199';

async function boot(page: Page): Promise<boolean> {
  // Resume path (short boot) keeps tests deterministic and fast.
  await page.addInitScript(() => localStorage.setItem('crt-boot-seen', 'true'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE);
  await page.waitForSelector('.crt-terminal__prompt', { timeout: 20_000 });
  const webglActive =
    (await page.locator('.crt-terminal--webgl-active').count()) > 0;
  // Let pending boot captures settle.
  await page.waitForTimeout(800);
  return webglActive;
}

async function fillScreen(page: Page, lines = 40): Promise<void> {
  await page.evaluate((n) => {
    const out = document.querySelector<HTMLElement>('.crt-terminal__output');
    if (!out) throw new Error('output buffer not found');
    for (let i = 0; i < n; i++) {
      const div = document.createElement('div');
      div.className = 'crt-line--text';
      div.style.lineHeight = '20px';
      div.textContent = `overflow line ${i} : 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
      out.appendChild(div);
    }
  }, lines);
  // Let the capture pump ingest the mutations.
  await page.waitForTimeout(800);
}

async function shot(page: Page): Promise<ReturnType<typeof decodePNG>> {
  return decodePNG(await page.screenshot({ type: 'png' }));
}

function getScrollTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const out = document.querySelector<HTMLElement>('.crt-terminal__output');
    return out ? out.scrollTop : -1;
  });
}

test('overlay updates when the terminal is scrolled', async ({ page }) => {
  const webgl = await boot(page);
  test.skip(!webgl, 'WebGL pipeline inactive (software renderer)');
  await fillScreen(page);

  // The terminal is at the bottom of a scrolled output region.
  await page.evaluate(() => {
    const out = document.querySelector<HTMLElement>('.crt-terminal__output');
    if (out) out.scrollTop = out.scrollHeight;
  });
  await page.waitForTimeout(1000);
  const atBottom = await getScrollTop(page);
  expect(atBottom).toBeGreaterThan(100); // ensure we really had overflow
  const before = await shot(page);

  // Scroll up with NO DOM mutation (plain scrollTop change).
  await page.evaluate(() => {
    const out = document.querySelector<HTMLElement>('.crt-terminal__output');
    if (out) out.scrollTop = Math.max(0, out.scrollTop - 320);
  });
  await page.waitForTimeout(1000);
  const after = await shot(page);

  // The overlay must have re-rendered to the new visible region.
  expect(diffRatio(before, after)).toBeGreaterThan(0.02);
  // And the DOM really did move (sanity).
  expect(await getScrollTop(page)).toBeLessThan(atBottom);
});

test('overlay shows content appended at the bottom after autoscroll', async ({ page }) => {
  const webgl = await boot(page);
  test.skip(!webgl, 'WebGL pipeline unavailable this environment (software renderer)');
  await fillScreen(page);

  await page.evaluate(() => {
    const out = document.querySelector<HTMLElement>('.crt-terminal__output');
    if (out) out.scrollTop = out.scrollHeight;
  });
  await page.waitForTimeout(1000);
  const before = await shot(page);

  // Autoscroll path: new content lands at the bottom while pinned to bottom.
  await page.evaluate(() => {
    const out = document.querySelector<HTMLElement>('.crt-terminal__output');
    if (!out) throw new Error('output buffer not found');
    const div = document.createElement('div');
    div.className = 'crt-line--text';
    div.style.lineHeight = '20px';
    div.style.color = 'rgb(0, 255, 200)';
    div.textContent = 'FRESH-AUTOSCROLLED-MARKER';
    out.appendChild(div);
    const out2 = document.querySelector<HTMLElement>('.crt-terminal__output');
    if (out2) out2.scrollTop = out2.scrollHeight;
  });
  await page.waitForTimeout(1000);
  const after = await shot(page);

  // The newly appended content must become visible on screen.
  expect(diffRatio(before, after)).toBeGreaterThan(0.01);
});