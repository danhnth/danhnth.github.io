# CRT Terminal Portfolio

## TL;DR

> **Quick Summary**: Rebuild the web portfolio as an immersive CRT terminal website with a full OS boot sequence (BIOS → kernel → login → shell), WebGL shader-driven cathode ray tube visual effects, retro sound effects, and an interactive command-line shell where visitors explore profile content through typed commands. Modular architecture using Vite + TypeScript, deployable to GitHub Pages.
>
> **Deliverables**:
> - Complete CRT terminal website replacing the current SimpleFolio template
> - Full boot sequence animation (BIOS POST, hardware detection, kernel loading, auto-login, shell welcome)
> - 10+ interactive shell commands (whoami, about, skills, projects, cat, certs, contact, resume, help, clear, neofetch)
> - WebGL-powered CRT visual effects with 3-tier GPU fallback system
> - Retro sound effects (key clicks, CRT hum, boot beeps) with Web Audio API
> - Mobile-responsive experience with touch keyboard
> - GitHub Pages deployment with CI/CD
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 7 → Task 10 → Task 14 → Integration → FINAL

---

## Context

### Original Request
Rebuild the web portfolio as an interactive CRT Terminal website. Visitor experiences full OS boot sequence (boot logo, firmware check, kernel loading, login prompt, shell startup). CRT visual effects with cybersecurity and retro sci-fi atmosphere. Modular for future feature additions. Must host on GitHub Pages.

### Interview Summary
**Key Discussions**:
- **Post-boot interaction**: Hybrid — auto-show welcome + help tips, then visitors explore via typed commands
- **Boot depth**: Full realistic (~15-20s) with skip on revisit via localStorage
- **Tech stack**: Vite + TypeScript (outputs static files), deployed to GitHub Pages
- **Content delivery**: Commands + routed views (e.g., `projects` opens a scrollable viewer inside terminal)
- **CRT effects**: Full WebGL shaders (phosphor persistence, barrel distortion, chromatic aberration, scanlines)
- **Color palette**: Green phosphor (classic CRT green on black)
- **Sound**: Hybrid — audio sprites for key clicks/CRT hum, Web Audio API oscillators for boot beeps
- **Login**: Auto-login with animation (no visitor friction)
- **Mobile**: Same experience adapted with touch-friendly keyboard
- **Testing**: No unit tests, QA-only via Playwright agent verification

**Research Findings**:
- Custom DOM-based terminal is correct (not xterm.js — we're simulating, not emulating)
- Safari WebGL has 25× performance delta on first-draw shader compilation — must warm up shaders during boot
- 15-20% of mobile GPUs cannot run CRT shaders — 3-tier fallback (full/limited/CSS) is mandatory
- Audio autoplay requires user gesture in all 2026 browsers — boot starts silent, audio after first interaction
- CRT effects violate WCAG accessibility — must respect prefers-reduced-motion and prefers-contrast
- Hash routing is simpler than 404.html redirect for single-page terminal (no real routes needed)

### Metis Review
**Identified Gaps** (all addressed):
- Safari shader stall → Shader warmup during BIOS POST phase, compile offscreen
- Mobile GPU blacklist → 3-tier GPU detection system with CSS fallback
- Audio autoplay restriction → Silent boot start, audio after first gesture, visual "click for sound" indicator
- Accessibility violations → prefers-reduced-motion, prefers-contrast support, ARIA live region for screen readers
- XState overkill → Linear async/await for boot sequence, no state machine library
- Canvas vs DOM terminal → DOM-based (native text selection, screen reader access, CSS effects as fallback)

---

## Work Objectives

### Core Objective
Create a complete, immersive CRT terminal portfolio that makes visitors feel like they're logging into a real system, with authentic visuals, sounds, and interactivity — while remaining accessible, deployable, and easy to extend.

### Concrete Deliverables
- Replacement website deployed to danhnth.github.io
- Boot sequence with 5 phases (BIOS POST, hardware detect, kernel load, login, shell welcome)
- Interactive terminal with 10+ commands
- WebGL CRT effects with CSS fallback
- Sound effects that respect browser autoplay policies
- Mobile-responsive layout with touch keyboard
- GitHub Pages CI/CD pipeline

### Definition of Done
- [ ] `npm run build` produces static files in `dist/` that deploy to GH Pages
- [ ] Boot sequence plays fully on first visit, skips on revisit
- [ ] All commands produce correct, styled output with profile data
- [ ] CRT effects render correctly on high-tier GPUs, degrade gracefully on low-tier
- [ ] Sound plays after first user interaction, muted indicator shown before
- [ ] Mobile experience functional with touch keyboard
- [ ] `prefers-reduced-motion` disables animations, `prefers-contrast: high` increases contrast
- [ ] No console errors, no accessibility violations (WCAG 2.1 AA)

### Must Have
- Full boot sequence simulation (all 5 phases)
- WebGL CRT effects (scanlines, phosphor bloom, barrel distortion, chromatic aberration, flicker)
- 3-tier GPU detection with CSS fallback
- Green phosphor color scheme
- Interactive commands: whoami, about, skills, projects, cat, certs, contact, resume, help, clear
- Auto-login animation during boot
- Boot skip on revisit (localStorage)
- Sound effects with autoplay policy compliance
- Mobile touch keyboard
- GitHub Pages deployment
- ARIA accessibility (screen reader announcements, prefers-reduced-motion)
- Modular command architecture (easy to add new commands)

### Must NOT Have (Guardrails)
- No xterm.js or jquery.terminal dependency (custom terminal is simpler and more appropriate)
- No XState or state machine library for boot (linear async/await is sufficient)
- No canvas-based terminal rendering (DOM-based for accessibility and text selection)
- No audio before user gesture (comply with autoplay policies)
- No path-based routing (hash-based only for SPA)
- No hardcoded English-only strings in boot sequence (use data files for easy i18n later)
- No GPU-heavy effects on incompatible devices (always provide CSS fallback)
- No violations of prefers-reduced-motion or prefers-contrast
- No scope creep into backend/server features
- No traditional portfolio sections (everything is terminal commands)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (new project from scratch)
- **Automated tests**: None (QA-only approach)
- **Framework**: N/A
- **Agent-Executed QA**: Playwright for all browser-based verification

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use Bash — Build commands, dev server, curl for HTTP
- **Accessibility**: Use Playwright — Assert ARIA attributes, reduced-motion, contrast ratios

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + scaffolding):
├── Task 1: Project scaffold + Vite config + GH Pages [quick]
├── Task 2: Design system tokens + base styles [quick]
├── Task 3: Type definitions [quick]
├── Task 4: GPU tier detection + CRT config utility [quick]
├── Task 5: Content data files [quick]
└── Task 6: Audio manager with deferred playback [deep]

Wave 2 (After Wave 1 - core modules, MAX PARALLEL):
├── Task 7: Terminal engine core [deep]
├── Task 8: Command registry + plugin system [unspecified-high]
├── Task 9: CRT effects pipeline (WebGL + CSS fallback) [deep]
└── Task 10: Boot sequence (5 phases + shader warmup) [deep]

Wave 3 (After Wave 2 - commands + features):
├── Task 11: Profile commands (whoami, about, skills) [quick]
├── Task 12: Content commands (projects, cat, certs, contact, resume) [unspecified-high]
├── Task 13: Shell system commands (help, clear, echo, neofetch) [quick]
└── Task 14: Login prompt + welcome message [quick]

Wave 4 (After Wave 3 - integration + polish):
├── Task 15: Sound effects integration [unspecified-high]
├── Task 16: Mobile adaptation + touch keyboard [visual-engineering]
├── Task 17: Main entry point + wiring [deep]
└── Task 18: GitHub Pages deployment + CI/CD [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 7 → Task 11 → Task 17 → Task 18 → FINAL
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 6 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 7, 8, 9, 10, 17, 18 | 1 |
| 2 | — | 7, 9 | 1 |
| 3 | — | 7, 8, 10 | 1 |
| 4 | — | 9 | 1 |
| 5 | — | 11, 12 | 1 |
| 6 | — | 15 | 1 |
| 7 | 2, 3 | 11, 12, 13, 14, 17 | 2 |
| 8 | 3 | 11, 12, 13, 17 | 2 |
| 9 | 2, 4 | 16, 17 | 2 |
| 10 | 3, 5 | 14, 15, 17 | 2 |
| 11 | 5, 7, 8 | 17 | 3 |
| 12 | 5, 7, 8 | 17 | 3 |
| 13 | 7, 8 | 17 | 3 |
| 14 | 10 | 15 | 3 |
| 15 | 6, 10, 14 | 17 | 4 |
| 16 | 9 | 17 | 4 |
| 17 | 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | 18 | 4 |
| 18 | 1, 17 | FINAL | 4 |

### Agent Dispatch Summary

- **Wave 1**: 6 tasks — T1-T4 → `quick`, T5 → `quick`, T6 → `deep`
- **Wave 2**: 4 tasks — T7 → `deep`, T8 → `unspecified-high`, T9 → `deep`, T10 → `deep`
- **Wave 3**: 4 tasks — T11 → `quick`, T12 → `unspecified-high`, T13 → `quick`, T14 → `quick`
- **Wave 4**: 4 tasks — T15 → `unspecified-high`, T16 → `visual-engineering`, T17 → `deep`, T18 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Project Scaffold + Vite Config + GitHub Pages Setup

  **What to do**:
  - Initialize Vite + TypeScript project in the web_portfolio directory (replace existing files)
  - Configure `vite.config.ts` with GitHub Pages plugin (`vite-plugin-github-pages-spa` or manual 404.html approach)
  - Set up `tsconfig.json` with strict mode
  - Create `index.html` entry point with meta tags (viewport, title "Nguyen Thanh Danh | Terminal", description, favicon links)
  - Create `public/404.html` for SPA routing fallback (redirect pattern)
  - Create `public/.nojekyll` to disable Jekyll processing
  - Set up `.gitignore` (node_modules, dist, .env)
  - Create `package.json` with scripts: `dev`, `build`, `preview`, `deploy`
  - Install dev dependencies: `vite`, `typescript`, `@vitejs/plugin-` as needed
  - Install runtime dependencies: none yet (custom terminal, no xterm.js)
  - Verify `npm run dev` starts a dev server and `npm run build` produces `dist/` output

  **Must NOT do**:
  - Do not install xterm.js, jquery.terminal, or any terminal library
  - Do not install XState or any state machine library
  - Do not install React, Vue, or any framework
  - Do not configure path-based routing (use hash routing only)
  - Do not add any existing portfolio HTML/CSS to the new project yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard project scaffolding task, well-defined config files
  - **Skills**: []
    - No specialized skills needed for scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6)
  - **Blocks**: Tasks 7, 8, 9, 10, 17, 18
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - Current `index.html` at root — contains meta tags, font links, favicon paths to preserve
  - Current `assets/favicon_io/` — contains full favicon set (android-chrome, apple-touch-icon, etc.)
  - Current `assets/Nguyen_Thanh_Danh_CV.pdf` — resume PDF to keep accessible

  **API/Type References**:
  - Current `danhnth.github.io` GitHub Pages setup — remote: `https://github.com/danhnth/danhnth.github.io.git`

  **External References**:
  - Vite docs: https://vite.dev/config/ — base config, build options
  - SPA GitHub Pages: https://github.com/rafgraph/spa-github-pages — 404.html redirect pattern
  - `vite-plugin-github-pages-spa`: https://github.com/sctg-development/vite-plugin-github-pages-spa — auto 404.html generation

  **WHY Each Reference Matters**:
  - Current `index.html` has correct meta tags, font links, and favicon references to port to new entry point
  - `assets/` directory contains files that must be accessible in the new build
  - GitHub Pages SPA pattern is essential for the site to work as a single-page app without 404 errors

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dev server starts and serves index.html
    Tool: Bash
    Preconditions: Node.js installed, project directory set up
    Steps:
      1. Run `npm install` in project root
      2. Run `npm run dev`
      3. Verify server starts on localhost with no errors in console
    Expected Result: Vite dev server starts, accessible at localhost URL
    Failure Indicators: Server fails to start, TypeScript errors in console
    Evidence: .sisyphus/evidence/task-1-dev-server.txt

  Scenario: Build produces deployable static files
    Tool: Bash
    Preconditions: npm install completed
    Steps:
      1. Run `npm run build`
      2. Verify `dist/` directory exists
      3. Verify `dist/index.html` exists and contains correct meta tags
      4. Verify `dist/404.html` exists (SPA redirect)
      5. Verify `dist/.nojekyll` exists
    Expected Result: `dist/` contains all static files needed for GitHub Pages deployment
    Failure Indicators: Missing 404.html, missing .nojekyll, build errors
    Evidence: .sisyphus/evidence/task-1-build-output.txt
  ```

  **Commit**: YES
  - Message: `feat(scaffold): initialize Vite + TypeScript project`
  - Files: package.json, vite.config.ts, tsconfig.json, index.html, public/404.html, public/.nojekyll, .gitignore
  - Pre-commit: `npm run build`

- [x] 2. Design System Tokens + Base Styles

  **What to do**:
  - Create `src/styles/tokens.css` with CSS custom properties for the green phosphor CRT theme:
    - Colors: `--crt-green: #33FF66`, `--crt-green-dim: #1a8033`, `--crt-green-bright: #66FF99`, `--crt-bg: #0a0a0a`, `--crt-bg-dark: #050505`
    - Phosphor glow: `--crt-glow-spread: 2px`, `--crt-glow-color: rgba(51, 255, 102, 0.6)`
    - Scanline: `--crt-scanline-opacity: 0.15`, `--crt-scanline-gap: 2px`
    - Flicker: `--crt-flicker-intensity: 0.03`
    - Barrel distortion: `--crt-curvature: 0.02`
    - Typography: `--crt-font-mono: 'JetBrains Mono', 'Fira Code', monospace`, sizes for various terminal elements
    - Spacing: terminal padding, line height, prompt spacing
    - Z-index layers: boot content, terminal overlay, effects overlay, UI
  - Create `src/styles/reset.css` with minimal CSS reset (box-sizing, margin reset, font smoothing)
  - Create `src/styles/terminal.css` with terminal layout styles:
    - Full-viewport terminal container (100vw × 100vh, overflow hidden)
    - Terminal output area (scrollable, monospace font)
    - Input line styling (prompt character `$`, blinking cursor)
    - Text styling for different output types (headers, body text, error text, success text, dim text)
    - ASCII box drawing styles for bordered content
    - Selection color styling (green highlight on dark)
  - Import Google Fonts (JetBrains Mono) in the CSS or link in index.html
  - Ensure all styles respect `prefers-reduced-motion` (disable animations) and `prefers-contrast: high` (disable glow/bloom)

  **Must NOT do**:
  - Do not add CRT effects (scanlines, flicker, bloom) here — that's Task 9
  - Do not use canvas-based rendering styles
  - Do not hardcode color values in components (use tokens only)
  - Do not add responsive breakpoints yet (that's Task 16)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Design system creation requires visual/styling expertise
  - **Skills**: []
    - No specialized skills needed beyond CSS expertise

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6)
  - **Blocks**: Tasks 7, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - Current `styles.css` — existing color palette (#0a0e1a, #00f5d4, #06d6a0, #e0e0e0) and font (JetBrains Mono) references
  - Afterglow-crt CSS variables: `--crt-flicker-speed`, `--crt-warp-x`, `--crt-scanline-opacity`, etc. — pattern for CRT token names
  - Scanlines Hugo theme config: historical phosphor colors — `#33FF66` for green phosphor (P1 ~525nm), contrast ratio 14.8:1

  **External References**:
  - CRT color science: https://en.wikipedia.org/wiki/Phosphor — P1 green phosphor color data
  - CSS custom properties spec: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

  **WHY Each Reference Matters**:
  - Current styles.css has the exact color values to port/migrate to the new token system
  - Afterglow-crt provides the naming convention for CRT-specific CSS variables
  - Phosphor color science ensures authentic green CRT colors with proper contrast ratios

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Design tokens are valid CSS custom properties
    Tool: Bash (dev server + Playwright)
    Preconditions: Task 1 completed, dev server running
    Steps:
      1. Create a test HTML file that imports tokens.css and terminal.css
      2. Open in browser via dev server
      3. Verify computed styles on body element use --crt-bg color (#0a0a0a)
      4. Verify JetBrains Mono font is applied
      5. Verify CSS variables are accessible via getComputedStyle
    Expected Result: All custom properties parse correctly and apply to elements
    Failure Indicators: CSS parse errors, missing custom properties, wrong font
    Evidence: .sisyphus/evidence/task-2-tokens-verification.png

  Scenario: Reduced motion preference disables animations
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open page with `prefers-reduced-motion: reduce` set
      2. Verify all animation properties are `none` or `0s`
      3. Verify transition durations are `0s`
    Expected Result: No animations play when reduced motion is preferred
    Failure Indicators: Animations still active, flicker still visible
    Evidence: .sisyphus/evidence/task-2-reduced-motion.png
  ```

  **Commit**: YES
  - Message: `feat(styles): add CRT design system tokens`
  - Files: src/styles/tokens.css, src/styles/reset.css, src/styles/terminal.css
  - Pre-commit: `npm run build`

- [x] 3. Type Definitions

  **What to do**:
  - Create `src/types/index.ts` — re-exports all types
  - Create `src/types/terminal.ts` — DOM-based terminal types:
    - `TerminalState`: idle, booting, ready, processing
    - `TerminalEvent`: input, output, clear, resize
    - `OutputLine`: text content, type (text, heading, error, success, dim, ascii, link), styling class
    - `CursorPosition`: line, column, visible
  - Create `src/types/commands.ts` — command system types:
    - `Command`: id, name, description, usage, handler function signature
    - `CommandResult`: output lines, clear-before flag, exit status
    - `CommandContext`: terminal reference, data access, command registry reference
    - `PluginManifest`: id, name, version, commands, bootHooks
  - Create `src/types/boot.ts` — boot sequence types:
    - `BootPhase`: power-off, bios-post, hardware-detect, kernel-load, init, login, shell-ready
    - `BootStep`: phase name, duration (ms), render function type, skippable flag
    - `BootConfig`: skip-on-revisit flag, total duration estimate
  - Create `src/types/effects.ts` — CRT effects types:
    - `GPUTier`: high (full WebGL), low (scanlines + vignette CSS), minimal (CSS fallback only)
    - `CRTConfig`: tier, scanline intensity, bloom strength, curvature amount, flicker rate
    - `ShaderProgram`: vertex source, fragment source, uniforms

  **Must NOT do**:
  - Do not implement any logic, only type definitions
  - Do not install any runtime packages for types (no XState types, etc.)
  - Do not add utility types that belong in specific modules

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure type definition file creation, straightforward TypeScript interfaces
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5, 6)
  - **Blocks**: Tasks 7, 8, 10
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - Current `main.js` lines 53-89 — existing typed terminal effect pattern (command cycling, character animation) — understand the interaction patterns
  - Research: Command Registry pattern from Metis consultation — Plugin interface with lifecycle hooks

  **External References**:
  - TypeScript strict mode docs: https://www.typescriptlang.org/tsconfig#strict

  **WHY Each Reference Matters**:
  - Main.js shows the actual interaction patterns the types need to support (command input, typed output, event handling)
  - TypeScript strict configuration ensures all types are properly checked

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Type definitions compile without errors
    Tool: Bash
    Preconditions: Task 1 completed (tsconfig.json exists)
    Steps:
      1. Run `npx tsc --noEmit --strict src/types/index.ts`
      2. Verify zero type errors
      3. Verify all exported types are accessible from index.ts
    Expected Result: TypeScript compiler reports zero errors
    Failure Indicators: Type errors, missing exports, any type usage
    Evidence: .sisyphus/evidence/task-1-typecheck.txt

  Scenario: Type imports work from consuming modules
    Tool: Bash
    Preconditions: Type check passed
    Steps:
      1. Create a test file that imports all types from src/types/index.ts
      2. Assign values to typed variables
      3. Run `npx tsc --noEmit` on the test file
    Expected Result: All imports resolve, types enforce correctly
    Failure Indicators: Import errors, type mismatches
    Evidence: .sisyphus/evidence/task-1-type-imports.txt
  ```

  **Commit**: YES
  - Message: `feat(types): add terminal, boot, and effects type definitions`
  - Files: src/types/index.ts, src/types/terminal.ts, src/types/commands.ts, src/types/boot.ts, src/types/effects.ts
  - Pre-commit: `npx tsc --noEmit`

- [x] 4. GPU Tier Detection + CRT Config Utility

  **What to do**:
  - Create `src/utils/gpu-detect.ts`:
    - `detectGPUTier(): GPUTier` function that:
      1. Gets WebGL context from a temporary canvas
      2. Reads `WEBGL_debug_renderer_info` extension for actual GPU name
      3. Runs a brief shader compile + render benchmark (draw a single tri, measure time)
      4. Checks for `prefers-reduced-motion: reduce` media query — if true, force minimal tier
      5. Checks for `prefers-contrast: more` media query — if true, disable bloom/glow
      6. Returns `GPUTier.high` (full effects), `GPUTier.low` (scanlines + vignette), or `GPUTier.minimal` (CSS only)
    - `getCRTConfig(tier: GPUTier): CRTConfig` function returning optimized settings per tier
    - Known low-end GPU blacklist: Adreno 610, PowerVR GE8320, Mali-G52 MC2, Intel HD 4000
    - Mobile detection: if `navigator.maxTouchPoints > 0` and screen width < 768, cap at `low` tier maximum
    - Warm-up function: `warmupShaders()` that compiles CRT shaders offscreen (to be called during boot BIOS phase)
  - Create `src/utils/index.ts` — re-exports
  - Export types: `GPUTier`, `CRTConfig`, `GPUInfo`

  **Must NOT do**:
  - Do not create the actual WebGL shader pipeline (that's Task 9)
  - Do not add any DOM rendering or visual effects
  - Do not block the main thread for more than 100ms during detection
  - Do not use any external GPU detection libraries

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single utility file with well-defined detection logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5, 6)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3 (needs GPUTier and CRTConfig types)

  **References**:

  **Pattern References**:
  - `src/types/effects.ts` — GPUTier and CRTConfig type definitions to implement against

  **External References**:
  - WebGL debug renderer info: https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info
  - CSS prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
  - GPU blacklist reference: Adreno 610, PowerVR GE8320, Mali-G52 MC2 from Metis research

  **WHY Each Reference Matters**:
  - Type definitions in effects.ts are the contract this utility must fulfill
  - WebGL debug renderer info is the standard API for detecting GPU capabilities
  - Known blacklist GPUs from Metis research must be detected and downgraded

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: GPU tier detection returns valid tier
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Import detectGPUTier in a test page
      2. Call detectGPUTier()
      3. Verify return value is one of: 'high', 'low', 'minimal'
      4. Verify getCRTConfig(tier) returns valid CRTConfig object
      5. Verify all CRTConfig fields are populated with reasonable values
    Expected Result: Returns valid tier and config without errors
    Failure Indicators: Undefined return, crash, missing config fields
    Evidence: .sisyphus/evidence/task-4-gpu-detect.txt

  Scenario: Reduced motion forces minimal tier
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Set browser emulation to prefer reduced motion
      2. Call detectGPUTier()
      3. Verify return value is 'minimal'
    Expected Result: Always returns 'minimal' when reduced motion is preferred
    Failure Indicators: Returns 'high' or 'low' despite reduced motion
    Evidence: .sisyphus/evidence/task-4-reduced-motion-tier.txt
  ```

  **Commit**: YES
  - Message: `feat(utils): add GPU tier detection utility`
  - Files: src/utils/gpu-detect.ts, src/utils/index.ts
  - Pre-commit: `npx tsc --noEmit`

- [x] 5. Content Data Files

  **What to do**:
  - Create `src/data/profile.ts` — name, title, location, university, bio text, social links
  - Create `src/data/projects.ts` — array of project objects with: title, description, period, tags, githubUrl, imageUrl
  - Create `src/data/skills.ts` — array of skill objects with: name, category (languages, tools, platforms, security)
  - Create `src/data/certs.ts` — array of certification objects with: name, year, score (optional), issuer, type (cert/award/score)
  - Create `src/data/contact.ts` — email, linkedin, github, plus formatted display versions
  - Create `src/data/index.ts` — re-exports all data
  - All data must come from the current portfolio (preserved exactly):

  **Current profile data to port**:
  - Name: Nguyen Thanh Danh
  - Title: Cybersecurity Engineer & SOC Specialist
  - University: HCMUT (3rd year CS, Cybersecurity specialization)
  - Bio: "I'm a 3rd-year Computer Science student at Ho Chi Minh City University of Technology (HCMUT), specializing in Cybersecurity. I build intelligent security systems — from deep-learning-powered Intrusion Detection Systems to full-scale SOC architectures."
  - Skills: Python, Docker, AWS, Kubernetes, Wireshark, Nmap, Linux, C++, SOC Ops, IDS/IPS, Bash, SQL
  - Projects: IDS Deep Learning (Sep–Dec 2025), SOC Implementation (Jan 2026–Present)
  - Certs: Google Cybersecurity Certificate (2026), TOEIC 850/990 (2024), Outstanding Academic Performance HCMUT (2024)
  - Contact: tdanh2005@gmail.com, linkedin.com/in/danhnt24, github.com/danhnth
  - Resume: assets/Nguyen_Thanh_Danh_CV.pdf

  **Must NOT do**:
  - Do not add any rendering or command logic
  - Do not hardcode data in command files (keep data separate)
  - Do not add data not in the current portfolio (no fabrication)
  - Do not include images inline (reference asset paths only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure data file creation, straightforward TypeScript constants
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 6)
  - **Blocks**: Tasks 11, 12
  - **Blocked By**: Task 3 (needs type definitions for data shapes)

  **References**:

  **Pattern References**:
  - Current `index.html` lines 36-39 — hero title and description to port verbatim
  - Current `index.html` lines 67-76 — about section bio text to port
  - Current `index.html` lines 79-91 — skill badges (exact 12 skills) to port
  - Current `index.html` lines 117-165 — project 1 (IDS Deep Learning) data
  - Current `index.html` lines 169-218 — project 2 (SOC Implementation) data
  - Current `index.html` lines 230-252 — certifications data
  - Current `index.html` lines 262-270 — contact info
  - Current `index.html` line 98 — resume PDF link

  **External References**:
  - None — all data comes from existing portfolio

  **WHY Each Reference Matters**:
  - Every line reference points to the exact content that must be ported to data files without modification

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All profile data is present and correctly ported
    Tool: Bash
    Preconditions: Data files created
    Steps:
      1. Import all data modules
      2. Verify profile.name === 'Nguyen Thanh Danh'
      3. Verify projects.length === 2
      4. Verify skills.length === 12
      5. Verify certs.length === 3
      6. Verify contact.email === 'tdanh2005@gmail.com'
    Expected Result: All data imports correctly with expected values
    Failure Indicators: Missing data, wrong values, import errors
    Evidence: .sisyphus/evidence/task-5-data-verification.txt

  Scenario: TypeScript types validate against data
    Tool: Bash
    Preconditions: Data files and types created
    Steps:
      1. Run `npx tsc --noEmit` on all data files
      2. Verify no type errors
    Expected Result: Zero type errors across all data files
    Failure Indicators: Type mismatches, missing fields
    Evidence: .sisyphus/evidence/task-5-typecheck.txt
  ```

  **Commit**: YES
  - Message: `feat(data): add profile content data files`
  - Files: src/data/profile.ts, src/data/projects.ts, src/data/skills.ts, src/data/certs.ts, src/data/contact.ts, src/data/index.ts
  - Pre-commit: `npx tsc --noEmit`

- [x] 6. Audio Manager with Deferred Playback

  **What to do**:
  - Create `src/audio/audio-manager.ts`:
    - `AudioManager` class with:
      - `private context: AudioContext | null` — created on first user gesture
      - `private audioReady: boolean = false` — set to true after first gesture
      - `private muted: boolean = true` — starts muted
      - `initFromGesture(): void` — call on first click/keypress, creates AudioContext, unmutes, plays queued sounds
      - `isReady(): boolean` — check if audio is available
      - `setMuted(muted: boolean): void` — toggle mute
      - `onReadyChange(callback: (ready: boolean) => void): void` — observe readiness
    - Must handle `NotAllowedError` from `AudioContext.resume()` gracefully
    - Must queue sounds that attempt to play before user gesture and play them when gesture occurs
  - Create `src/audio/oscillator.ts`:
    - `playBeep(frequency: number, duration: number, volume?: number): void` — play a single tone
    - `playBootSequence(): void` — play POST beep pattern (short high beep)
    - `playKeyUp(): void` — short click tone for key press feedback
    - Each function checks audioManager.isReady() before playing, queues if not ready
  - Create `src/audio/sprite-loader.ts`:
    - `loadSprite(url: string): Promise<AudioBuffer>` — load audio file as buffer
    - `playSprite(buffer: AudioBuffer, offset?: number, duration?: number): void` — play loaded sprite
    - Preload function for key-click sounds
  - Create `src/audio/index.ts` — re-exports
  - All audio must be deferred: NO sound plays before user gesture (browser policy)
  - Visual indicator integration: export a `shouldShowMuteIndicator()` method that returns true when audio is not yet ready

  **Must NOT do**:
  - Do not play any audio on page load (autoplay policy)
  - Do not use `new Audio()` constructor for anything other than sprite loading (use AudioContext for all synthesis)
  - Do not create AudioContext before user gesture (Chrome/Firefox policy)
  - Do not add actual audio files yet (just the manager code) — audio files come in Task 15

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Web Audio API has tricky timing and gesture requirements, needs careful implementation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4, 5)
  - **Blocks**: Task 15
  - **Blocked By**: Task 3 (needs type definitions)

  **References**:

  **Pattern References**:
  - `src/types/terminal.ts` — TerminalEvent types that may reference audio events

  **External References**:
  - Web Audio API AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
  - Autoplay policy: https://developer.chrome.com/blog/autoplay/ — Chrome's gesture requirement
  - Audio sprite pattern: https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode

  **WHY Each Reference Matters**:
  - Autoplay policy is the #1 constraint — audio must not play before user gesture
  - AudioContext is correct API for both oscillator beeps and sprite playback
  - Sprite pattern enables efficient key-click sound playback

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Audio context created only after user gesture
    Tool: Playwright
    Preconditions: Audio manager code loaded
    Steps:
      1. Create AudioManager instance
      2. Verify isReady() returns false (no context yet)
      3. Attempt to play a beep — verify it's queued (no error, no sound)
      4. Call initFromGesture()
      5. Verify isReady() returns true
      6. Verify queued beep plays successfully
    Expected Result: Audio plays only after gesture, queued sounds play after init
    Failure Indicators: Audio plays before gesture, errors on queue, crash
    Evidence: .sisyphus/evidence/task-6-audio-deferred.txt

  Scenario: Mute indicator works correctly
    Tool: Playwright
    Preconditions: Audio manager code loaded
    Steps:
      1. Create AudioManager instance
      2. Verify shouldShowMuteIndicator() returns true (audio not ready)
      3. Call initFromGesture()
      4. Verify shouldShowMuteIndicator() returns false (audio ready)
      5. Call setMuted(true)
      6. Verify shouldShowMuteIndicator() returns false (still ready, just muted)
    Expected Result: Mute indicator correctly reflects audio readiness state
    Failure Indicators: Wrong state, always true/false
    Evidence: .sisyphus/evidence/task-6-mute-indicator.txt

  Scenario: Oscillator beeps play correct frequencies
    Tool: Playwright
    Preconditions: Audio context initialized via gesture
    Steps:
      1. Initialize AudioManager via initFromGesture()
      2. Call playBeep(1000, 100) — verify no errors
      3. Call playBootSequence() — verify no errors
      4. Verify AudioContext state is 'running' after each call
    Expected Result: All oscillator functions execute without errors
    Failure Indicators: AudioContext state is 'suspended', errors thrown
    Evidence: .sisyphus/evidence/task-6-oscillator.txt
  ```

  **Commit**: YES
  - Message: `feat(audio): add deferred audio manager with oscillators`
  - Files: src/audio/audio-manager.ts, src/audio/oscillator.ts, src/audio/sprite-loader.ts, src/audio/index.ts
  - Pre-commit: `npx tsc --noEmit`

- [x] 7. Terminal Engine Core (DOM-based)

  **What to do**:
  - Create `src/terminal/terminal.ts` — main Terminal class:
    - Full-viewport container (100vw × 100vh, overflow hidden, black bg)
    - Output buffer area (scrollable, auto-scroll to bottom)
    - Input line with prompt (`guest@danhnth:~$ `) and blinking block cursor
    - Keyboard handling: character input, backspace, enter, arrow keys (history), tab (autocomplete)
    - Command execution pipeline: parse input → find command → execute → render output
    - ARIA live region for screen reader announcements
    - Focus management: terminal stays focused for keyboard input
    - History buffer (last 100 commands in localStorage)
  - Create `src/terminal/input-line.ts` — renders prompt + input text + blinking cursor, handles character insertion/deletion/cursor movement, tab completion
  - Create `src/terminal/output-buffer.ts` — renders OutputLine objects by type (text, heading, error, success, dim, ascii, link), auto-scroll, clear command, word wrap
  - Create `src/terminal/cursor.ts` — blinking block cursor (530ms default), pauses while typing, cursor style changes between boot and shell modes
  - Create `src/terminal/aria-live.ts` — ARIA live region (aria-live="polite") announcing output to screen readers, with boot phase context
  - Create `src/terminal/index.ts` — re-exports

  **Must NOT do**:
  - Do not use `<canvas>` for rendering (DOM-based only)
  - Do not use xterm.js or any external terminal library
  - Do not implement command handlers (that's Tasks 11-13)
  - Do not implement boot sequence rendering (that's Task 10)
  - Do not add CRT effects overlay (that's Task 9)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Terminal engine is the project core, needs careful keyboard handling, scrolling, and cursor logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2 with Tasks 8, 9, 10)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 11, 12, 13, 14, 17
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `src/styles/terminal.css` — terminal layout styles to render into
  - `src/styles/tokens.css` — design tokens for colors, spacing, z-index
  - `src/types/terminal.ts` — TerminalState, OutputLine, CursorPosition types

  **External References**:
  - Keyboard events: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
  - ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions

  **WHY Each Reference Matters**:
  - terminal.css provides the layout the engine must render into; tokens.css provides CSS variables; types define the contract

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Terminal renders with prompt and accepts keyboard input
    Tool: Playwright
    Preconditions: Dev server running, terminal engine loaded
    Steps:
      1. Navigate to the site
      2. Verify dark terminal fills viewport
      3. Verify prompt "guest@danhnth:~$ " visible with blinking cursor
      4. Type "hello" on keyboard — verify text appears
      5. Press Enter — verify "Command not found: hello" error appears
      6. Verify new prompt on next line
    Expected Result: Terminal accepts input, displays typed text, shows error for unknown commands
    Failure Indicators: No prompt, typed text not appearing, no error, crash
    Evidence: .sisyphus/evidence/task-7-terminal-input.png

  Scenario: Backspace and cursor movement work
    Tool: Playwright
    Preconditions: Terminal focused
    Steps:
      1. Type "hello"
      2. Press Backspace 2 times — verify "hel" remains
      3. Press Left arrow — verify cursor moves left
      4. Press Right arrow — verify cursor moves right
    Expected Result: Backspace deletes chars, arrows move cursor
    Failure Indicators: Backspace broken, cursor stuck
    Evidence: .sisyphus/evidence/task-7-cursor-movement.png

  Scenario: ARIA live region announces output
    Tool: Playwright
    Preconditions: Terminal loaded
    Steps:
      1. Locate aria-live element — verify aria-live="polite"
      2. Type command, press Enter
      3. Verify aria-live region updates with output text
    Expected Result: Screen readers can access output via aria-live
    Failure Indicators: No aria-live element, content stale
    Evidence: .sisyphus/evidence/task-7-aria-live.txt

  Scenario: Error handling for unknown commands
    Tool: Playwright
    Preconditions: Terminal with registry loaded (but no commands)
    Steps:
      1. Type "nonexistent" and press Enter
      2. Verify formatted error message appears: "Command not found: nonexistent. Type 'help' for available commands."
    Expected Result: Graceful error with helpful message
    Failure Indicators: Unhandled error, crash, no message
    Evidence: .sisyphus/evidence/task-7-error-handling.png
  ```

  **Commit**: YES
  - Message: `feat(terminal): add DOM-based terminal engine`
  - Files: src/terminal/terminal.ts, src/terminal/input-line.ts, src/terminal/output-buffer.ts, src/terminal/cursor.ts, src/terminal/aria-live.ts, src/terminal/index.ts
  - Pre-commit: `npm run build`

- [x] 8. Command Registry + Plugin System

  **What to do**:
  - Create `src/commands/registry.ts` — CommandRegistry class with register(), execute(), getByName(), getAll(), getCompletions()
  - Create `src/commands/plugin.ts` — PluginManager class with registerPlugin(), getBootSteps(), getAllCommands()
  - Create `src/commands/types.ts` — shared command types (imported from src/types/commands.ts)
  - Create `src/commands/index.ts` — re-exports
  - Built-in commands: `help` (lists all registered), `clear` (clears output buffer)

  **Must NOT do**:
  - Do not implement specific commands (whoami, about, etc.) — Tasks 11-13
  - Do not use dependency injection frameworks — keep simple direct references
  - Do not implement shell features beyond basic execution

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Registry/plugin pattern requires careful type design
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2 with Tasks 7, 9, 10)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 11, 12, 13, 17
  - **Blocked By**: Task 3

  **References**:
  - `src/types/commands.ts` — Command, CommandResult, CommandContext, PluginManifest types

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Registry registers and executes commands
    Tool: Bash
    Steps:
      1. Register test command { name: 'test', handler: () => { output: ['Hello!'] } }
      2. Verify getByName('test') returns the command
      3. Verify execute('test', []) returns CommandResult
      4. Verify execute('nonexistent', []) returns error
      5. Verify getCompletions('te') returns ['test']
    Expected Result: All registry operations work
    Failure Indicators: Missing lookups, wrong output
    Evidence: .sisyphus/evidence/task-8-registry.txt

  Scenario: Plugin system collects commands and boot steps
    Tool: Bash
    Steps:
      1. Register plugin with 2 commands and 1 boot step
      2. Verify getAllCommands() returns both
      3. Verify getBootSteps() returns the step
    Expected Result: Plugin aggregation works correctly
    Failure Indicators: Missing commands or steps
    Evidence: .sisyphus/evidence/task-8-plugin.txt
  ```

  **Commit**: YES
  - Message: `feat(commands): add command registry and plugin system`
  - Files: src/commands/registry.ts, src/commands/plugin.ts, src/commands/types.ts, src/commands/index.ts
  - Pre-commit: `npx tsc --noEmit`

- [x] 9. CRT Effects Pipeline (WebGL + CSS Fallback)

  **What to do**:
  - Create `src/effects/crt-manager.ts` — CRTEffectsManager: detects GPU tier, initializes appropriate effects path, enable/disable/updateConfig methods, respects prefers-reduced-motion and prefers-contrast
  - Create `src/effects/webgl-pipeline.ts` — WebGL rendering: offscreen canvas overlay, compiles fragment shaders (scanlines, bloom, distortion, composite), renders terminal DOM as texture through shader pipeline, mediump precision for mobile
  - Create `src/effects/shader-source.ts` — GLSL shader code as template literals: vertex shader, fragment shaders for scanlines/bloom/distortion/composite with animation uniforms
  - Create `src/effects/css-fallback.css` — CSS-only CRT for low/minimal tiers: scanlines via repeating-linear-gradient, vignette via radial-gradient, flicker via @keyframes, border-radius for curvature illusion
  - Create `src/effects/effects-bridge.ts` — connects effects to terminal: overlay positioning, resize handling, z-index layering
  - Create `src/effects/index.ts` — re-exports

  **Must NOT do**:
  - Do not use external CRT effect libraries (write custom shaders for control)
  - Do not render terminal on canvas (WebGL is overlay only)
  - Do not use highp precision in fragment shaders (mobile compat)
  - Do not block main thread during shader compilation

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: WebGL shader programming is complex, needs performance tuning and GPU compat
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: Tasks 16, 17
  - **Blocked By**: Tasks 2, 4

  **References**:
  - `src/styles/tokens.css` — CRT CSS variables for uniform inputs
  - `src/utils/gpu-detect.ts` — detectGPUTier() and getCRTConfig()
  - `src/types/effects.ts` — GPUTier, CRTConfig, ShaderProgram types

  **External References**:
  - CRT shader techniques: https://github.com/libretro/glsl-shaders
  - Afterglow-crt CSS: https://github.com/HauntedCrusader/afterglow-crt

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: High-tier gets full WebGL CRT effects
    Tool: Playwright
    Steps:
      1. Load page on high-tier GPU
      2. Verify canvas overlay exists in DOM
      3. Verify scanlines, curvature, bloom, chromatic aberration visible
      4. Verify subtle flicker animation
    Expected Result: All CRT effects render on high-tier GPU
    Failure Indicators: No overlay, no effects visible
    Evidence: .sisyphus/evidence/task-9-full-crt.png

  Scenario: Low-tier gets CSS scanlines + vignette
    Tool: Playwright
    Steps:
      1. Force gpu-detect to return 'low'
      2. Load page — verify CSS scanlines and vignette applied
      3. Verify NO WebGL canvas overlay
    Expected Result: CSS-only effects, no WebGL on low tier
    Failure Indicators: WebGL canvas on low tier, no effects
    Evidence: .sisyphus/evidence/task-9-low-tier.png

  Scenario: prefers-reduced-motion disables animations
    Tool: Playwright
    Steps:
      1. Set prefers-reduced-motion: reduce
      2. Load page — verify no flicker, static scanlines, no glow animation
    Expected Result: All animations disabled
    Failure Indicators: Animations still playing
    Evidence: .sisyphus/evidence/task-9-reduced-motion.png
  ```

  **Commit**: YES
  - Message: `feat(effects): add WebGL CRT effects pipeline`
  - Files: src/effects/crt-manager.ts, src/effects/webgl-pipeline.ts, src/effects/shader-source.ts, src/effects/css-fallback.css, src/effects/effects-bridge.ts, src/effects/index.ts
  - Pre-commit: `npm run build`

- [x] 10. Boot Sequence (5 Phases + Shader Warmup)

  **What to do**:
  - Create `src/boot/boot-sequence.ts` — BootSequence orchestrator: async/await linear progression, run()/skip() methods, checks localStorage 'crt-boot-seen' flag (skip=resume animation), calls warmupShaders() during BIOS
  - Create `src/boot/phases/bios-post.ts` — BIOS POST: ASCII logo "DANHNTH SYSTEMS", memory count (0→16384K), CPU detection, hardware list, POST beep. Duration: ~4s
  - Create `src/boot/phases/hardware-detect.ts` — Hardware detection: IDE drives, network interfaces, all OK status. Duration: ~3s
  - Create `src/boot/phases/kernel-load.ts` — Kernel loading: version string, driver init messages with [OK]/[FAILED]. Duration: ~5s
  - Create `src/boot/phases/init-system.ts` — Init services: "Starting services..." with service results. Duration: ~3s
  - Create `src/boot/phases/login.ts` — Login prompt: "danhnth login:" auto-types "guest", password dots, "Login successful". Duration: ~3s
  - Create `src/boot/warmup.ts` — warmupShaders(): compiles CRT shaders offscreen on 1×1 canvas during BIOS phase, avoids Safari stall

  **Must NOT do**:
  - Do not use XState or state machine libraries
  - Do not use canvas for boot text (DOM only)
  - Do not play audio before user gesture (boot starts silent, audio queued)
  - Do not hardcode strings in display logic (use data objects)
  - Do not block main thread during warmup

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex timing, animation choreography, shader warmup integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: Tasks 14, 15, 17
  - **Blocked By**: Tasks 3, 5

  **References**:
  - `src/terminal/terminal.ts` — Terminal API for writing output
  - `src/types/boot.ts` — BootPhase, BootStep types
  - `src/data/profile.ts` — name for login prompt and manufacturer
  - Linux boot reference: https://tldp.org/HOWTO/BootPrompt-HOWTO/

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full boot plays on first visit
    Tool: Playwright
    Steps:
      1. Clear localStorage
      2. Load page — verify BIOS POST, hardware detect, kernel load, init, login phases
      3. Verify ~15-20s total duration
      4. Verify 'crt-boot-seen' set in localStorage after completion
    Expected Result: All 5 boot phases play sequentially
    Failure Indicators: Skipped phases, crash, text not visible
    Evidence: .sisyphus/evidence/task-10-full-boot.png

  Scenario: Boot skipped on revisit
    Tool: Playwright
    Steps:
      1. Set localStorage 'crt-boot-seen' = 'true'
      2. Refresh — verify brief "system resume" (2-3s) then shell prompt
    Expected Result: Abbreviated resume, no full boot
    Failure Indicators: Full boot plays again
    Evidence: .sisyphus/evidence/task-10-revisit.png

  Scenario: Shader warmup during BIOS doesn't block
    Tool: Playwright
    Steps:
      1. Clear localStorage, load page
      2. BIOS POST screen appears within 1 second
      3. No freezing or blank screen during shader compilation
    Expected Result: Boot starts immediately, shaders warm up in background
    Failure Indicators: Delayed start, frozen UI
    Evidence: .sisyphus/evidence/task-10-warmup.txt
  ```

  **Commit**: YES
  - Message: `feat(boot): add OS boot sequence with 5 phases`
  - Files: src/boot/boot-sequence.ts, src/boot/phases/bios-post.ts, src/boot/phases/hardware-detect.ts, src/boot/phases/kernel-load.ts, src/boot/phases/init-system.ts, src/boot/phases/login.ts, src/boot/warmup.ts
  - Pre-commit: `npm run build`

- [ ] 11. Profile Commands (whoami, about, skills)

  **What to do**:
  - Create `src/commands/impl/whoami.ts` — displays name, title, contact in formatted box (ASCII art styled). Uses data from `src/data/profile.ts`
  - Create `src/commands/impl/about.ts` — displays bio text with highlighted keywords, university info. Uses data from `src/data/profile.ts`
  - Create `src/commands/impl/skills.ts` — displays skills grouped by category (languages, tools, platforms, security) in a formatted table. Uses data from `src/data/skills.ts`
  - All commands implement the `Command` interface from `src/commands/types.ts`
  - Each command returns `CommandResult` with typed `OutputLine[]`
  - All text formatted with proper terminal styling (ASCII box drawing, color types)

  **Must NOT do**:
  - Do not hardcode profile data in commands (import from src/data/)
  - Do not add commands other than whoami, about, skills
  - Do not use HTML rendering (terminal text only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple command implementations with data formatting
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3 with Tasks 12, 13, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 5, 7, 8

  **References**:
  - `src/data/profile.ts` — name, title, bio, contact data
  - `src/data/skills.ts` — skills with categories
  - `src/commands/types.ts` — Command, CommandResult interface
  - `src/terminal/output-buffer.ts` — OutputLine type for rendering

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: whoami displays profile in formatted box
    Tool: Playwright
    Steps:
      1. Type "whoami" and press Enter
      2. Verify name "Nguyen Thanh Danh" appears
      3. Verify title "Cybersecurity Engineer & SOC Specialist" appears
      4. Verify contact info (email, LinkedIn, GitHub) appears
      5. Verify output is formatted in ASCII box
    Expected Result: Profile info in bordered ASCII box
    Failure Indicators: Missing data, broken formatting
    Evidence: .sisyphus/evidence/task-11-whoami.png

  Scenario: about displays bio text
    Tool: Playwright
    Steps:
      1. Type "about" and press Enter
      2. Verify HCMUT university mention
      3. Verify cybersecurity specialization mention
      4. Verify keywords are highlighted (bright green)
    Expected Result: Formatted bio text with highlighted terms
    Failure Indicators: Plain unformatted text, missing keywords
    Evidence: .sisyphus/evidence/task-11-about.png

  Scenario: skills displays grouped table
    Tool: Playwright
    Steps:
      1. Type "skills" and press Enter
      2. Verify all 12 skills appear (Python, Docker, AWS, etc.)
      3. Verify skills are grouped by category
      4. Verify formatting uses terminal table style
    Expected Result: Skills in grouped table format
    Failure Indicators: Missing skills, ungrouped list
    Evidence: .sisyphus/evidence/task-11-skills.png
  ```

  **Commit**: YES
  - Message: `feat(commands): add profile commands (whoami, about, skills)`
  - Files: src/commands/impl/whoami.ts, src/commands/impl/about.ts, src/commands/impl/skills.ts
  - Pre-commit: `npm run build`

- [ ] 12. Content Commands (projects, cat, certs, contact, resume)

  **What to do**:
  - Create `src/commands/impl/projects.ts` — lists projects in a "routed view" (scrollable list inside terminal with selection). Projects show title, period, description, tags, GitHub link. Uses `src/data/projects.ts`. Type "1" or project name to see details.
  - Create `src/commands/impl/cat.ts` — displays file content. `cat about.md` shows bio, `cat projects/ids.md` shows project details, `cat resume.txt` shows resume summary. Virtual filesystem mapped to data files.
  - Create `src/commands/impl/certs.ts` — displays certifications in ASCII table. Uses `src/data/certs.ts`
  - Create `src/commands/impl/contact.ts` — displays contact info with clickable links. Uses `src/data/contact.ts`
  - Create `src/commands/impl/resume.ts` — provides link to download PDF resume. Opens `assets/Nguyen_Thanh_Danh_CV.pdf` in new tab.
  - All commands implement `Command` interface and return `CommandResult` with styled `OutputLine[]`

  **Must NOT do**:
  - Do not hardcode data (import from src/data/)
  - Do not implement a real filesystem (cat uses virtual file mapping)
  - Do not use window.open for anything except resume PDF download

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: projects command has "routed view" UI complexity, cat has virtual filesystem
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 5, 7, 8

  **References**:
  - `src/data/projects.ts` — project entries with title, description, tags, URLs
  - `src/data/certs.ts` — certification data
  - `src/data/contact.ts` — email, LinkedIn, GitHub
  - `src/commands/types.ts` — Command interface
  - Current `index.html` lines 117-165 — project 1 data (IDS Deep Learning)
  - Current `index.html` lines 169-218 — project 2 data (SOC Implementation)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: projects command shows project list
    Tool: Playwright
    Steps:
      1. Type "projects" and press Enter
      2. Verify 2 projects listed (IDS Deep Learning, SOC Implementation)
      3. Verify each shows title, period, and tags
      4. Verify interaction prompt to view details
    Expected Result: Formatted project list with details
    Failure Indicators: Missing projects, broken formatting
    Evidence: .sisyphus/evidence/task-12-projects.png

  Scenario: cat about.md displays bio content
    Tool: Playwright
    Steps:
      1. Type "cat about.md" and press Enter
      2. Verify bio text appears (HCMUT, cybersecurity mention)
      3. Verify "No such file" error for cat nonexistent.txt
    Expected Result: Virtual file content for valid paths, error for invalid
    Failure Indicators: No content, no error for invalid paths
    Evidence: .sisyphus/evidence/task-12-cat.png

  Scenario: certs, contact, resume all work
    Tool: Playwright
    Steps:
      1. Type "certs" — verify 3 certifications appear
      2. Type "contact" — verify email, LinkedIn, GitHub appear
      3. Type "resume" — verify download link appears
    Expected Result: All commands display correct data
    Failure Indicators: Missing data, broken links
    Evidence: .sisyphus/evidence/task-12-content-commands.png
  ```

  **Commit**: YES
  - Message: `feat(commands): add content commands (projects, cat, certs, contact, resume)`
  - Files: src/commands/impl/projects.ts, src/commands/impl/cat.ts, src/commands/impl/certs.ts, src/commands/impl/contact.ts, src/commands/impl/resume.ts
  - Pre-commit: `npm run build`

- [ ] 13. Shell System Commands (help, clear, echo, neofetch)

  **What to do**:
  - Create `src/commands/impl/help.ts` — lists all registered commands with descriptions. Format: colored command names (green), descriptions (dim), organized alphabetically. Shows usage examples.
  - Create `src/commands/impl/clear.ts` — clears the terminal output buffer. Simple command, no output after clearing.
  - Create `src/commands/impl/echo.ts` — echoes back typed text. `echo Hello world` → `Hello world`. Supports simple variable substitution: `$USER` → "guest", `$HOST` → "danhnth", `$DATE` → current date.
  - Create `src/commands/impl/neofetch.ts` — displays system info in ASCII art format: terminal name, host, uptime (time since page load), shell (danhn-term v1.0), resolution, theme (green phosphor), CPU (virtual), memory (GPU tier info). Classic neofetch-style output with ASCII art logo of the name "DANH".
  - All commands implement `Command` interface and return `CommandResult`

  **Must NOT do**:
  - Do not add any commands beyond help, clear, echo, neofetch
  - Do not implement full shell variable substitution (just 3 simple variables)
  - Do not make neofetch fetch real system info (it's simulated/portfolio data)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple command implementations with formatting
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 7, 8

  **References**:
  - `src/commands/registry.ts` — getAll() method for help command listing
  - `src/commands/types.ts` — Command interface

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: help lists all registered commands
    Tool: Playwright
    Steps:
      1. Type "help" and press Enter
      2. Verify all registered commands appear (whoami, about, skills, projects, cat, certs, contact, resume, help, clear, echo, neofetch)
      3. Verify each has a description
      4. Verify output is color-formatted (green commands, dim descriptions)
    Expected Result: Complete command list with descriptions
    Failure Indicators: Missing commands, unformatted output
    Evidence: .sisyphus/evidence/task-13-help.png

  Scenario: neofetch shows system info
    Tool: Playwright
    Steps:
      1. Type "neofetch" and press Enter
      2. Verify ASCII art logo appears
      3. Verify system info lines (host, shell, theme, etc.)
      4. Verify green phosphor theme listed
    Expected Result: Formatted neofetch-style output with ASCII art
    Failure Indicators: Missing info, broken ASCII art
    Evidence: .sisyphus/evidence/task-13-neofetch.png

  Scenario: echo and clear work correctly
    Tool: Playwright
    Steps:
      1. Type "echo Hello world" — verify "Hello world" output
      2. Type "echo $USER" — verify "guest" output
      3. Type "clear" — verify output buffer is cleared
    Expected Result: Echo returns text, clear wipes screen
    Failure Indicators: Echo broken, variable substitution fails, clear doesn't work
    Evidence: .sisyphus/evidence/task-13-echo-clear.png
  ```

  **Commit**: YES
  - Message: `feat(commands): add shell system commands (help, clear, echo, neofetch)`
  - Files: src/commands/impl/help.ts, src/commands/impl/clear.ts, src/commands/impl/echo.ts, src/commands/impl/neofetch.ts
  - Pre-commit: `npm run build`

- [ ] 14. Login Prompt + Welcome Message

  **What to do**:
  - Enhance `src/boot/phases/login.ts` — already exists from Task 10, this task adds the welcome message that appears AFTER login:
    - "Last login: [current date/time] from [visitor IP placeholder / localhost]"
    - ASCII art welcome banner with "WELCOME TO DANHNTH SYSTEMS"
    - System info: "Kernel: danhn-term v1.0 | Uptime: just started | Shell: danhn-sh"
    - Help tip: "Type 'help' for available commands"
    - Fun Easter egg hint: "Hint: Try 'neofetch' for system info"
  - Create `src/boot/welcome.ts` — welcome message renderer that outputs the formatted welcome sequence line by line with typing animation
  - The welcome message auto-types after login completes (part of the auto-login flow)
  - On revisit (skip boot): show abbreviated "Welcome back. Type 'help' for commands."

  **Must NOT do**:
  - Do not show IP addresses for real (use "localhost" or simulated)
  - Do not make welcome message longer than 10 lines (keep it clean)
  - Do not show welcome on every command (only after boot/login)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Enhancement to existing login phase, straightforward text formatting
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 15
  - **Blocked By**: Task 10

  **References**:
  - `src/boot/phases/login.ts` — login phase to enhance
  - `src/terminal/output-buffer.ts` — OutputLine types for rendering
  - `src/data/profile.ts` — name for welcome banner

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Welcome message appears after login
    Tool: Playwright
    Steps:
      1. Clear localStorage (first visit)
      2. Load page, wait for boot sequence to complete
      3. Verify "Last login:" line appears
      4. Verify welcome banner appears
      5. Verify "Type 'help'" tip appears
      6. Verify prompt is ready for input
    Expected Result: Welcome message with date, banner, tips
    Failure Indicators: No welcome, missing tips, prompt not ready
    Evidence: .sisyphus/evidence/task-14-welcome.png

  Scenario: Abbreviated welcome on revisit
    Tool: Playwright
    Steps:
      1. Set localStorage 'crt-boot-seen' = 'true'
      2. Refresh page
      3. Verify abbreviated "Welcome back" message appears
      4. Verify prompt is ready within 3 seconds
    Expected Result: Short welcome, no full boot
    Failure Indicators: Full welcome message on revisit
    Evidence: .sisyphus/evidence/task-14-welcome-back.png
  ```

  **Commit**: YES
  - Message: `feat(boot): add login prompt and welcome message`
  - Files: src/boot/phases/login.ts, src/boot/welcome.ts
  - Pre-commit: `npm run build`

- [ ] 15. Sound Effects Integration

  **What to do**:
  - Create sound effect audio files or generate them procedurally:
    - `public/sounds/key-click.mp3` — short click sound for key press (or generate via oscillator)
    - `public/sounds/crt-hum.mp3` — ambient CRT hum loop (or generate via oscillator)
    - `public/sounds/boot-beep.mp3` — POST beep for BIOS phase (oscillator)
    - `public/sounds/enter.wav` — enter key sound (or generate via oscillator)
  - Integrate AudioManager (from Task 6) into the terminal and boot sequence:
    - Boot sequence: POST beep during BIOS phase (via oscillator), ambient start during kernel load
    - Terminal: key click on character input (via sprite), enter sound on command execution
    - Audio activates ONLY after first user gesture (click/keypress)
    - Show mute indicator (🔇 icon or "Click for sound") before audio is ready
  - Add mute/unmute toggle command or keyboard shortcut (Ctrl+M)
  - Create `src/audio/integration.ts` — wires audio manager to terminal events and boot events

  **Must NOT do**:
  - Do not play audio before user gesture (autoplay policy)
  - Do not use copyrighted sound effects (generate or use CC0)
  - Do not make sounds loud — they should be subtle ambiance, not jarring
  - Do not block page load for audio files (lazy load)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Audio integration across multiple systems requires careful event wiring and autoplay handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 6, 10, 14)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 17
  - **Blocked By**: Tasks 6, 10, 14

  **References**:
  - `src/audio/audio-manager.ts` — AudioManager class with deferred playback
  - `src/audio/oscillator.ts` — playBeep, playBootSequence, playKeyUp functions
  - `src/boot/boot-sequence.ts` — boot phases where audio events fire
  - `src/terminal/terminal.ts` — keyboard events where key clicks fire

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Audio activates after first interaction
    Tool: Playwright
    Steps:
      1. Load page (audio not ready)
      2. Verify mute indicator is visible
      3. Press any key (first gesture)
      4. Verify mute indicator disappears
      5. Type a command — verify key click sounds play
    Expected Result: Audio only after gesture, indicator shows state
    Failure Indicators: Audio plays on load, no indicator, crash on play
    Evidence: .sisyphus/evidence/task-15-audio-gesture.png

  Scenario: Boot beep plays during BIOS phase (after gesture)
    Tool: Playwright
    Steps:
      1. Click page to activate audio
      2. Clear localStorage and reload
      3. Verify POST beep during BIOS screen
      4. Verify no audio errors in console
    Expected Result: Boot beep sounds during BIOS phase
    Failure Indicators: No beep, audio errors, beep before gesture
    Evidence: .sisyphus/evidence/task-15-boot-beep.txt

  Scenario: Mute toggle works
    Tool: Playwright
    Steps:
      1. Activate audio (click)
      2. Type something — verify key clicks
      3. Press Ctrl+M — verify muted state indicator
      4. Type something — verify no sound
      5. Press Ctrl+M — verify unmuted
      6. Type — verify clicks return
    Expected Result: Mute toggle silences and restores audio
    Failure Indicators: Sound plays when muted, can't unmute
    Evidence: .sisyphus/evidence/task-15-mute-toggle.png
  ```

  **Commit**: YES
  - Message: `feat(audio): integrate sound effects into boot and terminal`
  - Files: src/audio/integration.ts, public/sounds/ (audio files)
  - Pre-commit: `npm run build`

- [ ] 16. Mobile Adaptation + Touch Keyboard

  **What to do**:
  - Create `src/terminal/touch-keyboard.ts` — virtual keyboard overlay for mobile:
    - Appears on mobile viewports (< 768px width) or touch devices
    - Common keys: A-Z, 0-9, space, enter, backspace, arrow keys
    - Special keys: Tab (autocomplete), Ctrl+C (cancel), Ctrl+L (clear)
    - Semi-transparent overlay at bottom of screen
    - Toggle button (keyboard icon) to show/hide
  - Create `src/styles/mobile.css` — responsive styles:
    - Terminal viewport at 100vh with touch keyboard visible
    - Font size adjustments for mobile (slightly larger for readability)
    - CRT effects simplification for mobile (reduce shader complexity for low tier)
    - Touch-friendly tap targets (minimum 44px)
  - Adapt CRT effects for mobile:
    - Mobile devices cap at `low` GPU tier maximum (already in gpu-detect)
    - On touch-only devices, disable barrel distortion (interferes with touch accuracy)
    - Reduce scanline sharpness on small screens

  **Must NOT do**:
  - Do not remove any features on mobile (same experience, adapted)
  - Do not use mobile-specific libraries (custom implementation)
  - Do not hide the terminal or replace it with a different interface on mobile

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Mobile UI/UX adaptation requires visual/styling expertise
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 17
  - **Blocked By**: Task 9

  **References**:
  - `src/terminal/terminal.ts` — keyboard event handling to replicate for touch
  - `src/effects/crt-manager.ts` — CRT effects to simplify on mobile
  - `src/utils/gpu-detect.ts` — GPU tier detection already caps mobile at low
  - `src/styles/tokens.css` — design tokens for responsive sizes

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Touch keyboard appears on mobile
    Tool: Playwright (mobile viewport)
    Steps:
      1. Set viewport to 375×812 (iPhone X)
      2. Enable touch emulation
      3. Load page
      4. Verify keyboard toggle icon visible
      5. Tap toggle — verify keyboard overlay appears
      6. Tap 'h' on keyboard — verify 'h' appears in terminal input
      7. Tap Enter — verify command executes
    Expected Result: Touch keyboard works for command input
    Failure Indicators: No keyboard appears, taps don't register
    Evidence: .sisyphus/evidence/task-16-touch-keyboard.png

  Scenario: CRT effects adapt for mobile
    Tool: Playwright (mobile viewport)
    Steps:
      1. Set viewport to 375×812
      2. Load page
      3. Verify CRT effects present but simplified (scanlines, vignette)
      4. Verify NO barrel distortion (interferes with touch)
      5. Verify terminal is fully usable at mobile size
    Expected Result: Simplified CRT effects, full usability
    Failure Indicators: No effects, broken layout, touch issues
    Evidence: .sisyphus/evidence/task-16-mobile-effects.png

  Scenario: Desktop layout unaffected by mobile styles
    Tool: Playwright (desktop viewport)
    Steps:
      1. Set viewport to 1920×1080
      2. Load page
      3. Verify no touch keyboard visible
      4. Verify full CRT effects (scanlines, bloom, distortion)
      5. Verify normal keyboard input works
    Expected Result: Desktop experience unchanged by mobile code
    Failure Indicators: Touch keyboard on desktop, reduced effects
    Evidence: .sisyphus/evidence/task-16-desktop-check.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add mobile adaptation and touch keyboard`
  - Files: src/terminal/touch-keyboard.ts, src/styles/mobile.css
  - Pre-commit: `npm run build`

- [ ] 17. Main Entry Point + System Wiring

  **What to do**:
  - Create `src/main.ts` — the main entry point that orchestrates everything:
    1. Import and initialize design tokens (tokens.css)
    2. Detect GPU tier via `detectGPUTier()`
    3. Create container DOM element (full viewport)
    4. Initialize CRT effects manager with detected tier
    5. Initialize audio manager (deferred, waiting for gesture)
    6. Initialize terminal engine on the container
    7. Initialize command registry and register all commands
    8. Initialize plugin manager and register all plugins
    9. Check localStorage for 'crt-boot-seen'
    10. If first visit: run full boot sequence → login → welcome
    11. If revisit: run abbreviated "system resume" → welcome back
    12. After boot: show mute indicator if audio not yet activated
    13. Set up event listeners: keyboard input, resize, visibility change
    14. Handle Ctrl+C (cancel current command), Ctrl+L (clear), Ctrl+M (mute toggle)
  - Wire all modules together — this is the glue code that makes the system work as a whole
  - Set up the `audioManager.initFromGesture()` call on first click/keypress
  - Connect CRT effects resize handler to window resize
  - Restore URL hash if present (for direct link to specific section)

  **Must NOT do**:
  - Do not implement any new features here, only wire existing modules
  - Do not add any commands not already implemented in Tasks 11-13
  - Do not modify any existing module APIs (use them as-is)
  - Do not forget to handle the audio gesture requirement (AudioManager.initFromGesture on first interaction)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: System integration requires understanding all module APIs and careful orchestration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on ALL previous tasks)
  - **Parallel Group**: Wave 4 (sequential after 15, 16)
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 1, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16

  **References**:
  - All previously created modules in src/
  - `src/terminal/terminal.ts` — Terminal class API
  - `src/commands/registry.ts` — CommandRegistry API
  - `src/commands/plugin.ts` — PluginManager API
  - `src/effects/crt-manager.ts` — CRTEffectsManager API
  - `src/audio/audio-manager.ts` — AudioManager API
  - `src/boot/boot-sequence.ts` — BootSequence API
  - `src/utils/gpu-detect.ts` — detectGPUTier() API

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full system boots and reaches interactive shell
    Tool: Playwright
    Steps:
      1. Clear localStorage (first visit)
      2. Load page
      3. Verify CRT effects appear (scanlines visible)
      4. Verify boot sequence plays: BIOS → hardware → kernel → init → login
      5. Wait for shell prompt to appear
      6. Type "whoami" — verify profile info displayed
      7. Type "help" — verify command list displayed
      8. Type "neofetch" — verify system info displayed
    Expected Result: Complete boot sequence → interactive shell with working commands
    Failure Indicators: Boot fails, commands don't work, CRT effects missing
    Evidence: .sisyphus/evidence/task-17-full-system.png

  Scenario: Audio activates on first interaction
    Tool: Playwright
    Steps:
      1. Load page
      2. Verify mute indicator visible
      3. Click terminal area
      4. Verify mute indicator disappears
      5. Type a key — verify key click plays (if audio enabled)
    Expected Result: Audio activates after first gesture
    Failure Indicators: Audio plays before gesture, indicator stays after gesture
    Evidence: .sisyphus/evidence/task-17-audio-activation.png

  Scenario: Revisit skips boot
    Tool: Playwright
    Steps:
      1. Complete first visit (full boot)
      2. Reload page
      3. Verify abbreviated "system resume" instead of full boot
      4. Verify prompt appears within 3 seconds
    Expected Result: Quick resume, no full boot on revisit
    Failure Indicators: Full boot plays again
    Evidence: .sisyphus/evidence/task-17-revisit.png
  ```

  **Commit**: YES
  - Message: `feat(core): wire main entry point and initialize all systems`
  - Files: src/main.ts
  - Pre-commit: `npm run build`

- [ ] 18. GitHub Pages Deployment + CI/CD

  **What to do**:
  - Create `.github/workflows/deploy.yml` — GitHub Actions workflow:
    - Trigger: push to `main` branch
    - Steps: checkout, setup Node.js, npm install, npm run build, deploy to gh-pages branch
    - Uses `peaceiris/actions-gh-pages` or similar
  - Ensure `vite.config.ts` has correct `base` for GitHub Pages (either `/` for user site or `/repo-name/` for project site)
  - Verify `public/404.html` redirects correctly for SPA routing
  - Verify `public/.nojekyll` exists
  - Copy existing assets (profile.jpg, CV PDF, favicon) to `public/assets/` so they're accessible
  - Create `CNAME` file if custom domain is configured (or skip if using danhnth.github.io)
  - Test deployment: push to main, verify site accessible at https://danhnth.github.io

  **Must NOT do**:
  - Do not configure path-based routing (use hash routing only)
  - Do not deploy to a branch other than gh-pages or main
  - Do not include node_modules in the deployment
  - Do not forget to copy existing assets (CV, images, favicon)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard CI/CD configuration, well-established pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 17)
  - **Parallel Group**: Wave 4 (sequential after Task 17)
  - **Blocks**: FINAL
  - **Blocked By**: Tasks 1, 17

  **References**:
  - Current GitHub remote: `https://github.com/danhnth/danhnth.github.io.git`
  - Current `assets/` directory: profile.jpg, Nguyen_Thanh_Danh_CV.pdf, soc-project.jpg, favicon set
  - SPA GitHub Pages pattern: https://github.com/rafgraph/spa-github-pages

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Build produces deployable output
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Verify `dist/` directory exists
      3. Verify `dist/index.html` exists
      4. Verify `dist/404.html` exists
      5. Verify `dist/.nojekyll` exists
      6. Verify `dist/assets/` contains profile.jpg, CV PDF, favicon
    Expected Result: Complete deployable static site in dist/
    Failure Indicators: Missing files, empty dist/
    Evidence: .sisyphus/evidence/task-18-build.txt

  Scenario: Site serves correctly from dist/
    Tool: Playwright
    Steps:
      1. Run `npm run preview` to serve dist/
      2. Load localhost URL
      3. Verify terminal loads
      4. Verify CRT effects appear
      5. Verify boot sequence plays
      6. Verify all commands work
    Expected Result: Full site works from built static files
    Failure Indicators: 404 errors, missing assets, broken JS
    Evidence: .sisyphus/evidence/task-18-preview.png

  Scenario: GitHub Actions workflow file is valid
    Tool: Bash
    Preconditions: Deploy workflow created
    Steps:
      1. Validate `.github/workflows/deploy.yml` syntax
      2. Verify it triggers on push to main
      3. Verify it runs npm install, npm run build, and deploys
    Expected Result: Valid workflow file that deploys to GH Pages
    Failure Indicators: YAML syntax error, missing steps
    Evidence: .sisyphus/evidence/task-18-workflow.txt
  ```

  **Commit**: YES
  - Message: `feat(deploy): add GitHub Pages deployment and CI/CD`
  - Files: .github/workflows/deploy.yml, CNAME (if needed), vite.config.ts (update base), public/assets/ (copy from old assets)
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npx eslint src/` + `npm run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Types [N errors] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: boot → login → commands → effects → sound. Test edge cases: revisit (boot skip), mobile viewport, GPU tier fallback, prefers-reduced-motion. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(scaffold): initialize Vite + TypeScript project` - package.json, vite.config.ts, tsconfig.json, index.html, 404.html
- **2**: `feat(styles): add CRT design system tokens` - src/styles/*.css
- **3**: `feat(types): add terminal, boot, and effects type definitions` - src/types/*.ts
- **4**: `feat(utils): add GPU tier detection utility` - src/utils/gpu-detect.ts
- **5**: `feat(data): add profile content data files` - src/data/*.ts
- **6**: `feat(audio): add deferred audio manager with oscillators` - src/audio/*.ts
- **7**: `feat(terminal): add DOM-based terminal engine` - src/terminal/*.ts
- **8**: `feat(commands): add command registry and plugin system` - src/commands/*.ts
- **9**: `feat(effects): add WebGL CRT effects pipeline` - src/effects/*.ts, src/effects/shaders/*.glsl
- **10**: `feat(boot): add OS boot sequence with 5 phases` - src/boot/*.ts
- **11**: `feat(commands): add profile commands (whoami, about, skills)` - src/commands/impl/whoami.ts, about.ts, skills.ts
- **12**: `feat(commands): add content commands (projects, cat, certs, contact, resume)` - src/commands/impl/...
- **13**: `feat(commands): add shell system commands (help, clear, echo, neofetch)` - src/commands/impl/...
- **14**: `feat(boot): add login prompt and welcome message` - src/boot/phases/login.ts
- **15**: `feat(audio): integrate sound effects into boot and terminal` - integration
- **16**: `feat(ui): add mobile adaptation and touch keyboard` - src/terminal/touch-keyboard.ts, src/styles/mobile.css
- **17**: `feat(core): wire main entry point and initialize all systems` - src/main.ts
- **18**: `feat(deploy): add GitHub Pages deployment and CI/CD` - .github/workflows/deploy.yml

---

## Success Criteria

### Verification Commands
```bash
npm run build                # Expected: Successful build, dist/ folder created
npx tsc --noEmit             # Expected: No type errors
npx vite preview             # Expected: Dev server starts, boot sequence plays
npm run deploy               # Expected: Deployed to danhnth.github.io
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Boot sequence plays on first visit, skips on revisit
- [ ] All 10+ commands produce correct output
- [ ] CRT effects render on high-GPU, CSS fallback on low-GPU
- [ ] Sound plays after first interaction, muted before
- [ ] Mobile layout functional with touch keyboard
- [ ] Accessibility: prefers-reduced-motion, prefers-contrast, ARIA
- [ ] GitHub Pages deployment works end-to-end