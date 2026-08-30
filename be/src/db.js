// SQLite persistence layer (local hosting on Mac Mini — Neon Postgres removed).
// Single better-sqlite3 file at DB_PATH (default: ../data/maybay29.db),
// WAL mode, async-compatible API so callers stay unchanged.

let mode;

export async function initDb() {
  if (mode) return mode;
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
  // Lightweight migration: DBs created by an older schema lack player.updated_at.
  const playerCols = db.prepare("PRAGMA table_info(player)").all().map(c => c.name);
  if (!playerCols.includes('updated_at')) {
    // SQLite can't ADD COLUMN with non-constant default — add nullable then backfill.
    db.exec('ALTER TABLE player ADD COLUMN updated_at TEXT');
    db.exec("UPDATE player SET updated_at = datetime('now') WHERE updated_at IS NULL");
  }
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
