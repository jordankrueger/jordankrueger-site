// Self-check for functions/api/postcards.js validation. Run: node scripts/check-postcards-fn.mjs
import assert from 'node:assert/strict';
import { validate } from '../functions/api/postcards.js';

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
console.log('postcards validation: ok');
