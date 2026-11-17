// Scheduled posts: a post whose pubDate is in the future stays out of every
// production build until that time passes. Shared by the Astro pages and by
// scripts/scheduled-posts.mjs (the hourly GitHub Action and `npm run scheduled`).
//
// The YAML parser turns `2026-12-01 09:00` into 09:00 UTC, so the raw text is
// read from the file instead: a date or time written without a timezone means
// New York time. One with `Z` or an offset (`-05:00`) is taken as written.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TZ = 'America/New_York';

// Offset of New York from UTC (ms) at instant t.
function nyOffset(t) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(t)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
}

/** Instant a raw pubDate string goes live. Throws on text it cannot read. */
export function goLiveTime(raw) {
  const s = String(raw).trim().replace(/^["']|["']$/g, '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i);
  if (!m) throw new Error(`Unreadable pubDate: ${s}`);
  if (m[7]) return new Date(s.replace(' ', 'T'));
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  const first = wall - nyOffset(wall);
  return new Date(wall - nyOffset(first)); // second pass settles DST changeover days
}

/** Raw pubDate text and draft flag from a post file's frontmatter. */
export function readFrontmatter(filePath) {
  const fm = readFileSync(resolve(filePath), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  return {
    pubDate: fm.match(/^pubDate:\s*(.+?)\s*$/m)?.[1],
    draft: /^draft:\s*true\s*$/m.test(fm),
  };
}

/** Go-live instant for an Astro posts-collection entry. */
export function postGoLive(post) {
  return goLiveTime(readFrontmatter(post.filePath).pubDate);
}

/** Filter for getCollection('posts'): drafts never, scheduled posts only in dev. */
export function isVisible({ data, filePath }, now = new Date()) {
  if (data.draft) return false;
  return Boolean(import.meta.env?.DEV) || postGoLive({ filePath }) <= now;
}

/** "Scheduled for ..." label when the post is still in the future, else null. */
export function scheduledLabel(post, now = new Date()) {
  const t = postGoLive(post);
  if (t <= now) return null;
  return 'Scheduled for ' + t.toLocaleString('en-US', {
    timeZone: TZ, dateStyle: 'medium', timeStyle: 'short',
  }) + ' ET';
}
