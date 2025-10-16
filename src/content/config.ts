import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lang: z.enum(['en', 'fi', 'sv', 'fr', 'no']),
    translations: z.record(z.string()).optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    date: z.date(),
    client: z.string(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    lang: z.enum(['en', 'fi', 'sv', 'fr', 'no']),
    translations: z.record(z.string()).optional(),
  }),
});

export const collections = {
  'articles': articles,
  'projects': projects,
};