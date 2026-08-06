import { test, expect, Page } from '@playwright/test';

/**
 * Tests for the display-mode opt-out: `display crt|modern` switches between
 * the WebGL/CRT shader look and a plain modern terminal UI.
 *
 *  1. Loading with `?display=modern` boots straight into modern mode: no
 *     WebGL overlay, no CSS-fallback effect classes, neutral palette applied.
 *  2. The `display` command toggles modes live (overlay appears/disappears).
 *  3. The choice persists across reloads.
 *
 * Like the scroll suite, CRT assertions need a real GPU; the WebGL-specific
 * parts skip themselves when the pipeline cannot start.
 */

const BASE = 'http://localhost:5199';

async function boot(page: Page, query = ''): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('crt-boot-seen', 'true'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE + query);
  await page.waitForSelector('.crt-terminal__prompt', { timeout: 20_000 });
  await page.waitForTimeout(800);
}

async function runCommand(page: Page, cmd: string): Promise<void> {
  await page.locator('.crt-terminal').click();
  await page.keyboard.type(cmd);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

test('?display=modern boots into a plain terminal with no CRT effects', async ({ page }) => {
  await boot(page, '?display=modern');

  const state = await page.evaluate(() => ({
    modernClass: document.documentElement.classList.contains('crt-mode--modern'),
    webglOverlays: document.querySelectorAll('.crt-webgl-overlay').length,
    cssEffectClasses: document.querySelectorAll('.crt-effects--css').length,
    terminalBg: getComputedStyle(
      document.querySelector('.crt-terminal') as HTMLElement
    ).backgroundColor,
  }));

  expect(state.modernClass).toBe(true);
  expect(state.webglOverlays).toBe(0);
  expect(state.cssEffectClasses).toBe(0);
  // Neutral modern background, not the CRT near-black green-tinted one.
  expect(state.terminalBg).toBe('rgb(13, 17, 23)'); // #0d1117
});

test('display command toggles the CRT pipeline on and off live', async ({ page }) => {
  await boot(page);
  const hasPipeline = await page.evaluate(() =>
    document.querySelectorAll('.crt-terminal--webgl-active').length > 0
  );
  test.skip(!hasPipeline, 'WebGL pipeline inactive (software renderer)');

  await runCommand(page, 'display modern');
  const afterModern = await page.evaluate(() => ({
    modernClass: document.documentElement.classList.contains('crt-mode--modern'),
    webglActive: document.querySelectorAll('.crt-terminal--webgl-active').length,
    overlays: document.querySelectorAll('.crt-webgl-overlay').length,
  }));
  expect(afterModern.modernClass).toBe(true);
  expect(afterModern.webglActive).toBe(0);
  expect(afterModern.overlays).toBe(0);

  await runCommand(page, 'display crt');
  const afterCRT = await page.evaluate(() => ({
    modernClass: document.documentElement.classList.contains('crt-mode--modern'),
    webglActive: document.querySelectorAll('.crt-terminal--webgl-active').length,
  }));
  expect(afterCRT.modernClass).toBe(false);
  expect(afterCRT.webglActive).toBe(1);

  // `display` with no args reports the active mode.
  await runCommand(page, 'display');
  const output = await page.evaluate(() =>
    document.querySelector('.crt-terminal__output')?.textContent ?? ''
  );
  expect(output).toContain('crt');
});

test('display mode persists across reloads', async ({ page }) => {
  await boot(page);
  await runCommand(page, 'display modern');

  // Reload WITHOUT the URL override — localStorage must carry the mode.
  await page.reload();
  await page.waitForSelector('.crt-terminal__prompt', { timeout: 20_000 });
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => ({
    modernClass: document.documentElement.classList.contains('crt-mode--modern'),
    overlays: document.querySelectorAll('.crt-webgl-overlay').length,
  }));
  expect(state.modernClass).toBe(true);
  expect(state.overlays).toBe(0);
});

test('repeated toggles do not stack pipeline instances', async ({ page }) => {
  await boot(page);
  const hasPipeline = await page.evaluate(() =>
    document.querySelectorAll('.crt-terminal--webgl-active').length > 0
  );
  test.skip(!hasPipeline, 'WebGL pipeline inactive (software renderer)');

  // Already in CRT mode: `display crt` must be a no-op, not a re-init.
  await runCommand(page, 'display crt');
  await runCommand(page, 'display crt');
  const afterRepeats = await page.evaluate(() => ({
    overlays: document.querySelectorAll('.crt-webgl-overlay').length,
    effects: document.querySelectorAll('.crt-terminal--webgl-active').length,
  }));
  expect(afterRepeats.overlays).toBe(1);
  expect(afterRepeats.effects).toBe(1);

  // And back to modern twice: still zero overlays.
  await runCommand(page, 'display modern');
  await runCommand(page, 'display modern');
  const afterModernTwice = await page.evaluate(() => ({
    overlays: document.querySelectorAll('.crt-webgl-overlay').length,
    effects: document.querySelectorAll('.crt-terminal--webgl-active').length,
  }));
  expect(afterModernTwice.overlays).toBe(0);
  expect(afterModernTwice.effects).toBe(0);
});