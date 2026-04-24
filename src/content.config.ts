import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/tools" }),
  schema: z.object({
    category: z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      color: z.enum(['bg-warm', 'bg-blue', 'bg-peach', 'bg-green']),
      github_mirror: z.string().url().optional(),
      order: z.number().int(),
    }),
    entries: z.array(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      url: z.string().url(),
      attribution: z.enum(['jordan', 'campaignhelp', 'external']),
      free: z.boolean().default(true),
      license: z.string().optional(),
      status: z.enum(['live', 'coming-soon']).default('live'),
      tags: z.array(z.string()).optional(),
    })),
  }),
});

export const collections = { posts, tools };
