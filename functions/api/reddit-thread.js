// GET /api/reddit-thread?id=<thread id> -> { points, comments } for the "Discussed on" bar.
// Only serves threads listed in /discussions.json (built from post frontmatter), so it is not an open proxy.
// Answers (including "unavailable") are cached at the edge for 10 minutes.
import { REDDIT_UA, redditCounts } from '../../src/lib/discussions.mjs';

const TTL = 600;

const json = (body, status, maxAge = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${maxAge}` },
  });

export async function onRequestGet({ request, env, waitUntil }) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-z0-9]{4,12}$/.test(id)) return json({ error: 'bad id' }, 400);

  let allowed = [];
  try {
    const listRes = await env.ASSETS.fetch(new URL('/discussions.json', request.url));
    if (listRes.ok) allowed = (await listRes.json()).reddit || [];
  } catch (err) {
    console.error('reddit-thread: allowlist unreadable', err);
  }
  if (!allowed.includes(id)) return json({ error: 'unknown thread' }, 404);

  const cache = caches.default;
  const key = new Request(new URL(`/api/reddit-thread?id=${id}`, request.url));
  const hit = await cache.match(key);
  if (hit) return hit;

  let counts = null;
  try {
    const res = await fetch(`https://www.reddit.com/comments/${id}.json?limit=1&depth=1`, {
      headers: { 'User-Agent': REDDIT_UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) counts = redditCounts(await res.json());
    else console.error('reddit-thread: upstream status', res.status);
  } catch (err) {
    console.error('reddit-thread: fetch failed', err);
  }
  // Failures are cached too, so a Reddit block is not retried on every page view.
  const out = counts ? json(counts, 200, TTL) : json({ error: 'unavailable' }, 502, TTL);
  waitUntil(cache.put(key, out.clone()));
  return out;
}
