// Machine-readable copy of /daemon. Edit src/content/daemon.json, not this file.
import { getDaemon } from '../lib/daemon.mjs';

export async function GET(context) {
  const d = await getDaemon(context.site);
  const body = {
    name: 'Jordan Krueger',
    url: new URL('/daemon', context.site).toString(),
    feed: new URL('/feed.json', context.site).toString(),
    note: '"now" and "requesting" are short-lived: they were last checked on "asOf".',
    ...d,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
