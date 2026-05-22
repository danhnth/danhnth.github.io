# Learnings & Conventions

## Project Structure
- Vite + TypeScript, no frameworks (React/Vue)
- Custom DOM-based terminal (no xterm.js)
- Green phosphor CRT theme (#33FF66)
- All source in `src/`, public assets in `public/`

## Code Conventions
- Use TypeScript strict mode
- No `any` types, no `@ts-ignore`
- Modular architecture: separate data, types, commands, terminal, effects, audio, boot
- All commands implement `Command` interface from `src/commands/types.ts`
- All data imported from `src/data/`, never hardcoded in commands

## CRT Effects
- 3-tier GPU fallback: high (WebGL), low (CSS scanlines+vignette), minimal (CSS only)
- WebGL shaders use `mediump` precision for mobile compat
- Shader warmup during BIOS POST phase to avoid Safari stall
- Respect `prefers-reduced-motion` and `prefers-contrast: more`

## Audio
- NO audio before user gesture (browser autoplay policy)
- AudioManager queues sounds before gesture, plays after `initFromGesture()`
- Use Web Audio API (AudioContext), not `new Audio()` for synthesis

## Accessibility
- ARIA live region for screen reader announcements
- `prefers-reduced-motion` disables all animations
- `prefers-contrast: more` disables glow/bloom

## Boot Sequence
- 5 phases: BIOS POST → hardware detect → kernel load → init → login
- Skip on revisit via `localStorage 'crt-boot-seen'`
- Linear async/await, no state machine library

## Mobile
- Touch keyboard for mobile viewports (< 768px)
- Cap GPU tier at `low` on mobile
- Disable barrel distortion on touch-only devices
- Minimum tap target 44px

## Git
- Commit after every task
- Pre-commit: `npm run build` must pass
- Commit message format: `feat(scope): description`

## Task 1: Vite + TypeScript Scaffold
- Created project scaffold manually (faster than `npm create vite`)
- base: '/' in vite.config.ts for GitHub Pages user site
- index.html title changed to "Nguyen Thanh Danh | Terminal"
- Preserved meta tags (viewport, description, keywords) from original
- JetBrains Mono font linked via Google Fonts
- public/404.html has SPA redirect for GitHub Pages fallback
- public/.nojekyll disables Jekyll processing
- Build verified: exit 0, dist/index.html exists (1008 bytes)
