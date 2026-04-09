import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const releases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/releases' }),
  schema: z.object({
    version: z.string(),
    date: z.string(),
    breaking: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    author: z.string().default('Paperclip'),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    youtubeId: z.string().optional(),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    competitor: z.string(),
    title: z.string(),
    excerpt: z.string(),
    date: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { releases, blog, comparisons };
