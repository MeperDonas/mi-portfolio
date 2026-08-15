import { describe, expect, it } from 'vitest';
import {
  aboutSchema,
  certificationsSchema,
  experienceSchema,
  projectsSchema,
  siteSchema,
} from '../src/content/schemas';

describe('content schemas', () => {
  it('accepts a valid experience entry with an end date', () => {
    const result = experienceSchema.safeParse({
      role: 'Frontend Developer',
      company: 'Acme Corp',
      start: '2020-01',
      end: '2022-06',
      tags: ['React', 'TypeScript'],
    });

    expect(result.success).toBe(true);
  });

  it('accepts an experience entry with no end date (current role)', () => {
    const result = experienceSchema.safeParse({
      role: 'Frontend Developer',
      company: 'Acme Corp',
      start: '2023-01',
      tags: ['React'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an experience entry missing the required role', () => {
    const result = experienceSchema.safeParse({
      company: 'Acme Corp',
      start: '2020-01',
      tags: [],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an experience entry with a non-string tag', () => {
    const result = experienceSchema.safeParse({
      role: 'Frontend Developer',
      company: 'Acme Corp',
      start: '2020-01',
      tags: ['React', 42],
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid project entry with a URL', () => {
    const result = projectsSchema.safeParse({
      title: 'Portfolio',
      description: 'Personal site',
      stack: ['Astro', 'Tailwind'],
      url: 'https://example.com',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a project entry with an invalid URL', () => {
    const result = projectsSchema.safeParse({
      title: 'Portfolio',
      description: 'Personal site',
      stack: ['Astro'],
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid site entry with contact links and nav labels', () => {
    const result = siteSchema.safeParse({
      name: 'Jane Doe',
      role: 'Frontend Developer',
      email: 'jane@example.com',
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      nav: {
        about: 'About',
        experience: 'Experience',
        projects: 'Projects',
        certifications: 'Certifications',
        contact: 'Contact',
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a site entry with an invalid email', () => {
    const result = siteSchema.safeParse({
      name: 'Jane Doe',
      role: 'Frontend Developer',
      email: 'not-an-email',
      linkedin: 'https://linkedin.com/in/jane',
      github: 'https://github.com/jane',
      nav: {
        about: 'About',
        experience: 'Experience',
        projects: 'Projects',
        certifications: 'Certifications',
        contact: 'Contact',
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid about entry', () => {
    const result = aboutSchema.safeParse({
      title: 'About',
      lead: 'Hi, I build things for the web.',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid certification entry', () => {
    const result = certificationsSchema.safeParse({
      title: 'AWS Certified Developer',
      issuer: 'Amazon',
      date: '2023-05',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a certification entry missing the issuer', () => {
    const result = certificationsSchema.safeParse({
      title: 'AWS Certified Developer',
      date: '2023-05',
    });

    expect(result.success).toBe(false);
  });
});
