// The six blog topics (decided 2026-10-25). Slugs are what posts store in `tags:`.
// `claude-code` must stay: /building redirects to /blog?tag=claude-code.
// src/content.config.ts rejects any post tag not listed here, so the build fails on a typo.
export const TOPICS: Record<string, string> = {
  'ai': 'AI',
  'claude-code': 'Building with Claude Code',
  'self-hosting': 'Self-hosting',
  'nonprofit-tech': 'Nonprofit tech',
  'security': 'Security & privacy',
  'open-web': 'Open web',
};
export const topicLabel = (slug: string) => TOPICS[slug] ?? slug;
