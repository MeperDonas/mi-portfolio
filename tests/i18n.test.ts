import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isLocale,
  persistLocale,
  resolveLocale,
  toggleLocale,
  type LocaleStorage,
} from '../src/lib/i18n';
import { filterByLocale } from '../src/lib/content';

function createMemoryStorage(initial?: Record<string, string>): LocaleStorage {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('i18n locale utilities', () => {
  describe('default locale', () => {
    it('defines es as the default locale within the supported set', () => {
      expect(DEFAULT_LOCALE).toBe('es');
      expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
    });

    it('returns the default locale when no storage is provided', () => {
      expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    });

    it('returns the default locale when storage has no saved value', () => {
      expect(resolveLocale(createMemoryStorage())).toBe(DEFAULT_LOCALE);
    });

    it('falls back to the default locale when the saved value is invalid', () => {
      const storage = createMemoryStorage({ [LOCALE_STORAGE_KEY]: 'fr' });
      expect(resolveLocale(storage)).toBe(DEFAULT_LOCALE);
    });
  });

  describe('persisted locale', () => {
    it('restores a previously saved locale', () => {
      const storage = createMemoryStorage({ [LOCALE_STORAGE_KEY]: 'en' });
      expect(resolveLocale(storage)).toBe('en');
    });
  });

  describe('toggleLocale', () => {
    it('toggles from es to en', () => {
      expect(toggleLocale('es')).toBe('en');
    });

    it('toggles from en to es', () => {
      expect(toggleLocale('en')).toBe('es');
    });
  });

  describe('persistLocale', () => {
    it('writes the selected locale to storage under the storage key', () => {
      const storage = createMemoryStorage();
      persistLocale(storage, 'en');
      expect(storage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    });

    it('is a no-op when storage is absent', () => {
      expect(() => persistLocale(null, 'en')).not.toThrow();
    });
  });

  describe('isLocale', () => {
    it('accepts both supported locales', () => {
      expect(isLocale('es')).toBe(true);
      expect(isLocale('en')).toBe(true);
    });

    it('rejects unsupported strings and non-strings', () => {
      expect(isLocale('fr')).toBe(false);
      expect(isLocale(42)).toBe(false);
      expect(isLocale(undefined)).toBe(false);
    });
  });
});

describe('filterByLocale', () => {
  const entries = [
    { id: 'es/intro' },
    { id: 'es/frontend-developer' },
    { id: 'en/intro' },
    { id: 'en/frontend-developer' },
  ];

  it('keeps only entries whose first id segment matches the locale', () => {
    const result = filterByLocale(entries, 'es');
    expect(result).toEqual([{ id: 'es/intro' }, { id: 'es/frontend-developer' }]);
  });

  it('returns an empty array when no entry matches the locale', () => {
    const result = filterByLocale(entries, 'fr');
    expect(result).toEqual([]);
  });
});
