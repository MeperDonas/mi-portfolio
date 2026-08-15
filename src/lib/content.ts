// Typed, locale-aware content access layer.
//
// `filterByLocale` is a pure helper with no Astro dependency, so it is
// unit-testable in isolation. The `getX(locale)` helpers are the Astro-coupled
// side: they import `getCollection` lazily (dynamic import) so this module can
// be loaded by vitest's Node environment without resolving the `astro:content`
// virtual module. The `getCollection` calls themselves are exercised only by
// the Astro runtime (PR 3 pages), not by unit tests.

import type { CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

/**
 * Keeps only entries whose id's first path segment matches `locale`. Entries
 * from the locale-scoped glob loaders have ids like `es/intro` or
 * `en/frontend-developer`, so splitting on `/` isolates the locale segment.
 */
export function filterByLocale<T extends { id: string }>(entries: T[], locale: string): T[] {
  return entries.filter((entry) => entry.id.split('/')[0] === locale);
}

/** The names of every content collection this site reads from. */
type ContentCollection = 'about' | 'experience' | 'projects' | 'certifications' | 'site';

/**
 * Shared loader: resolves a collection through the Astro runtime and keeps
 * only the entries for `locale`. All `getX(locale)` helpers are thin wrappers
 * over this one generic, so the filter/import logic lives in a single place.
 */
async function getByLocale<C extends ContentCollection>(
  collection: C,
  locale: Locale,
): Promise<CollectionEntry<C>[]> {
  const { getCollection } = await import('astro:content');
  return filterByLocale(await getCollection(collection), locale);
}

export const getAbout = (locale: Locale) => getByLocale('about', locale);

export const getExperience = (locale: Locale) => getByLocale('experience', locale);

export const getProjects = (locale: Locale) => getByLocale('projects', locale);

export const getCertifications = (locale: Locale) => getByLocale('certifications', locale);

export const getSite = (locale: Locale) => getByLocale('site', locale);
