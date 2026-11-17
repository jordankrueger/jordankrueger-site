#!/usr/bin/env node
// List posts scheduled for the future:      npm run scheduled
// For the hourly GitHub Action:             node scripts/scheduled-posts.mjs --due-within 130
//   prints due=true if a non-draft post went live in the last 130 minutes, else due=false.
// Exits 1 if any post's pubDate cannot be read, so a typo fails loudly instead of hiding a post.
import { readdirSync } from 'node:fs';
import { goLiveTime, readFrontmatter } from '../src/lib/schedule.mjs';

const DIR = 'src/content/posts';
const now = Date.now();
const posts = readdirSync(DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => {
    const fm = readFrontmatter(`${DIR}/${f}`);
    if (!fm.pubDate) throw new Error(`${f}: no pubDate`);
    return { file: f, draft: fm.draft, at: goLiveTime(fm.pubDate).getTime() };
  });

const i = process.argv.indexOf('--due-within');
if (i !== -1) {
  const minutes = Number(process.argv[i + 1]);
  if (!(minutes > 0)) throw new Error('--due-within needs a number of minutes');
  const due = posts.some((p) => !p.draft && p.at <= now && p.at > now - minutes * 60_000);
  console.log(`due=${due}`);
} else {
  const upcoming = posts.filter((p) => p.at > now).sort((a, b) => a.at - b.at);
  if (!upcoming.length) console.log('No scheduled posts.');
  for (const p of upcoming) {
    const when = new Date(p.at).toLocaleString('en-US', {
      timeZone: 'America/New_York', weekday: 'short',
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    console.log(`${when} ET  ${p.file}${p.draft ? '  (draft: will NOT publish until draft: false)' : ''}`);
  }
}
