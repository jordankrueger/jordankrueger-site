// Scheduled posts: a post whose pubDate is in the future stays out of every
// production build until that time passes. Shared by the Astro pages and by
// scripts/scheduled-posts.mjs (the hourly GitHub Action and `npm run scheduled`).
//
// Astro's YAML parser turns `2026-12-01 09:00` into 09:00 UTC, so the frontmatter
// is re-read here with timestamps left as text: a date or time written without a
// timezone means New York time. One with `Z` or an offset (`-05:00`) is taken as written.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

const TZ = 'America/New_York';
const DAY = 86_400_000;

// Offset of New York from UTC (ms) at instant t.
function nyOffset(t) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(t)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(t / 1000) * 1000;
}

/** Instant a raw pubDate string goes live. Throws on text it cannot read. */
export function goLiveTime(raw) {
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:(?:T|\s+)(\d{1,2}):(\d{2})(?::(\d{2})(\.\d+)?)?)?\s*(Z|([+-])(\d{1,2}):?(\d{2})?)?$/i);
  if (!m) throw new Error(`Unreadable pubDate: ${s}`);
  const ms = Math.round(Number(m[7] ?? 0) * 1000);
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0), ms);
  const w = new Date(wall); // rejects 2026-02-30, 25:00 and the like
  if (w.getUTCMonth() + 1 !== +m[2] || w.getUTCDate() !== +m[3] || w.getUTCHours() !== +(m[4] ?? 0)) {
    throw new Error(`Unreadable pubDate: ${s}`);
  }
  let t;
  if (m[8]) {
    const zone = m[9] ? `${m[9]}${m[10].padStart(2, '0')}:${m[11] ?? '00'}` : 'Z';
    t = Date.parse(new Date(wall).toISOString().replace('Z', zone));
  } else {
    // Try the offsets in force a day either side; keep the first that maps back to the
    // written wall clock. In the spring-forward gap neither does, so take the later one.
    const tries = [wall - nyOffset(wall - DAY), wall - nyOffset(wall + DAY)].sort((a, b) => a - b);
    t = tries.find((c) => c + nyOffset(c) === wall) ?? tries[1];
  }
  if (!Number.isFinite(t)) throw new Error(`Unreadable pubDate: ${s}`);
  return new Date(t);
}

/** Frontmatter of a post file, with timestamps kept as text (CORE_SCHEMA has none). */
export function readFrontmatter(filePath) {
  const text = readFileSync(resolve(filePath), 'utf8').replace(/^\uFEFF?\s*/, ''); // BOM or blank lines before ---
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  const data = fm ? yaml.load(fm, { schema: yaml.CORE_SCHEMA }) ?? {} : {};
  return { pubDate: data.pubDate, draft: data.draft === true, slug: data.slug };
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
