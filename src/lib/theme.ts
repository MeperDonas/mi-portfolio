// Theme model + pure state helpers for the light/dark toggle.
//
// Mirrors `i18n.ts`: everything here is pure and browser-agnostic — `localStorage`
// is reached only through the injectable `ThemeStorage` boundary (see
// `browserThemeStorage`), and the system colour preference is passed in as a
// boolean, so these functions stay unit-testable in a plain Node environment.

export type Theme = 'light' | 'dark';

export const SUPPORTED_THEMES: readonly Theme[] = ['light', 'dark'];

/** Rendered when no saved preference exists and the system prefers light. */
export const DEFAULT_THEME: Theme = 'light';

export const THEME_STORAGE_KEY = 'theme';

/**
 * Minimal subset of the Web Storage interface (same contract as `LocaleStorage`).
 */
export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Type guard narrowing an unknown value to a supported `Theme`. */
export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (SUPPORTED_THEMES as readonly string[]).includes(value);
}

/** Returns the opposite theme of the two supported values. */
export function toggleTheme(current: Theme): Theme {
  return current === 'light' ? 'dark' : 'light';
}

/**
 * Resolves the active theme: the persisted value when valid, otherwise the
 * system preference (`prefersDark`), otherwise the default.
 */
export function resolveTheme(
  storage: ThemeStorage | null | undefined,
  prefersDark = false,
): Theme {
  const stored = storage?.getItem(THEME_STORAGE_KEY) ?? null;
  if (isTheme(stored)) return stored;
  return prefersDark ? 'dark' : 'light';
}

/** Persists the active theme; a no-op when no storage is available. */
export function persistTheme(storage: ThemeStorage | null | undefined, theme: Theme): void {
  storage?.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * The only place that touches the real `window.localStorage`. Returns `null`
 * outside a browser so callers can pass the result straight into
 * `resolveTheme` / `persistTheme`.
 */
export function browserThemeStorage(): ThemeStorage | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return null;
}
