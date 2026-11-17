// Self-check for src/lib/schedule.mjs: node scripts/check-schedule.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { goLiveTime, readFrontmatter } from '../src/lib/schedule.mjs';

const t = (raw) => goLiveTime(raw).toISOString();
assert.equal(t('2026-12-01'), '2026-12-01T05:00:00.000Z');              // date only = midnight ET (EST)
assert.equal(t('2026-07-04'), '2026-07-04T04:00:00.000Z');              // EDT
assert.equal(t('2026-12-01 09:30'), '2026-12-01T14:30:00.000Z');        // no zone = ET
assert.equal(t('2026-12-01T09:30:15'), '2026-12-01T14:30:15.000Z');
assert.equal(t('2026-11-05T17:01:00Z'), '2026-11-05T17:01:00.000Z');    // explicit Z kept
assert.equal(t('2026-12-01T09:00:00-08:00'), '2026-12-01T17:00:00.000Z'); // explicit offset kept
assert.equal(t('2026-03-08 03:30'), '2026-03-08T07:30:00.000Z');        // spring-forward day
assert.equal(t('2026-11-01 12:00'), '2026-11-01T17:00:00.000Z');        // fall-back day, after change
assert.throws(() => goLiveTime('next tuesday'));
console.log('schedule checks passed');
// Added after the Codex review
assert.equal(t('2026-12-01 09:00:00 -05:00'), '2026-12-01T14:00:00.000Z'); // space before offset
assert.equal(t('2026-12-01T9:00:00Z'), '2026-12-01T09:00:00.000Z');        // one-digit hour
assert.equal(t('2026-12-01T09:00:00+0530'), '2026-12-01T03:30:00.000Z');
assert.equal(t('2026-03-08 02:30'), '2026-03-08T07:30:00.000Z');           // spring-forward gap -> 3:30 EDT
assert.equal(t('2026-11-01 01:30'), '2026-11-01T05:30:00.000Z');           // fall-back repeat -> first 1:30
assert.equal(t('2099-12-01T09:00:00.999'), '2099-12-01T14:00:00.999Z');    // fractions kept
assert.throws(() => goLiveTime('2026-02-30'));
assert.throws(() => goLiveTime('2026-12-01 25:00'));

// Frontmatter reading: quotes, comments, CRLF, and a fake pubDate inside a multiline string.
const dir = mkdtempSync(join(tmpdir(), 'sched-'));
const fm = (body) => { const f = join(dir, 'p.mdx'); writeFileSync(f, body); return readFrontmatter(f); };
assert.equal(fm('---\npubDate: "2026-12-01T09:30"\n---\nx').pubDate, '2026-12-01T09:30');
assert.equal(fm('---\npubDate: 2026-12-01 # scheduled\ndraft: true\n---\n').pubDate, '2026-12-01');
assert.equal(fm('---\r\npubDate: 2026-12-01\r\ndraft: true\r\n---\r\n').draft, true);
assert.equal(fm('---\ndescription: "Example:\npubDate: 2020-01-01\nend"\npubDate: 2099-12-01\n---\n').pubDate, '2099-12-01');
console.log('review checks passed');
