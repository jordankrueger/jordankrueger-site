// Allowlist for functions/api/reddit-thread.js: only threads named in a visible post's
// `discussions.reddit` frontmatter can be fetched through it.
import { getCollection } from 'astro:content';
import { isVisible } from '../lib/schedule.mjs';
import { parseReddit } from '../lib/discussions.mjs';

export async function GET() {
  const posts = await getCollection('posts', isVisible);
  const reddit = posts.map(p => parseReddit(p.data.discussions?.reddit)?.id).filter(Boolean);
  return new Response(JSON.stringify({ reddit: [...new Set(reddit)] }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
