import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  aboutSchema,
  experienceSchema,
  projectsSchema,
  certificationsSchema,
  siteSchema,
} from './content/schemas';

const about = defineCollection({
  loader: glob({ base: './content/about', pattern: '**/*.md' }),
  schema: aboutSchema,
});
const experience = defineCollection({
  loader: glob({ base: './content/experience', pattern: '**/*.md' }),
  schema: experienceSchema,
});
const projects = defineCollection({
  loader: glob({ base: './content/projects', pattern: '**/*.md' }),
  schema: projectsSchema,
});
const certifications = defineCollection({
  loader: glob({ base: './content/certifications', pattern: '**/*.md' }),
  schema: certificationsSchema,
});
const site = defineCollection({
  loader: glob({ base: './content/site', pattern: '**/*.md' }),
  schema: siteSchema,
});

export const collections = { about, experience, projects, certifications, site };
