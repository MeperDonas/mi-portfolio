import { z } from 'astro/zod';

// Raw Zod schemas for Astro content collections, extracted from config.ts so
// unit tests can import them without touching the `astro:content` module
// (which has no meaning outside the Astro runtime).

/** Shared shape for an optional external URL (used by projects + certifications). */
const optionalUrl = z.string().url().optional();

export const aboutSchema = z.object({
  title: z.string(),
  lead: z.string(),
});

export const experienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  start: z.string(),
  end: z.string().optional(),
  tags: z.array(z.string()),
});

export const projectsSchema = z.object({
  title: z.string(),
  description: z.string(),
  stack: z.array(z.string()),
  url: optionalUrl,
});

export const certificationsSchema = z.object({
  title: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: optionalUrl,
});

export const siteSchema = z.object({
  name: z.string(),
  role: z.string(),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  nav: z.object({
    about: z.string(),
    experience: z.string(),
    projects: z.string(),
    certifications: z.string(),
    contact: z.string(),
  }),
});
