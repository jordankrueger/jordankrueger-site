// POST /api/postcards — stores a "Postcard from 2076" for Jordan to read. Never shown publicly.
// Binding: POSTCARDS_DB (D1 jordankrueger-postcards). Secrets: TURNSTILE_SECRET_KEY (same widget as the site's forms),
// RESEND_API_KEY (same Resend account and sender domain as workers/contact-form) for the "new postcard" email.
// No IP or other request data is stored; only the submitted fields.

const LIMITS = { name: 40, from: 32, where: 140, tuesday: 140, built: 140 };
const SCENES = ['garden', 'river', 'night'];
const NOTIFY_TO = 'jordan@jordankrueger.com';
const NOTIFY_FROM = 'Postcards via jordankrueger.com <contact@jordankrueger.com>';
const READ_CMD = 'CLOUDFLARE_ACCOUNT_ID=f00242a6a1d94ee54ad9a5792e722252 CLOUDFLARE_API_TOKEN="$PERSONAL_CLOUDFLARE_API_TOKEN" npx wrangler d1 execute jordankrueger-postcards --remote --command "SELECT * FROM postcards ORDER BY created_at DESC"';

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

// Plain text only. Every field is untrusted: drop control characters, and for the
// subject also line breaks (header injection).
const oneLine = v => String(v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
const bodyText = v => String(v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();

export function buildEmail(v, createdAt) {
  const name = oneLine(v.name) || 'Someone';
  const from = oneLine(v.from);
  const et = new Date(createdAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
  return {
    subject: `New postcard from 2076: ${name}${from ? ', ' + from : ''}`.slice(0, 200),
    text: [
      `Name: ${bodyText(v.name) || '(blank)'}`,
      `Writing from: ${bodyText(v.from) || '(blank)'}`,
      '',
      'Where are you right now?', bodyText(v.where) || '(blank)', '',
      "What's your Tuesday like?", bodyText(v.tuesday) || '(blank)', '',
      'What did you help build to get here?', bodyText(v.built) || '(blank)', '',
      `Picture: ${v.scene}`,
      `Sent: ${et} ET (${createdAt})`,
      '',
      'Read all postcards:',
      READ_CMD,
    ].join('\n'),
  };
}

async function notify(env, value, createdAt) {
  if (!env.RESEND_API_KEY) { console.error('Postcard email skipped: RESEND_API_KEY not set'); return; }
  try {
    const { subject, text } = buildEmail(value, createdAt);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: NOTIFY_FROM, to: [NOTIFY_TO], subject, text }),
      signal: AbortSignal.timeout(10000),
    });
    const out = await res.text();
    if (!res.ok) console.error('Postcard email failed', res.status, out.slice(0, 300));
    else console.log('Postcard email sent', out.slice(0, 120));
  } catch (err) {
    console.error('Postcard email error', err);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Send the postcard as JSON.' }, 400); }

  const { error, value } = validate(body);
  if (error) return json({ ok: false, error }, 400);

  if (!(await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY))) {
    return json({ ok: false, error: "We couldn't confirm you're human. Refresh the page and try again." }, 403);
  }

  const createdAt = new Date().toISOString();
  try {
    await env.POSTCARDS_DB.prepare(
      `INSERT INTO postcards (id, created_at, name, from_place, where_text, tuesday, built, scene, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(crypto.randomUUID(), createdAt, value.name, value.from, value.where, value.tuesday, value.built, value.scene).run();
  } catch (err) {
    console.error('Postcard insert failed', err);
    return json({ ok: false, error: "The postcard didn't go through. Please try again in a minute." }, 500);
  }
  // Email only after the row is saved; a failed email never fails the submission.
  context.waitUntil(notify(env, value, createdAt));
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'Use POST.' }, 405);
