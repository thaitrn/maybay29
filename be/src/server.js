import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDb } from './db.js';
import { statsRoutes } from './stats.js';
import { v3Routes } from './v3.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SCORE = 100_000;
const PORT = Number(process.env.PORT ?? 8391);

export async function buildApp({ logger = true } = {}) {
  const app = Fastify({ logger });
  const db = await initDb();

  const DEFAULT_ORIGINS = [
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4391',
    'https://thaitrn.github.io', 'https://maybay29-be.vercel.app',
  ];
  const origins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : DEFAULT_ORIGINS;
  await app.register(cors, { origin: origins, methods: ['GET', 'POST'] });

  const bad = (reply, status, code, message) => reply.status(status).send({ error: { code, message } });

  app.get('/healthz', async () => ({
    ok: true,
    version: process.env.npm_package_version ?? '1.0.0',
    db: db.kind,
  }));

  // POST /v2/players — idempotent upsert
  app.post('/v2/players', async (req, reply) => {
    const { player_id, display_name } = req.body ?? {};
    if (!UUID_RE.test(player_id ?? '')) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    const name = (display_name ?? 'Player').toString().slice(0, 32).trim() || 'Player';
    await db.run(`INSERT INTO player (id, display_name) VALUES ($1, $2)
      ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name`, [player_id, name]);
    return reply.status(201).send({ player_id, display_name: name });
  });

  // POST /v2/scores {player_id, value, duration_s}
  app.post('/v2/scores', async (req, reply) => {
    const { player_id, value, duration_s } = req.body ?? {};
    if (!UUID_RE.test(player_id ?? '')) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    const v = Number(value), d = Number(duration_s);
    if (!Number.isInteger(v) || v < 0 || v > MAX_SCORE) return bad(reply, 400, 'INVALID_SCORE', `value 0..${MAX_SCORE}`);
    if (!Number.isFinite(d)) return bad(reply, 400, 'INVALID_DURATION', 'duration_s phải là số');
    const dur = Math.max(1, Math.round(d)); // bài học: không NaN, tối thiểu 1
    const player = await db.get('SELECT id FROM player WHERE id = $1', [player_id]);
    if (!player) return bad(reply, 404, 'PLAYER_NOT_FOUND', 'Register /v2/players trước');
    await db.run('INSERT INTO score (player_id, value, duration_s) VALUES ($1, $2, $3)', [player_id, v, dur]);
    return reply.status(201).send({ ok: true });
  });

  // GET /v2/leaderboard — top theo điểm cao nhất mỗi player
  app.get('/v2/leaderboard', async (req) => {
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit) || 10));
    const rows = await db.all(`
      SELECT p.display_name, MAX(s.value) AS value, MAX(s.created_at) AS created_at
      FROM score s JOIN player p ON p.id = s.player_id
      GROUP BY s.player_id ORDER BY value DESC, created_at ASC LIMIT $1`, [limit]);
    return { leaderboard: rows };
  });

  await app.register(statsRoutes, { db, bad });
  await app.register(v3Routes, { db, bad });
  return app;
}

// Standalone entry (local dev / Docker): node src/server.js
if (process.env.VERCEL !== '1') {
  const app = await buildApp();
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`maybay29 BE on :${PORT}`);
}
