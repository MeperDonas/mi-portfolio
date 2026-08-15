import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  SUPPORTED_THEMES,
  THEME_STORAGE_KEY,
  isTheme,
  persistTheme,
  resolveTheme,
  toggleTheme,
  type ThemeStorage,
} from '../src/lib/theme';

function createMemoryStorage(initial?: Record<string, string>): ThemeStorage {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('theme utilities', () => {
  describe('default theme', () => {
    it('defines light as the default theme within the supported set', () => {
      expect(DEFAULT_THEME).toBe('light');
      expect(SUPPORTED_THEMES).toContain(DEFAULT_THEME);
    });

    it('returns the default theme when no storage is provided', () => {
      expect(resolveTheme(null)).toBe(DEFAULT_THEME);
    });

    it('returns the default theme when storage has no saved value', () => {
      expect(resolveTheme(createMemoryStorage())).toBe(DEFAULT_THEME);
    });

    it('falls back to the default theme when the saved value is invalid', () => {
      const storage = createMemoryStorage({ [THEME_STORAGE_KEY]: 'blue' });
      expect(resolveTheme(storage)).toBe(DEFAULT_THEME);
    });

    it('prefers dark when the system prefers dark and nothing is saved', () => {
      expect(resolveTheme(null, true)).toBe('dark');
    });
  });

  describe('persisted theme', () => {
    it('restores a previously saved theme', () => {
      const storage = createMemoryStorage({ [THEME_STORAGE_KEY]: 'dark' });
      expect(resolveTheme(storage)).toBe('dark');
    });

    it('favours the saved theme over the system preference', () => {
      const storage = createMemoryStorage({ [THEME_STORAGE_KEY]: 'light' });
      expect(resolveTheme(storage, true)).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      expect(toggleTheme('light')).toBe('dark');
    });

    it('toggles from dark to light', () => {
      expect(toggleTheme('dark')).toBe('light');
    });
  });

  describe('persistTheme', () => {
    it('writes the selected theme under the storage key', () => {
      const storage = createMemoryStorage();
      persistTheme(storage, 'dark');
      expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('is a no-op when storage is absent', () => {
      expect(() => persistTheme(null, 'dark')).not.toThrow();
    });
  });

  describe('isTheme', () => {
    it('accepts both supported themes', () => {
      expect(isTheme('light')).toBe(true);
      expect(isTheme('dark')).toBe(true);
    });

    it('rejects unsupported strings and non-strings', () => {
      expect(isTheme('blue')).toBe(false);
      expect(isTheme(42)).toBe(false);
      expect(isTheme(undefined)).toBe(false);
    });
  });
});
