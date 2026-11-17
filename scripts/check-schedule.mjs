// Self-check for src/lib/schedule.mjs: node scripts/check-schedule.mjs
import assert from 'node:assert/strict';
import { goLiveTime } from '../src/lib/schedule.mjs';

const t = (raw) => goLiveTime(raw).toISOString();
assert.equal(t('2026-12-01'), '2026-12-01T05:00:00.000Z');              // date only = midnight ET (EST)
assert.equal(t('2026-07-04'), '2026-07-04T04:00:00.000Z');              // EDT
assert.equal(t('2026-12-01 09:30'), '2026-12-01T14:30:00.000Z');        // no zone = ET
assert.equal(t('2026-12-01T09:30:15'), '2026-12-01T14:30:15.000Z');
assert.equal(t('"2026-12-01T09:30"'), '2026-12-01T14:30:00.000Z');      // quoted
assert.equal(t('2026-11-05T17:01:00Z'), '2026-11-05T17:01:00.000Z');    // explicit Z kept
assert.equal(t('2026-12-01T09:00:00-08:00'), '2026-12-01T17:00:00.000Z'); // explicit offset kept
assert.equal(t('2026-03-08 03:30'), '2026-03-08T07:30:00.000Z');        // spring-forward day
assert.equal(t('2026-11-01 12:00'), '2026-11-01T17:00:00.000Z');        // fall-back day, after change
assert.throws(() => goLiveTime('next tuesday'));
console.log('schedule checks passed');
