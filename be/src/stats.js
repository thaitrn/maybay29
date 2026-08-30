// Metric engagement: POST /v2/stats (upsert cộng dồn theo player+date), GET /v2/stats/:player_id
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function statsRoutes(fastify, { db, bad }) {
  fastify.post('/v2/stats', async (req, reply) => {
    const { player_id, date, rounds, play_seconds, best_score } = req.body ?? {};
    if (!UUID_RE.test(player_id ?? '')) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    if (!DATE_RE.test(date ?? '')) return bad(reply, 400, 'INVALID_DATE', 'date phải là YYYY-MM-DD');
    if (!Number.isInteger(rounds) || rounds < 0) return bad(reply, 400, 'INVALID_ROUNDS', 'rounds >= 0');
    if (!Number.isInteger(play_seconds) || play_seconds < 0) return bad(reply, 400, 'INVALID_PLAY_SECONDS', 'play_seconds >= 0');
    if (!Number.isInteger(best_score) || best_score < 0) return bad(reply, 400, 'INVALID_BEST_SCORE', 'best_score >= 0');
    if (!(await db.get('SELECT id FROM player WHERE id = $1', [player_id]))) {
      return bad(reply, 404, 'PLAYER_NOT_FOUND', 'Chưa register player');
    }
    await db.tx(async (t) => {
      const cur = await t.get('SELECT id, rounds, play_seconds, best_score FROM session_stats WHERE player_id = $1 AND date = $2', [player_id, date]);
      if (!cur) {
        await t.run('INSERT INTO session_stats (player_id, date, rounds, play_seconds, best_score) VALUES ($1, $2, $3, $4, $5)',
          [player_id, date, rounds, play_seconds, best_score]);
      } else {
        await t.run(`UPDATE session_stats SET rounds = $1, play_seconds = $2,
          best_score = (CASE WHEN session_stats.best_score < $3 THEN $3 ELSE session_stats.best_score END) WHERE id = $4`,
          [cur.rounds + rounds, cur.play_seconds + play_seconds, best_score, cur.id]);
      }
    });
    const row = await db.get('SELECT player_id, date, rounds, play_seconds, best_score, created_at FROM session_stats WHERE player_id = $1 AND date = $2', [player_id, date]);
    return reply.status(201).send(row);
  });

  fastify.get('/v2/stats/:player_id', async (req, reply) => {
    if (!UUID_RE.test(req.params.player_id)) return bad(reply, 400, 'INVALID_PLAYER_ID', 'player_id phải là UUID v4');
    const rows = await db.all('SELECT date, rounds, play_seconds, best_score, created_at FROM session_stats WHERE player_id = $1 ORDER BY date ASC', [req.params.player_id]);
    return { player_id: req.params.player_id, count: rows.length, stats: rows };
  });
}
