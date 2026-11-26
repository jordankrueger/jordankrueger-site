// JSON Feed 1.1 (https://jsonfeed.org/version/1.1) of visible posts; same filter as rss.xml.js.
import { getCollection } from 'astro:content';
import { isVisible } from '../lib/schedule.mjs';

export async function GET(context) {
  if (!context.site) throw new Error('/feed.json needs `site` (set in astro.config.mjs) to build absolute URLs');
  const posts = (await getCollection('posts', isVisible))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const abs = (p) => new URL(p, context.site).toString();
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: "Jordan Krueger's Mission Control",
    home_page_url: abs('/'),
    feed_url: abs('/feed.json'),
    description: 'Thoughts on technology, nonprofit operations, AI, and building in public.',
    authors: [{ name: 'Jordan Krueger', url: abs('/daemon') }],
    language: 'en-US',
    items: posts.map((post) => ({
      id: abs(`/blog/${post.id}/`),
      url: abs(`/blog/${post.id}/`),
      title: post.data.title,
      summary: post.data.description,
      date_published: post.data.pubDate.toISOString(),
      ...(post.data.updatedDate && { date_modified: post.data.updatedDate.toISOString() }),
      ...(post.data.coverImage && { image: abs(post.data.coverImage) }),
      tags: post.data.tags,
    })),
  };
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
