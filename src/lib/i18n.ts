// Locale model + pure state helpers for the bilingual ES/EN toggle.
//
// Everything in this module is pure and browser-agnostic: `localStorage` and
// `document` are reached only through the injectable `LocaleStorage` boundary
// (see `browserLocaleStorage`), so these functions are unit-testable in a
// plain Node environment without any DOM or Astro runtime.

export type Locale = 'es' | 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'];

/** Rendered when no saved preference exists (spec: "First visit" scenario). */
export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_STORAGE_KEY = 'locale';

/**
 * Minimal subset of the Web Storage interface. Anything with these two methods
 * (e.g. `window.localStorage`, or a test double) satisfies the contract, which
 * keeps the real browser storage behind an injectable boundary.
 */
export interface LocaleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Type guard narrowing an unknown value to a supported `Locale`. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Returns the opposite locale of the two supported values. */
export function toggleLocale(current: Locale): Locale {
  return current === 'es' ? 'en' : 'es';
}

/**
 * Resolves the active locale: the persisted value when valid, otherwise the
 * default. A missing/absent storage is treated as a first visit.
 */
export function resolveLocale(storage: LocaleStorage | null | undefined): Locale {
  const stored = storage?.getItem(LOCALE_STORAGE_KEY) ?? null;
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

/** Persists the active locale; a no-op when no storage is available. */
export function persistLocale(storage: LocaleStorage | null | undefined, locale: Locale): void {
  storage?.setItem(LOCALE_STORAGE_KEY, locale);
}

/**
 * The only place that touches the real `window.localStorage`. Returns `null`
 * outside a browser so callers can pass the result straight into
 * `resolveLocale` / `persistLocale`.
 */
export function browserLocaleStorage(): LocaleStorage | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return null;
}
