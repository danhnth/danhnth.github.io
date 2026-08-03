import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    browserName: 'chromium',
    // CRT WebGL regression tests need a real GPU: gpu-detect.ts deliberately
    // rejects software rasterizers (SwiftShader etc.), which is what headless
    // Chromium exposes. Tests skip themselves when no WebGL pipeline is active.
    headless: false,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
