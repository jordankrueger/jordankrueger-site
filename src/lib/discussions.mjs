// "Discussed on" bars: thread URLs and build-time counts. Shared by BlogPost.astro,
// src/pages/discussions.json.js and functions/api/reddit-thread.js (keep it dependency-free).

// Canonical thread URL: https://www.reddit.com/r/<sub>/comments/<id>/<optional-slug>/
const REDDIT_RE = /^https:\/\/(?:www\.|old\.)?reddit\.com\/r\/([A-Za-z0-9_]+)\/comments\/([a-z0-9]{4,12})(?:\/|$)/;

export const REDDIT_UA = 'web:jordankrueger.com-discussion-counts:v1 (+https://jordankrueger.com)';

export function parseReddit(url) {
  const m = REDDIT_RE.exec(url || '');
  return m ? { sub: m[1], id: m[2], url: `https://www.reddit.com/r/${m[1]}/comments/${m[2]}/` } : null;
}

export const hnUrl = id => `https://news.ycombinator.com/item?id=${id}`;

// Reddit's listing JSON: [post listing, comments listing]
export function redditCounts(json) {
  const d = json?.[0]?.data?.children?.[0]?.data;
  return d && Number.isFinite(d.score) ? { points: d.score, comments: d.num_comments ?? 0 } : null;
}

async function getJson(url, headers) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// Build-time fallback values; null means "no count", and the bar shows the buttons only.
export async function fetchDiscussionCounts({ hackerNews, reddit } = {}) {
  const r = parseReddit(reddit);
  const [hn, rd] = await Promise.all([
    hackerNews ? getJson(`https://hacker-news.firebaseio.com/v0/item/${hackerNews}.json`) : null,
    r ? getJson(`https://www.reddit.com/comments/${r.id}.json?limit=1&depth=1`, { 'User-Agent': REDDIT_UA }) : null,
  ]);
  return {
    hackerNews: hn && Number.isFinite(hn.score) ? { points: hn.score, comments: hn.descendants ?? 0 } : null,
    reddit: redditCounts(rd),
  };
}
