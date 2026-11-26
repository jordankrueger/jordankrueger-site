// Shared by /daemon and /daemon.json: the profile data plus the newest visible post.
import { getCollection, getEntry } from 'astro:content';
import { isVisible } from './schedule.mjs';

export async function getDaemon(site) {
  if (!site) throw new Error('getDaemon needs `site` (set in astro.config.mjs) to build absolute URLs');
  const entry = await getEntry('daemon', 'jordan');
  if (!entry) throw new Error('src/content/daemon.json has no "jordan" entry');
  const [post] = (await getCollection('posts', isVisible))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  const latestPost = post && {
    title: post.data.title,
    url: new URL(`/blog/${post.id}/`, site).toString(),
    date: post.data.pubDate.toISOString().slice(0, 10),
  };
  return { ...entry.data, latestPost };
}
