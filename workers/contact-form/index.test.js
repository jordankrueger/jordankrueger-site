import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './index.js';

const env = {
  ALLOWED_ORIGIN: 'https://jordankrueger.com',
  TURNSTILE_SECRET_KEY: 'turnstile_test',
  RESEND_API_KEY: 'resend_test',
  FROM_EMAIL: 'contact@jordankrueger.com',
  TO_EMAIL: 'jordan@jordankrueger.com',
};

function request(fields) {
  return new Request('https://contact.example.com', {
    method: 'POST',
    headers: { Origin: env.ALLOWED_ORIGIN },
    body: new URLSearchParams({
      name: 'Jordan',
      email: 'jordan@example.com',
      message: 'Hello',
      'cf-turnstile-response': 'valid-token',
      ...fields,
    }),
  });
}

test('rejects a missing Turnstile token without calling an upstream service', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return Response.json({ success: true }); };

  const response = await worker.fetch(request({ 'cf-turnstile-response': '' }), env);

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test('rejects a token Cloudflare identifies as automated', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ success: false, 'error-codes': ['invalid-input-response'] });
  };

  const response = await worker.fetch(request({}), env);

  assert.equal(response.status, 400);
  assert.equal(calls, 1);
});

test('accepts a valid Jordan token before sending through Resend', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    if (String(url).includes('/siteverify')) {
      return Response.json({
        success: true,
        hostname: 'jordankrueger.com',
        action: 'contact',
      });
    }
    return Response.json({ id: 'email_test' });
  };

  const response = await worker.fetch(request({}), env);

  assert.equal(response.status, 200);
  assert.deepEqual(urls, [
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    'https://api.resend.com/emails',
  ]);
});
