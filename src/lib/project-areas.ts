import { getCollection } from 'astro:content';
import fileOrder from '../content/projects.json';

// The three project areas that have their own page.
export const AREAS = {
  movement: {
    path: '/projects/movement',
    heading: 'Movement work',
    intro: 'Projects for progressive organizing and the people doing it.',
    all: 'See all movement work',
  },
  starbase: {
    path: '/projects/starbase-118',
    heading: 'StarBase 118',
    intro: 'The Star Trek community I founded in 1994, and what runs it.',
    all: 'See all StarBase 118',
  },
  personal: {
    path: '/projects/personal',
    heading: 'Personal tools',
    intro: 'Small tools I built to run my own life a little better.',
    all: 'See all personal tools',
  },
} as const;

export type AreaKey = keyof typeof AREAS;

// Order of the three featured entries in each hub column.
export const FEATURED_ORDER = {
  movement: ["Job Seeker's Union", 'Equity Language Commons', 'Freehold'],
  starbase: ['StarBase 118 PBEM RPG', 'Staff Operations Platform', '438K-Post Archive'],
  personal: ['Drift', 'AI Progress Tracker', 'Lease Tracker'],
  ai: ['AK Help', 'AI Code Review Pipeline', 'Claude Code guardrails'],
} as const;

// getCollection does not keep file order; the order of projects.json is the page order.
const rank = new Map(fileOrder.map((e, i) => [e.id, i]));
type ProjectData = Awaited<ReturnType<typeof getCollection<'projects'>>>[number]['data'];

// The file loader keys entries by `id`, so a missing or repeated id silently drops an
// entry. Fail the build instead.
const ids = fileOrder.map(e => e.id);
if (ids.some(id => !id) || new Set(ids).size !== ids.length) {
  throw new Error('src/content/projects.json: every entry needs a unique, non-empty id');
}

export async function getProjects(keep: (data: ProjectData) => boolean = () => true) {
  const entries = await getCollection('projects');
  if (entries.length !== fileOrder.length) {
    throw new Error(`projects collection loaded ${entries.length} of ${fileOrder.length} entries in projects.json`);
  }
  return entries
    .filter(e => keep(e.data))
    .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)
    .map(e => e.data);
}
