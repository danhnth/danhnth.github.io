import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import { decodePNG } from './png-diff.ts';

/**
 * crt-demotion-recovery.spec.ts — regression lock for the "flat green
 * phosphor after modern→crt" bug.
 *
 * Root cause (confirmed by repro): CRTEffectsManager.demoteToCSS()
 * (src/effects/crt-manager.ts) detaches the bridge and pins
 * tier='minimal' + minimal config, but never clears isEnabled and never
 * remembers the pre-demotion state. `display modern` clears isEnabled
 * only, so a subsequent `display crt` passes the guard and REBUILDS a
 * live WebGL pipeline with the pinned minimal config → canvas active but
 * shader renders flat dim text (no curvature/bloom/scanlines).
 *
 * This suite asserts the FIXED contract: after demote → modern → crt the
 * rebuilt pipeline must use the FULL config, so the recovered screenshot
 * keeps the baseline shader signature.
 *
 * Discriminators (calibrated on this machine from known artifacts):
 *   full shader: meanLum≈81, brightFrac(>40)≈0.63, vignette≈0.79
 *   flat minimal: meanLum≈5.4, brightFrac≈0.03, vignette≈5.9
 * Assertions are RATIO-based against the baseline measured in-run so they
 * hold across machines/GPUs.
 *
 * Demotion is armed without source edits: the pipeline canvas has a
 * 'webglcontextlost' listener → handleContextLost() → 3s timer →
 * demoteToCSS('context-lost'). A synthetic cancelable event triggers it.
 */

const BASE = 'http://localhost:5199';
const ARTIFACTS = path.join('tests', 'artifacts-recovery');

async function boot(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('crt-boot-seen', 'true');
    localStorage.removeItem('crt-display-mode');
    localStorage.removeItem('crt-shader-tuning');
  });
  await page.goto(BASE);
  await page.waitForSelector('.crt-terminal__prompt', { timeout: 20_000 });
  await page.waitForTimeout(1500);
}

async function runCommand(page: Page, cmd: string): Promise<void> {
  await page.locator('.crt-terminal').click();
  await page.keyboard.type(cmd);
  await page.keyboard.press('Enter');
}

async function armContextLoss(page: Page): Promise<void> {
  await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('.crt-webgl-overlay');
    if (c) {
      c.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    }
  });
}

async function collectState(page: Page) {
  return page.evaluate(() => {
    const term = document.querySelector('.crt-terminal');
    return {
      cssFallback: document.querySelectorAll('.crt-effects--css').length,
      overlays: document.querySelectorAll('.crt-webgl-overlay').length,
      active: document.querySelectorAll('.crt-terminal--webgl-active').length,
      terminalClasses: term ? Array.from(term.classList) : [],
    };
  });
}

function meanLumRegion(img: ReturnType<typeof decodePNG>, fx0: number, fy0: number, fx1: number, fy1: number): number {
  const { width, height, pixels } = img;
  const x0 = Math.floor(width * fx0), x1 = Math.floor(width * fx1);
  const y0 = Math.floor(height * fy0), y1 = Math.floor(height * fy1);
  let sum = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      sum += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      n++;
    }
  }
  return sum / n;
}

function meanLum(img: ReturnType<typeof decodePNG>): number {
  return meanLumRegion(img, 0, 0, 1, 1);
}

function brightFrac(img: ReturnType<typeof decodePNG>, thresh = 40): number {
  const { width, height, pixels } = img;
  let bright = 0;
  const n = width * height;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const l = 0.2126 * pixels[o] + 0.7152 * pixels[o + 1] + 0.0722 * pixels[o + 2];
    if (l > thresh) bright++;
  }
  return bright / n;
}

function vignetteRatio(img: ReturnType<typeof decodePNG>): number {
  // corner / center: <1 means corners darker (vignette present)
  return meanLumRegion(img, 0.0, 0.0, 0.2, 0.2) / meanLumRegion(img, 0.4, 0.4, 0.6, 0.6);
}

test.describe.configure({ mode: 'serial' });

test('baseline: clean CRT boot keeps the full shader signature', async ({ page }) => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  await boot(page);

  const state = await collectState(page);
  console.log('[baseline] state=', JSON.stringify(state));
  test.skip(state.overlays === 0, 'no WebGL pipeline (software renderer)');

  await page.locator('.crt-terminal').screenshot({ path: path.join(ARTIFACTS, 'baseline.png') });
  const img = decodePNG(readFileSync(path.join(ARTIFACTS, 'baseline.png')));
  const lum = meanLum(img);
  const bright = brightFrac(img);
  const vg = vignetteRatio(img);
  console.log(`[baseline] meanLum=${lum.toFixed(2)} brightFrac=${bright.toFixed(4)} vignette=${vg.toFixed(3)}`);
  // Sanity: the baseline itself must be the full shader (or the comparison is moot).
  // Full shader on a real GPU: bright, vignetted, corners darker than center.
  expect(lum).toBeGreaterThan(20);
  expect(vg).toBeLessThan(0.85);
});

test('demote → modern → crt restores the FULL shader (not flat minimal config)', async ({ page }) => {
  test.setTimeout(90_000);
  const consoleLog: string[] = [];
  page.on('console', (msg) => consoleLog.push(msg.text()));

  await boot(page);
  const bootState = await collectState(page);
  console.log('[B] boot state=', JSON.stringify(bootState));
  test.skip(bootState.overlays === 0, 'no WebGL pipeline (software renderer)');

  // --- Arm demotion (context-loss path) and let the 3s timer fire ---
  consoleLog.push('[marker] dispatch webglcontextlost');
  await armContextLoss(page);
  await page.waitForTimeout(4000);
  const demoted = await collectState(page);
  console.log('[B-demoted] state=', JSON.stringify(demoted));
  expect(demoted.cssFallback).toBe(1);

  // --- User's reported flow: display modern → display crt ---
  consoleLog.push('[marker] RUN display modern');
  await runCommand(page, 'display modern');
  await page.waitForTimeout(1000);
  const modern = await collectState(page);
  console.log('[B-modern] state=', JSON.stringify(modern));

  consoleLog.push('[marker] RUN display crt');
  await runCommand(page, 'display crt');
  await page.waitForTimeout(2500);

  const recovered = await collectState(page);
  console.log('[B-recovered] state=', JSON.stringify(recovered));
  console.log('[B-recovered] console tail=', JSON.stringify(consoleLog.slice(-8)));

  // --- Structural contract: pipeline rebuilt, CSS fallback cleared ---
  expect(recovered.overlays).toBe(1);
  expect(recovered.active).toBe(1);
  expect(recovered.cssFallback).toBe(0);

  // --- Pixel contract: recovered render keeps the FULL shader signature ---
  await page.locator('.crt-terminal').screenshot({ path: path.join(ARTIFACTS, 'recovered.png') });
  const baselinePng = path.join(ARTIFACTS, 'baseline.png');
  const recoveredPng = path.join(ARTIFACTS, 'recovered.png');

  const a = decodePNG(readFileSync(baselinePng));
  const b = decodePNG(readFileSync(recoveredPng));
  const lumA = meanLum(a);
  const lumB = meanLum(b);
  const brightB = brightFrac(b);
  const vgB = vignetteRatio(b);
  console.log(`[B-recovered] meanLum baseline=${lumA.toFixed(2)} recovered=${lumB.toFixed(2)} | brightFrac=${brightB.toFixed(4)} | vignette=${vgB.toFixed(3)}`);

  // Flat-minimal rebuild measures ~7% of baseline luminance with no vignette
  // (meanLum 5.4 vs 81.1, vignette 5.9 vs 0.79 in calibration). The recovered
  // pipeline must retain the baseline look — this FAILED before the fix.
  expect(lumB).toBeGreaterThan(lumA * 0.4);
  expect(vgB).toBeLessThan(0.85);
});
