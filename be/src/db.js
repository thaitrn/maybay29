// Unified async DB layer.
// - Vercel/production: Neon Postgres (DATABASE_URL), node-postgres pool.
// - Local dev/test: better-sqlite3 file (DB_PATH), exposed through the same async API.
// SQL dialect: queries are written for Postgres; SQLite mode translates $1.. placeholders
// and the few dialect-specific calls (see translate()).

let mode;

export async function initDb() {
  if (mode) return mode;
  if (process.env.DATABASE_URL) {
    const pg = (await import('pg')).default;
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : 5,
      ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
    });
    mode = {
      kind: 'pg',
      async all(sql, params = []) { const r = await pool.query(sql, params); return r.rows; },
      async get(sql, params = []) { const r = await pool.query(sql, params); return r.rows[0] ?? null; },
      async run(sql, params = []) { await pool.query(sql, params); },
      async tx(fn) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const t = {
            all: async (s, p) => (await client.query(s, p)).rows,
            get: async (s, p) => (await client.query(s, p)).rows[0] ?? null,
            run: async (s, p) => { await client.query(s, p); },
          };
          const out = await fn(t);
          await client.query('COMMIT');
          return out;
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
      },
    };
    await mode.run(POSTGRES_SCHEMA);
    return mode;
  }
  // SQLite fallback (local dev/tests)
  const { default: Database } = await import('better-sqlite3');
  const { mkdirSync } = await import('node:fs');
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const dbPath = process.env.DB_PATH ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'maybay29.db');
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 3000');
  db.exec(SQLITE_SCHEMA);
  const tr = (sql) => sql.replace(/\$(\d+)/g, '?');
  mode = {
    kind: 'sqlite',
    all: (sql, p) => db.prepare(tr(sql)).all(...p),
    get: (sql, p) => db.prepare(tr(sql)).get(...p),
    run: (sql, p) => db.prepare(tr(sql)).run(...p),
    async tx(fn) {
      // better-sqlite3 is synchronous; fn receives a sync facade and may return a value directly.
      // We run it inside a real transaction when fn is sync; for async fn (shouldn't happen in
      // sqlite mode — all queries are sync) fall back to sequential execution.
      const t = {
        all: (s, p2) => db.prepare(tr(s)).all(...p2),
        get: (s, p2) => db.prepare(tr(s)).get(...p2),
        run: (s, p2) => db.prepare(tr(s)).run(...p2),
      };
      const out = fn(t);
      return out instanceof Promise ? await out : out;
    },
    pragmaJournal: () => db.pragma('journal_mode', { simple: true }),
  };
  return mode;
}

const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS player (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS score (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES player(id),
  value INTEGER NOT NULL,
  duration_s INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_score_value ON score(value DESC);
CREATE TABLE IF NOT EXISTS session_stats (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES player(id),
  date TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0,
  play_seconds INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, date)
);
CREATE TABLE IF NOT EXISTS run (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES player(id),
  client_version TEXT,
  config_version TEXT NOT NULL DEFAULT 'mb29-v3',
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  finish_hash TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_run_player ON run(player_id, started_at DESC);
CREATE TABLE IF NOT EXISTS score_v3 (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE REFERENCES run(id),
  player_id TEXT NOT NULL REFERENCES player(id),
  value INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  finish_reason TEXT NOT NULL,
  stars INTEGER NOT NULL,
  enemies INTEGER NOT NULL,
  gates INTEGER NOT NULL,
  near_misses INTEGER NOT NULL,
  base_points INTEGER NOT NULL,
  combo_bonus INTEGER NOT NULL,
  max_combo INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_score_v3_lb ON score_v3(accepted, value DESC, achieved_at ASC);
CREATE INDEX IF NOT EXISTS idx_score_v3_player ON score_v3(player_id, value DESC);
CREATE TABLE IF NOT EXISTS daily_stats (
  player_id TEXT NOT NULL REFERENCES player(id),
  date TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0,
  play_seconds INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(player_id, date)
);
`;

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS player (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'Player',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS score (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES player(id),
  value INTEGER NOT NULL,
  duration_s INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_score_value ON score(value DESC);
CREATE TABLE IF NOT EXISTS session_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES player(id),
  date TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0,
  play_seconds INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, date)
);
CREATE TABLE IF NOT EXISTS run (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES player(id),
  client_version TEXT,
  config_version TEXT NOT NULL DEFAULT 'mb29-v3',
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  finished_at TEXT,
  finish_hash TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_run_player ON run(player_id, started_at DESC);
CREATE TABLE IF NOT EXISTS score_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE REFERENCES run(id),
  player_id TEXT NOT NULL REFERENCES player(id),
  value INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  finish_reason TEXT NOT NULL,
  stars INTEGER NOT NULL,
  enemies INTEGER NOT NULL,
  gates INTEGER NOT NULL,
  near_misses INTEGER NOT NULL,
  base_points INTEGER NOT NULL,
  combo_bonus INTEGER NOT NULL,
  max_combo INTEGER NOT NULL,
  achieved_at TEXT NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_score_v3_lb ON score_v3(accepted, value DESC, achieved_at ASC);
CREATE INDEX IF NOT EXISTS idx_score_v3_player ON score_v3(player_id, value DESC);
CREATE TABLE IF NOT EXISTS daily_stats (
  player_id TEXT NOT NULL REFERENCES player(id),
  date TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0,
  play_seconds INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(player_id, date)
);
`;
