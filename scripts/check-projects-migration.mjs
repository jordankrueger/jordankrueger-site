// One-time check: every entry and field from the old Projects and AI pages
// (read from the pinned commit) exists unchanged in src/content/projects.json.
// Prints a difference count; exit 1 on any difference.
import { readFileSync } from 'node:fs';
import { oldPages, BASE_SHA } from './lib/old-pages.mjs';

const json = JSON.parse(readFileSync(new URL('../src/content/projects.json', import.meta.url), 'utf8'));
const { projects, advocacyProjects, communityProjects, personalProjects } = oldPages();
const diffs = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const find = (title) => {
  const hits = json.filter((e) => e.title === title);
  if (hits.length !== 1) diffs.push(`${title}: found ${hits.length} entries, expected 1`);
  return hits[0];
};
const compare = (entry, field, oldValue) => {
  if (!same(entry[field], oldValue)) diffs.push(`${entry.title}: field "${field}" differs from ${BASE_SHA}`);
};

const aiTitleMap = { 'highspeedrail.tv': 'HighSpeedRail.TV' };
const seen = new Set();

for (const p of projects) {
  const e = find(p.title);
  if (!e) continue;
  seen.add(e);
  compare(e, 'body', p.description);
  for (const k of ['image', 'href', 'linkLabel', 'secondaryLinks']) compare(e, k, p[k]);
  const area = p.title === 'StarBase 118 PBEM RPG' ? 'starbase' : p.title === 'AI Progress Tracker' ? 'personal' : 'movement';
  compare(e, 'areas', [area]);
}

const groups = [['movement', advocacyProjects], ['starbase', communityProjects], ['personal', personalProjects]];
let aiCount = 0;
for (const [group, list] of groups) {
  for (const a of list) {
    aiCount++;
    const e = find(aiTitleMap[a.title] ?? a.title);
    if (!e) continue;
    seen.add(e);
    compare(e, 'aiDescription', a.description);
    for (const k of ['tags', 'status', 'statusType']) compare(e, k, a[k]);
    compare(e, 'builtWithAI', true);
    compare(e, 'aiGroup', group);
    if (!projects.some((p) => p.title === e.title)) compare(e, 'areas', [group]);
  }
}

// (b) the three entries on both pages are single entries carrying both sets.
for (const t of ['AI Progress Tracker', 'Progressives for AI', 'HighSpeedRail.TV']) {
  const e = find(t);
  if (e && !(e.body && e.aiDescription && e.tags && e.status && e.statusType)) diffs.push(`${t}: merged entry is missing a field set`);
}

// (c) featured members per column, exactly the spec's three.
const featured = {
  movement: ["Job Seeker's Union", 'Equity Language Commons', 'Freehold'],
  starbase: ['StarBase 118 PBEM RPG', 'Staff Operations Platform', '438K-Post Archive'],
  personal: ['Drift', 'AI Progress Tracker', 'Lease Tracker'],
  ai: ['AK Help', 'AI Code Review Pipeline', 'Claude Code guardrails'],
};
for (const [col, titles] of Object.entries(featured)) {
  const got = json.filter((e) => e.featuredIn.includes(col)).map((e) => e.title).sort();
  if (!same(got, [...titles].sort())) diffs.push(`featured "${col}": got ${JSON.stringify(got)}`);
}
const guard = find('Claude Code guardrails');
if (guard && guard.builtWithAI) diffs.push('Claude Code guardrails must not be builtWithAI');

// (d) every builtWithAI entry has its AI fields; nothing extra beyond the old pages.
for (const e of json.filter((x) => x.builtWithAI)) {
  for (const k of ['aiDescription', 'tags', 'status', 'statusType', 'aiGroup']) {
    if (e[k] === undefined) diffs.push(`${e.title}: builtWithAI but no ${k}`);
  }
}
for (const e of json) if (!seen.has(e)) diffs.push(`${e.title}: not on either old page`);
if (json.filter((e) => e.builtWithAI).length !== aiCount) diffs.push('builtWithAI count differs from the old AI page');

for (const d of diffs) console.log(`DIFF ${d}`);
console.log(`${diffs.length} differences`);
process.exit(diffs.length ? 1 : 0);
