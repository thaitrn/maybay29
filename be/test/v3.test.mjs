// Test v3 contract: dùng node:test + fetch vào server thật chạy port test
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 8399;
const BASE = `http://127.0.0.1:${PORT}`;
const dbDir = mkdtempSync(join(tmpdir(), 'mb29-test-'));
const child = spawn('node', ['src/server.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT), DB_PATH: join(dbDir, 'test.db') },
  stdio: 'ignore',
});
await new Promise((res, rej) => {
  const t = setTimeout(rej, 5000, new Error('server not up'));
  const poll = async () => {
    try { const r = await fetch(`${BASE}/healthz`); if (r.ok) { clearTimeout(t); res(); } else setTimeout(poll, 100); }
    catch { setTimeout(poll, 100); }
  };
  poll();
});

const UUID = () => crypto.randomUUID();
const j = async (method, path, body) => {
  const r = await fetch(`${BASE}${path}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
};

test('healthz', async () => {
  const { status, body } = await j('GET', '/healthz');
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.ok(body.db);
});

const p1 = UUID(), p2 = UUID();

test('POST /v3/players 201 create, 200 update, name validation', async () => {
  let r = await j('POST', '/v3/players', { player_id: p1, display_name: 'Phi công 2/9' });
  assert.equal(r.status, 201);
  r = await j('POST', '/v3/players', { player_id: p1, display_name: 'Đổi tên' });
  assert.equal(r.status, 200);
  r = await j('POST', '/v3/players', { player_id: UUID(), display_name: 'x'.repeat(25) });
  assert.equal(r.status, 400);
  r = await j('POST', '/v3/players', { player_id: 'not-uuid' });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'INVALID_PLAYER_ID');
});

test('POST /v3/runs validates player, returns TTL', async () => {
  let r = await j('POST', '/v3/runs', { player_id: UUID() });
  assert.equal(r.status, 404);
  assert.equal(r.body.error.code, 'PLAYER_NOT_FOUND');
  r = await j('POST', '/v3/runs', { player_id: p1, client_version: 'test' });
  assert.equal(r.status, 201);
  assert.ok(r.body.run_id);
  assert.equal(r.body.config_version, 'mb29-v3');
  assert.ok(Date.parse(r.body.expires_at) - Date.parse(r.body.started_at) === 120000);
});

async function finishOk(playerId, statsOverride = {}, reason = 'timer') {
  const run = (await j('POST', '/v3/runs', { player_id: playerId })).body;
  const st = { stars: 20, enemies: 4, gates: 8, near_misses: 3, base_points: 20 * 10 + 4 * 20 + 8 * 15 + 3 * 5, combo_bonus: 100, max_combo: 22, ...statsOverride };
  const score = st.base_points + st.combo_bonus;
  const dur = reason === 'timer' ? 4000 : 1000; // <= server elapsed + 5s cho run mới tạo
  return { run, res: await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: playerId, duration_ms: dur, score, finish_reason: reason, stats: st }), payload: { player_id: playerId, duration_ms: dur, score, finish_reason: reason, stats: st } };
}

test('finish happy path: 201, idempotent retry 200 same body, 409 different payload', async () => {
  const { run, res, payload } = await finishOk(p1);
  assert.equal(res.status, 201);
  assert.equal(res.body.accepted, true);
  assert.equal(res.body.personal_best, true);
  assert.equal(res.body.rank, 1);
  // retry cùng payload
  const retry = await j('POST', `/v3/runs/${run.run_id}/finish`, payload);
  assert.equal(retry.status, 200);
  assert.deepEqual(retry.body, res.body);
  // payload khác (vẫn hợp lệ về derived score)
  const st2 = { stars: 21, enemies: 4, gates: 8, near_misses: 3, base_points: 425, combo_bonus: 100, max_combo: 22 };
  const diff = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 4000, score: 525, finish_reason: 'timer', stats: st2 });
  assert.equal(diff.status, 409);
  assert.equal(diff.body.error.code, 'RUN_ALREADY_FINISHED');
});

test('finish validation: owner, stats, derived score, duration', async () => {
  const run = (await j('POST', '/v3/runs', { player_id: p1 })).body;
  // sai owner
  await j('POST', '/v3/players', { player_id: p2, display_name: 'P2' });
  let r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p2, duration_ms: 60000, score: 1, finish_reason: 'timer', stats: {} });
  assert.equal(r.status, 403);
  // base_points sai (duration hợp lệ trước để tới check score)
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 3000, score: 999, finish_reason: 'timer', stats: { stars: 10, enemies: 0, gates: 0, near_misses: 0, base_points: 50, combo_bonus: 0, max_combo: 1 } });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'INVALID_SCORE');
  // score != base+combo
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 3000, score: 500, finish_reason: 'timer', stats: { stars: 10, enemies: 0, gates: 0, near_misses: 0, base_points: 100, combo_bonus: 0, max_combo: 1 } });
  assert.equal(r.status, 400);
  // combo_bonus > base*3
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 3000, score: 500, finish_reason: 'timer', stats: { stars: 10, enemies: 0, gates: 0, near_misses: 0, base_points: 100, combo_bonus: 301, max_combo: 1 } });
  assert.equal(r.status, 400);
  // duration ngoài range
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 500, score: 100, finish_reason: 'timer', stats: { stars: 10, enemies: 0, gates: 0, near_misses: 0, base_points: 100, combo_bonus: 0, max_combo: 1 } });
  assert.equal(r.body.error.code, 'INVALID_DURATION');
  // duration vượt server elapsed + 5s (run mới tạo, elapsed ~0)
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 30000, score: 100, finish_reason: 'timer', stats: { stars: 10, enemies: 0, gates: 0, near_misses: 0, base_points: 100, combo_bonus: 0, max_combo: 1 } });
  assert.equal(r.body.error.code, 'INVALID_DURATION');
  // finish_reason không hợp lệ
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 1000, score: 100, finish_reason: 'cheat', stats: { stars: 10, enemies: 0, gates: 0, near_misses: 0, base_points: 100, combo_bonus: 0, max_combo: 1 } });
  assert.equal(r.body.error.code, 'INVALID_STATS');
  // stats quá limit
  r = await j('POST', `/v3/runs/${run.run_id}/finish`, { player_id: p1, duration_ms: 3000, score: 810, finish_reason: 'timer', stats: { stars: 81, enemies: 0, gates: 0, near_misses: 0, base_points: 810, combo_bonus: 0, max_combo: 1 } });
  assert.equal(r.body.error.code, 'INVALID_STATS');
  // run not found
  r = await j('POST', `/v3/runs/${UUID()}/finish`, { player_id: p1, duration_ms: 60000, score: 100, finish_reason: 'timer', stats: {} });
  assert.equal(r.body.error.code, 'RUN_NOT_FOUND');
});

test('leaderboard: personal best per player, abandon excluded, ordering', async () => {
  // p1 score 415+100=515 (đã có từ test trước); p2 score cao hơn
  const { res: r2 } = await finishOk(p2, { stars: 40, enemies: 8, gates: 16, near_misses: 6, base_points: 40 * 10 + 8 * 20 + 16 * 15 + 6 * 5, combo_bonus: 200, max_combo: 30 });
  assert.equal(r2.status, 201);
  assert.equal(r2.body.personal_best, true);
  assert.equal(r2.body.rank, 1);
  // p2 chạy lại score thấp hơn -> không personal best
  const { res: r3 } = await finishOk(p2, { stars: 1, enemies: 0, gates: 0, near_misses: 0, base_points: 10, combo_bonus: 0, max_combo: 1 });
  assert.equal(r3.body.personal_best, false);
  // abandon không lên leaderboard
  const before = (await j('GET', '/v3/leaderboard')).body.leaderboard.length;
  await finishOk(UUID.call(null) && p2, { stars: 2, enemies: 0, gates: 0, near_misses: 0, base_points: 20, combo_bonus: 0, max_combo: 1 }, 'abandon');
  const after = (await j('GET', '/v3/leaderboard')).body.leaderboard.length;
  assert.equal(after, before);
  // thứ tự đúng: p2 (890) trước p1 (515)
  const lb = await j('GET', '/v3/leaderboard?limit=10');
  assert.equal(lb.status, 200);
  assert.equal(lb.body.config_version, 'mb29-v3');
  assert.ok(lb.body.leaderboard.length >= 2);
  assert.ok(lb.body.leaderboard[0].score >= lb.body.leaderboard[1].score);
  assert.equal(lb.body.leaderboard[0].rank, 1);
  assert.ok(lb.body.leaderboard[0].achieved_at);
  // limit validation
  const lim = await j('GET', '/v3/leaderboard?limit=0');
  assert.equal(lim.status, 200); // clamp về 1..50
});

test('v2 endpoints vẫn hoạt động (backward compat)', async () => {
  const r = await j('POST', '/v2/players', { player_id: p1, display_name: 'P1' });
  assert.equal(r.status, 201);
});

process.on('exit', () => child.kill('SIGKILL'));
child.on('exit', () => process.exit(0));
setTimeout(() => { child.kill(); }, 1000).unref();
