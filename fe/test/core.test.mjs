import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyLift, createPlane, stepPlane, PLAYER_H } from '../src/game/physics.ts';
import { addEvent, comboMult, derivedScore, emptyStats } from '../src/game/scoring.ts';
import { auditSeeds, buildTimeline, validateTimeline } from '../src/game/director.ts';
import { applyRun } from '../src/game/progress.ts';

test('one lift impulse changes vy once', () => {
  const p = createPlane();
  const a = applyLift(p);
  const b = applyLift(p);
  assert.equal(a.vy, b.vy);
});

test('physics dt-independent-ish over 1s', () => {
  let a = createPlane();
  for (let i = 0; i < 60; i++) a = stepPlane(a, 1 / 60);
  let b = createPlane();
  for (let i = 0; i < 30; i++) b = stepPlane(b, 1 / 30);
  assert.ok(Math.abs(a.y - b.y) < 8);
});

test('combo tiers and auto-miss does not appear in scoring helper', () => {
  assert.equal(comboMult(0), 1);
  assert.equal(comboMult(5), 2);
  assert.equal(comboMult(10), 3);
  assert.equal(comboMult(20), 4);
  let st = emptyStats();
  let streak = 0;
  const r = addEvent(st, 'star', streak);
  assert.equal(r.stats.stars, 1);
  assert.equal(r.gained, 10);
});

test('derived score formula', () => {
  assert.equal(derivedScore({ stars: 2, enemies: 1, gates: 1, near_misses: 1 }), 20 + 20 + 15 + 5);
});

test('timeline has all archetypes and safe gaps', () => {
  const t = buildTimeline(7);
  const v = validateTimeline(t);
  assert.equal(v.ok, true, v.reasons.join(','));
  assert.ok(PLAYER_H * 1.6 < 80);
});

test('100 seeded runs', () => {
  const a = auditSeeds(100);
  assert.equal(a.ok, true, `failed ${a.failed.join(',')}`);
});

test('unlock thresholds', () => {
  const r = applyRun({ best_score: 0, total_stars: 99, selected_skin: 'default', unlocked_skins: ['default'] }, 10, 2);
  assert.ok(r.unlocked.includes('sen-vang'));
  assert.equal(r.meta.total_stars, 101);
});
