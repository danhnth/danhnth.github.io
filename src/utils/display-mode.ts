/**
 * Display mode: the user-facing choice between the CRT shader look and a
 * plain, modern terminal UI.
 *
 * Modes persist to localStorage so the preference survives reloads, and can
 * be forced per-visit with `?display=crt|modern` in the URL (the URL override
 * is NOT persisted — it is meant for sharing links and test setups).
 *
 * `setDisplayMode()` owns the persistence + DOM class. The actual CRT
 * pipeline teardown/rebuild is performed by whoever listens for
 * `crt:display-change` (main.ts wires it to CRTEffectsManager), keeping this
 * module free of effect-engine dependencies.
 */

export type DisplayMode = 'crt' | 'modern';

export const DISPLAY_MODE_EVENT = 'crt:display-change';
export const DISPLAY_MODE_CLASS = 'crt-mode--modern';

const STORAGE_KEY = 'crt-display-mode';

export function isValidDisplayMode(value: unknown): value is DisplayMode {
  return value === 'crt' || value === 'modern';
}

/** Mode forced via the URL (?display=...), or null when absent/invalid. */
export function getURLDisplayMode(): DisplayMode | null {
  const value = new URLSearchParams(window.location.search).get('display');
  return isValidDisplayMode(value) ? value : null;
}

/** Previously persisted mode, or 'crt' when unset. */
export function getStoredDisplayMode(): DisplayMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null && isValidDisplayMode(raw)) {
      return raw;
    }
  } catch {
    // Storage unavailable (private mode etc.) — fall through to default.
  }
  return 'crt';
}

/**
 * Effective mode for this page load: URL override wins, then persisted
 * preference, then the CRT default.
 */
export function resolveDisplayMode(): DisplayMode {
  return getURLDisplayMode() ?? getStoredDisplayMode();
}

/** Reflect the mode in the document class used by modern.css. */
export function applyDisplayModeClass(mode: DisplayMode): void {
  document.documentElement.classList.toggle(
    DISPLAY_MODE_CLASS,
    mode === 'modern'
  );
}

/**
 * Persist, reflect, and announce a mode change. Dispatching an event rather
 * than calling the effect engine directly keeps this module decoupled and
 * lets main.ts own the CRT pipeline teardown/rebuild.
 */
export function setDisplayMode(mode: DisplayMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage unavailable — the mode still applies for this session.
  }
  applyDisplayModeClass(mode);
  document.dispatchEvent(
    new CustomEvent<DisplayMode>(DISPLAY_MODE_EVENT, { detail: mode })
  );
}