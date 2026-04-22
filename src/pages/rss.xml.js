import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const items = await Promise.all(posts.map(async (post) => {
    const { Content } = await render(post);
    const coverAbs = post.data.coverImage
      ? new URL(post.data.coverImage, context.site).toString()
      : null;
    return {
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
      content: post.body,
      customData: coverAbs
        ? `<coverImage>${coverAbs.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</coverImage>`
        : '',
    };
  }));

  return rss({
    title: "Jordan Krueger's Mission Control",
    description: 'Thoughts on technology, nonprofit operations, AI, and building in public.',
    site: context.site,
    items,
  });
}
