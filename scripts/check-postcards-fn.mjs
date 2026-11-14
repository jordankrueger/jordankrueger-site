// Self-check for functions/api/postcards.js validation. Run: node scripts/check-postcards-fn.mjs
import assert from 'node:assert/strict';
import { validate, buildEmail } from '../functions/api/postcards.js';

const ok = { name: 'A', from: 'B', where: 'here', tuesday: '', built: '', scene: 'garden' };
assert.deepEqual(validate(ok).value, { name: 'A', from: 'B', where: 'here', tuesday: '', built: '', scene: 'garden' });
assert.ok(validate({ ...ok, website: 'spam' }).error, 'honeypot');
assert.ok(validate({ ...ok, name: 'x'.repeat(41) }).error, 'name 40');
assert.ok(!validate({ ...ok, name: 'x'.repeat(40) }).error, 'name 40 ok');
assert.ok(validate({ ...ok, from: 'x'.repeat(33) }).error, 'from 32');
assert.ok(validate({ ...ok, built: 'x'.repeat(141) }).error, 'prompt 140');
assert.ok(validate({ ...ok, where: '  ' }).error, 'needs one prompt');
assert.ok(validate({ ...ok, scene: 'beach' }).error, 'scene');
assert.ok(validate({ ...ok, name: 5 }).error, 'non-string');
const mail = buildEmail({ name: 'Eve\r\nBcc: x@evil.test', from: 'Here\nThere', where: 'line1\nline2\u0007', tuesday: '', built: '', scene: 'night' }, '2026-11-14T22:00:00.000Z');
assert.ok(!/[\r\n]/.test(mail.subject), 'subject has no line breaks');
assert.equal(mail.subject, 'New postcard from 2076: Eve Bcc: x@evil.test, Here There');
assert.ok(mail.text.includes('line1\nline2') && !mail.text.includes('\u0007'), 'body keeps newlines, drops control chars');
assert.ok(mail.text.includes('Picture: night') && mail.text.includes('wrangler d1 execute jordankrueger-postcards'));
assert.equal(buildEmail({ name: '', from: '', where: 'x', tuesday: '', built: '', scene: 'garden' }, '2026-11-14T22:00:00.000Z').subject, 'New postcard from 2076: Someone');
console.log('postcards validation: ok');
