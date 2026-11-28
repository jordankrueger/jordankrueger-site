// Self-check for src/lib/support.mjs: node scripts/check-support-links.mjs
import assert from 'node:assert/strict';
import { checkTipUrl } from '../src/lib/support.mjs';

assert.equal(checkTipUrl('https://ko-fi.com/jordankrueger'), 'https://ko-fi.com/jordankrueger');
assert.equal(checkTipUrl(''), '');                                      // empty hides the box
assert.throws(() => checkTipUrl('https://example.invalid/YOUR-KOFI-PAGE')); // the old placeholder
assert.throws(() => checkTipUrl('http://ko-fi.com/jordankrueger'));      // not https
assert.throws(() => checkTipUrl('https://ko-fi.com.evil.example/x'));    // lookalike host
assert.throws(() => checkTipUrl('https://ko-fi.com/'));                  // no profile
assert.throws(() => checkTipUrl('ko-fi.com/jordankrueger'));             // not a URL
console.log('support link checks passed');
