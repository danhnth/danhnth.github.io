# Architectural Decisions

## 2026-05-23: Start Work Session
- Plan: crt-terminal-portfolio
- Approach: Wave-based parallel execution
- Wave 1: T1 (scaffold) + T3 (types) first, then T2, T4, T5, T6 in parallel
- Rationale: T1 creates tsconfig.json needed for type checking; T3 creates types needed by T4, T5, T6

## Existing Project State
- Current site: SimpleFolio-based portfolio (index.html, main.js, styles.css, assets/)
- No package.json, no src/, no Vite config
- index.html already references `/src/main.ts` (prepared for Vite conversion)
- Assets to preserve: profile.jpg, Nguyen_Thanh_Danh_CV.pdf, soc-project.jpg, favicon set
