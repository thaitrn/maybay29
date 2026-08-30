import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyLift, createPlane, stepPlane, PLAYER_H } from '../src/game/physics.ts';
import { addEvent, comboMult, derivedScore, emptyStats } from '../src/game/scoring.ts';
import { auditSeeds, buildTimeline, validateTimeline } from '../src/game/director.ts';
import { applyRun } from '../src/game/progress.ts';
import { durationMsFromWall, roundOver, splitDt } from '../src/systems/clock.ts';
import { startWatchdog, watchdogVerdict } from '../src/systems/watchdog.ts';

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

test('low-FPS physics dt is clamped but wall clock is not', () => {
  const slow = splitDt(200); // 5 FPS frame
  assert.equal(slow.phys, 1 / 30);
  assert.ok(Math.abs(slow.wall - 0.2) < 1e-9);
  let wall = 0;
  let phys = 0;
  for (let i = 0; i < 300; i++) {
    const d = splitDt(200);
    wall += d.wall;
    phys += d.phys;
  }
  assert.ok(wall >= 59.9 && wall <= 60.1, `wall=${wall}`);
  assert.ok(phys < 20, `phys must not drive the 60s timer, phys=${phys}`);
  assert.equal(roundOver(60, 3), true);
  assert.equal(roundOver(59.9, 3), false);
  assert.equal(durationMsFromWall(60.4), 60_000);
});

test('watchdog ignores low FPS while frames advance; reloads only on frozen RAF', () => {
  assert.equal(watchdogVerdict(1, -1, 3), 'sample');
  assert.equal(watchdogVerdict(12, 11, 4), 'ok');
  assert.equal(watchdogVerdict(12, 12, 60), 'frozen');

  if (typeof globalThis.document === 'undefined') {
    globalThis.document = { visibilityState: 'visible' };
  }
  const vis = Object.getOwnPropertyDescriptor(globalThis.document, 'visibilityState');
  Object.defineProperty(globalThis.document, 'visibilityState', { configurable: true, get: () => 'visible' });

  let ticks = [];
  const game = {
    scene: { isActive: () => true, getScenes: () => [{ scene: { key: 'Game' } }] },
    input: { keyboard: { resetKeys() {} } },
    loop: { frame: 1, actualFps: 4, running: true, sleep() {}, resume() {} },
  };
  let reloads = 0;
  const handle = startWatchdog(game, {
    setIntervalFn: (fn) => { ticks.push(fn); return 1; },
    clearIntervalFn: () => {},
    reloadFn: () => { reloads += 1; },
    warnFn: () => {},
  });
  ticks[0]();
  game.loop.frame = 2;
  ticks[0]();
  game.loop.frame = 3;
  ticks[0]();
  assert.equal(reloads, 0, 'low fps + advancing frames must not reload');
  ticks[0]();
  ticks[0]();
  assert.equal(reloads, 1, 'two consecutive frozen samples reload');
  handle.stop();
  if (vis) Object.defineProperty(document, 'visibilityState', vis);
});

test('unlock thresholds', () => {
  const r = applyRun({ best_score: 0, total_stars: 99, selected_skin: 'default', unlocked_skins: ['default'] }, 10, 2);
  assert.ok(r.unlocked.includes('sen-vang'));
  assert.equal(r.meta.total_stars, 101);
});
