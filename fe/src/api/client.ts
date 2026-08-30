const envBase = (import.meta as unknown as { env: { VITE_API_BASE?: string } }).env.VITE_API_BASE;
export const API_BASE: string = envBase && envBase.length > 0 ? envBase.replace(/\/$/, '') : 'https://maybay29-api.vercel.app';

if (typeof window !== 'undefined' && import.meta.env.PROD) {
  if (!API_BASE.startsWith('https://') || /localhost|127\.0\.0\.1/i.test(API_BASE)) {
    throw new Error(`Production API_BASE invalid: ${API_BASE}`);
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  try {
    const r = await fetch(API_BASE + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export interface RunCreated {
  run_id: string;
  started_at: string;
  expires_at: string;
  config_version: string;
}

export interface FinishBody {
  player_id: string;
  duration_ms: number;
  score: number;
  finish_reason: 'timer' | 'lives' | 'abandon';
  stats: {
    stars: number;
    enemies: number;
    gates: number;
    near_misses: number;
    base_points: number;
    combo_bonus: number;
    max_combo: number;
  };
}

export interface FinishRes {
  accepted: boolean;
  score: number;
  personal_best: boolean;
  rank: number | null;
  achieved_at: string;
}

export interface LeaderRow {
  rank: number;
  display_name: string;
  score: number;
  max_combo: number;
  achieved_at: string;
}

export const api = {
  registerPlayer: (player_id: string, display_name: string) =>
    req<{ player_id: string; display_name: string }>('POST', '/v3/players', { player_id, display_name }),
  createRun: (player_id: string, client_version: string) =>
    req<RunCreated>('POST', '/v3/runs', { player_id, client_version }),
  finishRun: (run_id: string, body: FinishBody) =>
    req<FinishRes>('POST', `/v3/runs/${run_id}/finish`, body),
  leaderboard: (limit = 10) =>
    req<{ leaderboard: LeaderRow[]; config_version: string }>('GET', `/v3/leaderboard?limit=${limit}`),
};
