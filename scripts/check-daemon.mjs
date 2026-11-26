// Self-check for /daemon, /daemon.json and /feed.json. Run after `npm run build`:
//   node scripts/check-daemon.mjs            (reads dist/)
//   node scripts/check-daemon.mjs <base-url> (checks a preview or the live site)
// Exit 1 on any failure.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const base = process.argv[2]?.replace(/\/$/, '');
const get = async (path) => base
  ? (await fetch(base + path)).text()
  : readFileSync(new URL(`../dist${path}`, import.meta.url), 'utf8');

const [page, dataText, feedText] = await Promise.all([
  get(base ? '/daemon/' : '/daemon/index.html'), get('/daemon.json'), get('/feed.json'),
]);
const data = JSON.parse(dataText);
const feed = JSON.parse(feedText);

const SECTIONS = ['Now', 'Mission', 'Goals', 'Predictions', 'Projects', 'Offering', 'Requesting', 'Resume', 'Preferences', 'Signal'];
for (const s of SECTIONS) assert.match(page, new RegExp(`</span> ${s}`), `page is missing section ${s}`);

// The zod schema already guarantees the other fields; latestPost is computed.
assert.ok(data.latestPost, 'daemon.json is missing latestPost');
// Every goal, prediction and project in the data shows on the page.
for (const g of data.goals) assert.ok(page.includes(g.code), `page is missing goal ${g.code}`);
for (const p of data.predictions) assert.ok(page.includes(p.confidence), `page is missing confidence for ${p.code}`);
for (const p of data.projects) assert.ok(page.includes(p.url), `page is missing project link ${p.url}`);

assert.equal(feed.version, 'https://jsonfeed.org/version/1.1');
assert.ok(feed.items.length > 0, 'feed.json has no items');
for (const i of feed.items) assert.ok(i.id && i.url && i.title && i.date_published, `feed item incomplete: ${i.id}`);
const dates = feed.items.map((i) => i.date_published);
assert.deepEqual(dates, [...dates].sort().reverse(), 'feed.json is not newest first');
assert.equal(data.latestPost.url, feed.items[0].url, 'latestPost is not the newest feed item');
assert.ok(page.includes(data.latestPost.url), 'page does not link the latest post');

// Privacy guard: the only email address in the profile is the public one.
const emails = new Set(JSON.stringify(data).match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []);
assert.deepEqual([...emails], ['jordan@jordankrueger.com'], `unexpected email in daemon.json: ${[...emails]}`);

console.log(`ok: ${SECTIONS.length} sections, ${feed.items.length} feed items, latest "${data.latestPost.title}"`);
