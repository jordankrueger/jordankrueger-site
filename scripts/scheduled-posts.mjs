#!/usr/bin/env node
// List posts scheduled for the future:   npm run scheduled
// For the hourly GitHub Action:          node scripts/scheduled-posts.mjs --check-live
//   prints due=true if a post went live in the last 3 days but its page still
//   404s on jordankrueger.com (so a missed or failed run heals on the next one),
//   else due=false. Any other HTTP answer fails the run, so a problem shows up red.
// Exits 1 if any post's pubDate cannot be read, so a typo fails loudly instead of hiding a post.
import { readdirSync } from 'node:fs';
import { slug as githubSlug } from 'github-slugger'; // the slugger Astro's glob loader uses for post ids
import { goLiveTime, readFrontmatter } from '../src/lib/schedule.mjs';

const DIR = 'src/content/posts';
const SITE = 'https://jordankrueger.com';
const LOOKBACK = 3 * 86_400_000;
const now = Date.now();

const posts = readdirSync(DIR, { recursive: true })
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => {
    const fm = readFrontmatter(`${DIR}/${f}`);
    if (!fm.pubDate) throw new Error(`${f}: no pubDate`);
    const id = fm.slug ? String(fm.slug)
      : f.replace(/\.mdx?$/, '').split('/').map((s) => githubSlug(s)).join('/').replace(/\/index$/, '');
    return { file: f, id, draft: fm.draft, at: goLiveTime(fm.pubDate).getTime() };
  });

if (process.argv.includes('--check-live')) {
  let due = false;
  for (const p of posts.filter((p) => !p.draft && p.at <= now && p.at > now - LOOKBACK)) {
    const url = `${SITE}/blog/${p.id}/`;
    const res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': 'jordankrueger-site scheduled-publish' } });
    console.error(`${res.status} ${url}`);
    if (res.status === 404) due = true;
    else if (!res.ok) throw new Error(`Unexpected ${res.status} from ${url}`);
  }
  console.log(`due=${due}`);
} else {
  const upcoming = posts.filter((p) => p.at > now).sort((a, b) => a.at - b.at);
  if (!upcoming.length) console.log('No scheduled posts.');
  for (const p of upcoming) {
    const when = new Date(p.at).toLocaleString('en-US', {
      timeZone: 'America/New_York', weekday: 'short',
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    console.log(`${when} ET  /blog/${p.id}/${p.draft ? '  (draft: will NOT publish until draft: false)' : ''}`);
  }
}
