

## Task 6: Audio Manager with Deferred Playback

- Created `src/audio/audio-manager.ts` with AudioManager singleton class
  - `private context: AudioContext | null` — created on first gesture
  - `private audioReady: boolean = false`
  - `private muted: boolean = true`
  - `private queue: Array<QueuedSound> = []`
  - `initFromGesture()` — creates AudioContext, unmutes, drains queued sounds
  - `isReady()`, `setMuted()`, `isMuted()`, `shouldShowMuteIndicator()`
  - `onReadyChange(callback)` — observer pattern for UI integration
  - Handles `NotAllowedError` from `AudioContext.resume()` gracefully
  - `getContext()` exposed for sprite-loader and other consumers
- Created `src/audio/oscillator.ts` with Web Audio API oscillator functions
  - `playBeep(frequency, duration, volume?)` — sine-wave tone with exponential decay
  - `playBootSequence()` — POST beep (~800 Hz, 100 ms)
  - `playKeyUp()` — key click (~1200 Hz, 20 ms)
  - All functions check `audioManager.isReady()` and queue if not ready
- Created `src/audio/sprite-loader.ts` with sprite loading and playback
  - `loadSprite(url)` — fetch + decodeAudioData
  - `playSprite(buffer, offset?, duration?)` — BufferSourceNode playback
  - `preload(sprites)` — batch preload for key-click sounds
- Created `src/audio/index.ts` re-exporting all modules
- Verification: `npx tsc --noEmit` zero errors, `npm run build` exit 0, lsp_diagnostics zero errors on all 4 files

## Task 2: CRT Design System Tokens & Base Styles
- Created `src/styles/tokens.css` with CSS custom properties:
  - Colors: green (#33FF66), dim (#1a8033), bright (#66FF99), bg (#0a0a0a), bg-dark (#050505)
  - Semantic colors: error (#FF3333), success, link, ascii, heading, dim
  - Phosphor glow: spread (2px), color (rgba 0.6)
  - Scanline: opacity (0.15), gap (2px)
  - Flicker intensity (0.03), barrel curvature (0.02)
  - Typography scale: xs through 3xl, JetBrains Mono font stack
  - Spacing scale: 4px base (1-16 units)
  - Z-index layers: base(1) → terminal(10) → scanlines(20) → cursor(30) → overlay(40) → modal(50)
- Created `src/styles/reset.css`: box-sizing, margin reset, font smoothing, inherited fonts for form elements
- Created `src/styles/terminal.css`:
  - Full-viewport terminal container (fixed, 100vw × 100vh, overflow hidden)
  - Scrollable output area with custom scrollbar (green thumb on dark track)
  - Input line with prompt character and blinking cursor animation
  - All 7 OutputLine types styled: text, heading, error, success, dim, ascii, link
  - ASCII box drawing styles with border variant
  - Selection color: green highlight on dark background
  - `prefers-reduced-motion`: disables cursor blink, scroll-behavior, link transitions
  - `prefers-contrast: high`: disables glow, brightens dim/ascii text
- Import order in main.ts: reset → tokens → terminal
- Build verified: tsc + vite build exit 0, 6 modules transformed
