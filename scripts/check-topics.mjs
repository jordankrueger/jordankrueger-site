// Fails if a post uses a tag that is not in TOPICS (src/lib/topics.ts).
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../src/content/posts/', import.meta.url);
const known = new Set(
  [...readFileSync(new URL('../src/lib/topics.ts', import.meta.url), 'utf8').matchAll(/^\s*'([a-z-]+)':/gm)].map(m => m[1]),
);
let bad = 0;
for (const f of readdirSync(dir).filter(f => f.endsWith('.mdx'))) {
  const line = readFileSync(new URL(f, dir), 'utf8').split('\n').find(l => l.startsWith('tags:')) ?? 'tags: []';
  for (const tag of JSON.parse(line.slice(5))) {
    if (!known.has(tag)) { console.error(`${f}: unknown tag "${tag}"`); bad = 1; }
  }
}
process.exit(bad);
