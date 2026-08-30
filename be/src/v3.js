// v3 leaderboard contract — PRD docs/prd-maybay29-rebuild-v3.md mục 8
import { createHash, randomUUID } from 'node:crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONFIG_VERSION = 'mb29-v3';
const RUN_TTL_MS = 120_000; // run hết hạn 120s server time
const LIMITS = { stars: 80, enemies: 40, gates: 40, near_misses: 40, max_combo: 200 };
const SCORE_MAX = 10_000;

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

// In-memory rate limit theo IP (casual level, đủ cho contract)
const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  b.count += 1;
  return b.count <= max;
}

export function v3Routes(fastify, { db, bad }) {
  // POST /v3/players — idempotent upsert; 201 lần đầu, 200 khi update
  fastify.post('/v3/players', async (req, reply) => {
    const ip = req.ip;
    if (!rateLimit(`players:${ip}`, 30, 60_000)) return bad(reply, 429, 'RATE_LIMITED', 'Quá nhiều request');
    const { player_id, display_name } = req.body ?? {};
    if (!UUID_RE.test(player_id ?? '')) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    let name = typeof display_name === 'string' ? display_name : '';
    // không nhận HTML/control chars
    name = name.replace(/[\u0000-\u001f\u007f]/g, '').trim();
    if ([...name].length < 1 || [...name].length > 24) return bad(reply, 400, 'INVALID_NAME', 'display_name 1-24 ký tự');
    const existing = db.prepare('SELECT id FROM player WHERE id = ?').get(player_id);
    db.prepare(`INSERT INTO player (id, display_name) VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, updated_at = datetime('now')`).run(player_id, name);
    return reply.status(existing ? 200 : 201).send({ player_id, display_name: name });
  });

  // POST /v3/runs — tạo run
  fastify.post('/v3/runs', async (req, reply) => {
    const { player_id, client_version } = req.body ?? {};
    if (!rateLimit(`runs:${req.ip}:${player_id ?? ''}`, 30, 60_000)) return bad(reply, 429, 'RATE_LIMITED', 'Quá nhiều request');
    if (!UUID_RE.test(player_id ?? '')) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    if (!db.prepare('SELECT id FROM player WHERE id = ?').get(player_id)) {
      return bad(reply, 404, 'PLAYER_NOT_FOUND', 'Register /v3/players trước');
    }
    const runId = randomUUID();
    const now = Date.now();
    const startedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + RUN_TTL_MS).toISOString();
    db.prepare('INSERT INTO run (id, player_id, client_version, config_version, started_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(runId, player_id, typeof client_version === 'string' ? client_version.slice(0, 64) : null, CONFIG_VERSION, startedAt, expiresAt);
    return reply.status(201).send({ run_id: runId, started_at: startedAt, expires_at: expiresAt, config_version: CONFIG_VERSION });
  });

  // POST /v3/runs/:run_id/finish — idempotent, validate derived score
  fastify.post('/v3/runs/:run_id/finish', async (req, reply) => {
    const b = req.body ?? {};
    const { run_id } = req.params;
    if (!rateLimit(`finish:${req.ip}:${b.player_id ?? ''}`, 30, 60_000)) return bad(reply, 429, 'RATE_LIMITED', 'Quá nhiều request');
    if (!UUID_RE.test(b.player_id ?? '')) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    const run = db.prepare('SELECT * FROM run WHERE id = ?').get(run_id);
    if (!run) return bad(reply, 404, 'RUN_NOT_FOUND', 'Run không tồn tại');
    if (run.player_id !== b.player_id) return bad(reply, 403, 'RUN_NOT_FOUND', 'Run không thuộc player này');
    if (Date.now() > Date.parse(run.expires_at)) return bad(reply, 410, 'RUN_EXPIRED', 'Run đã quá 120 giây');

    const dur = b.duration_ms, score = b.score, st = b.stats ?? {};
    if (!isInt(dur, 1000, 60_000)) return bad(reply, 400, 'INVALID_DURATION', 'duration_ms integer 1000..60000');
    const elapsedMs = Date.now() - Date.parse(run.started_at);
    if (dur > elapsedMs + 5000) return bad(reply, 400, 'INVALID_DURATION', 'duration_ms vượt server elapsed +5s');
    for (const k of ['stars', 'enemies', 'gates', 'near_misses', 'max_combo']) {
      if (!isInt(st[k] ?? NaN, 0, LIMITS[k])) return bad(reply, 400, 'INVALID_STATS', `${k} integer 0..${LIMITS[k]}`);
    }
    for (const k of ['base_points', 'combo_bonus']) {
      if (!Number.isInteger(st[k]) || st[k] < 0) return bad(reply, 400, 'INVALID_STATS', `${k} integer >= 0`);
    }
    const baseCalc = st.stars * 10 + st.enemies * 20 + st.gates * 15 + st.near_misses * 5;
    if (st.base_points !== baseCalc) return bad(reply, 400, 'INVALID_SCORE', `base_points phải = ${baseCalc}`);
    if (st.combo_bonus > baseCalc * 3) return bad(reply, 400, 'INVALID_SCORE', 'combo_bonus > base_points*3');
    if (!Number.isInteger(score) || score !== baseCalc + st.combo_bonus) return bad(reply, 400, 'INVALID_SCORE', 'score phải = base_points + combo_bonus');
    if (score > SCORE_MAX) return bad(reply, 400, 'INVALID_SCORE', 'score <= 10000');
    if (!['timer', 'lives', 'abandon'].includes(b.finish_reason)) return bad(reply, 400, 'INVALID_STATS', 'finish_reason ∈ {timer,lives,abandon}');

    // finish_hash: idempotency theo payload
    const finishHash = createHash('sha256').update(JSON.stringify({ run_id, player_id: b.player_id, duration_ms: dur, score, finish_reason: b.finish_reason, stats: st })).digest('hex');
    const accepted = b.finish_reason !== 'abandon' ? 1 : 0;

    const finish = db.transaction(() => {
      const prev = db.prepare('SELECT finish_hash FROM run WHERE id = ?').get(run_id);
      if (prev.finish_hash) {
        if (prev.finish_hash !== finishHash) return { conflict: true };
        const row = db.prepare('SELECT * FROM score_v3 WHERE run_id = ?').get(run_id);
        return { replay: true, row };
      }
      const achievedAt = new Date().toISOString();
      db.prepare('UPDATE run SET finished_at = ?, finish_hash = ? WHERE id = ?').run(achievedAt, finishHash, run_id);
      if (accepted) {
        db.prepare(`INSERT INTO score_v3 (run_id, player_id, value, duration_ms, finish_reason, stars, enemies, gates, near_misses, base_points, combo_bonus, max_combo, achieved_at, accepted)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
          .run(run_id, b.player_id, score, dur, b.finish_reason, st.stars, st.enemies, st.gates, st.near_misses, st.base_points, st.combo_bonus, st.max_combo, achievedAt);
        db.prepare(`INSERT INTO daily_stats (player_id, date, rounds, play_seconds, best_score) VALUES (?, date('now'), 1, ?, ?)
          ON CONFLICT(player_id, date) DO UPDATE SET rounds = rounds + 1, play_seconds = play_seconds + excluded.play_seconds, best_score = MAX(best_score, excluded.best_score)`)
          .run(b.player_id, Math.round(dur / 1000), score);
      }
      return { replay: false, achievedAt };
    });

    const r = finish();
    if (r.conflict) return bad(reply, 409, 'RUN_ALREADY_FINISHED', 'Run đã finish với payload khác');

    let personalBest = false, rank = null, achievedAt = r.achievedAt;
    if (accepted) {
      const better = db.prepare('SELECT COUNT(*) AS n FROM score_v3 WHERE player_id = ? AND value > ?').get(b.player_id, score).n;
      personalBest = better === 0;
      if (personalBest) {
        rank = (db.prepare(`SELECT COUNT(DISTINCT player_id) AS n FROM score_v3 WHERE value > ?`).get(score).n) + 1;
      }
      if (r.replay) achievedAt = r.row.achieved_at;
    }
    const status = r.replay ? 200 : 201;
    return reply.status(status).send({ accepted: true, score, personal_best: personalBest, rank, achieved_at: achievedAt });
  });

  // GET /v3/leaderboard — best score/player, tie achieved_at ASC
  fastify.get('/v3/leaderboard', async (req, reply) => {
    if (!rateLimit(`lb:${req.ip}`, 60, 60_000)) return bad(reply, 429, 'RATE_LIMITED', 'Quá nhiều request');
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit) || 10));
    const rows = db.prepare(`
      SELECT s.player_id, p.display_name, s.value AS score, s.max_combo, s.achieved_at,
             ROW_NUMBER() OVER (ORDER BY s.value DESC, s.achieved_at ASC) AS rank
      FROM score_v3 s
      JOIN (SELECT player_id, MAX(value) AS mv FROM score_v3 WHERE accepted = 1 GROUP BY player_id) t
        ON t.player_id = s.player_id AND t.mv = s.value
      JOIN player p ON p.id = s.player_id
      WHERE s.accepted = 1
      GROUP BY s.player_id
      ORDER BY score DESC, s.achieved_at ASC
      LIMIT ?`).all(limit);
    return {
      leaderboard: rows.map(r => ({ rank: r.rank, display_name: r.display_name, score: r.score, max_combo: r.max_combo, achieved_at: r.achieved_at })),
      config_version: CONFIG_VERSION,
    };
  });
}
