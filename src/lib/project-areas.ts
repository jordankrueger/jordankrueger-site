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
