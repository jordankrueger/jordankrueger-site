import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { TOPICS } from './lib/topics';
import { AREAS, type AreaKey } from './lib/project-areas';

// Posts may only use the six blog topics; the build fails on anything else.
const topic = z.enum(Object.keys(TOPICS) as [string, ...string[]]);

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    tags: z.array(topic).default([]),
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

const areaKeys = Object.keys(AREAS) as [AreaKey, ...AreaKey[]];
const area = z.enum(areaKeys);

// One entry per project. The build rejects a missing or mistyped field.
const projects = defineCollection({
  loader: file('./src/content/projects.json'),
  schema: z.object({
    title: z.string(),
    areas: z.array(area).min(1),
    builtWithAI: z.boolean().default(false),
    aiGroup: area.optional(),
    featuredIn: z.array(z.enum([...areaKeys, 'ai'])).default([]),
    short: z.string().optional(),
    body: z.string().optional(),
    image: z.string().optional(),
    href: z.string().optional(),
    linkLabel: z.string().optional(),
    secondaryLinks: z.array(z.object({ href: z.string(), label: z.string() })).optional(),
    aiDescription: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.string().optional(),
    statusType: z.enum(['live', 'deployed', 'active', 'complete']).optional(),
  }).superRefine((e, ctx) => {
    if (e.featuredIn.length && !e.short) ctx.addIssue({ code: 'custom', path: ['short'], message: 'short is required when featuredIn is set' });
    if (e.builtWithAI) {
      for (const k of ['aiGroup', 'aiDescription', 'tags', 'status', 'statusType'] as const) {
        if (e[k] === undefined) ctx.addIssue({ code: 'custom', path: [k], message: `${k} is required when builtWithAI` });
      }
    }
    if (!e.body && !e.aiDescription) ctx.addIssue({ code: 'custom', path: ['body'], message: 'needs body or aiDescription' });
  }),
});

export const collections = { posts, tools, projects };
