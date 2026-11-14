// POST /api/postcards — stores a "Postcard from 2076" for Jordan to read. Never shown publicly.
// Binding: POSTCARDS_DB (D1 jordankrueger-postcards). Secret: TURNSTILE_SECRET_KEY (same widget as the site's forms).
// No IP or other request data is stored; only the submitted fields.

const LIMITS = { name: 40, from: 32, where: 140, tuesday: 140, built: 140 };
const SCENES = ['garden', 'river', 'night'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const allowedHost = h =>
  h === 'jordankrueger.com' || h === 'www.jordankrueger.com' ||
  h === 'jordankrueger-site.pages.dev' || h.endsWith('.jordankrueger-site.pages.dev');

async function verifyTurnstile(token, secret) {
  if (!token || !secret) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const r = await res.json();
    return Boolean(r.success && allowedHost(r.hostname || '') && r.action === 'postcard');
  } catch (err) {
    console.error('Turnstile validation failed', err);
    return false;
  }
}

export function validate(body) {
  if (!body || typeof body !== 'object') return { error: 'Send the postcard as JSON.' };
  if (body.website) return { error: 'Something went wrong. Please try again.' }; // honeypot
  const out = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const v = body[key] == null ? '' : body[key];
    if (typeof v !== 'string') return { error: `"${key}" must be text.` };
    out[key] = v.trim();
    if (out[key].length > max) return { error: `"${key}" is too long (max ${max} characters).` };
  }
  if (!out.where && !out.tuesday && !out.built) return { error: 'Write at least one line on your postcard first.' };
  if (!SCENES.includes(body.scene)) return { error: 'Pick a picture for the front.' };
  out.scene = body.scene;
  return { value: out };
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Send the postcard as JSON.' }, 400); }

  const { error, value } = validate(body);
  if (error) return json({ ok: false, error }, 400);

  if (!(await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY))) {
    return json({ ok: false, error: "We couldn't confirm you're human. Refresh the page and try again." }, 403);
  }

  try {
    await env.POSTCARDS_DB.prepare(
      `INSERT INTO postcards (id, created_at, name, from_place, where_text, tuesday, built, scene, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(crypto.randomUUID(), new Date().toISOString(), value.name, value.from, value.where, value.tuesday, value.built, value.scene).run();
  } catch (err) {
    console.error('Postcard insert failed', err);
    return json({ ok: false, error: "The postcard didn't go through. Please try again in a minute." }, 500);
  }
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'Use POST.' }, 405);
