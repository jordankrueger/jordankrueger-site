// Tip jar link guard. Called from SupportLinks.astro at build time, so a placeholder
// or a link to the wrong site fails `astro build` instead of reaching production.
export function checkTipUrl(url) {
  if (url === '') return url; // empty = no tip box
  let u;
  try { u = new URL(url); } catch { throw new Error(`SupportLinks: "${url}" is not a URL`); }
  if (u.protocol !== 'https:' || u.hostname !== 'ko-fi.com' || u.pathname.length < 2) {
    throw new Error(`SupportLinks: "${url}" is not an https link to a profile on ko-fi.com`);
  }
  return url;
}
