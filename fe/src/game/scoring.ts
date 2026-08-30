export const STAR_PTS = 10;
export const ENEMY_PTS = 20;
export const GATE_PTS = 15;
export const NEAR_PTS = 5;
export const RUC_NEED = 12;
export const RUC_MS = 5000;
export const SHIELD_MS = 6000;
export const LIVES = 3;
export const ROUND_MS = 60_000;
export const GRACE_MS = 2500;
export const INVULN_MS = 1000;

export function comboMult(streak: number): number {
  if (streak >= 20) return 4;
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
}

export function award(base: number, streak: number): { points: number; streak: number; mult: number } {
  const next = streak + 1;
  const mult = comboMult(next);
  return { points: base * mult, streak: next, mult };
}

export function derivedScore(stats: {
  stars: number;
  enemies: number;
  gates: number;
  near_misses: number;
}): number {
  return stats.stars * STAR_PTS + stats.enemies * ENEMY_PTS + stats.gates * GATE_PTS + stats.near_misses * NEAR_PTS;
}

export interface RunStats {
  stars: number;
  enemies: number;
  gates: number;
  near_misses: number;
  base_points: number;
  combo_bonus: number;
  max_combo: number;
}

export function emptyStats(): RunStats {
  return { stars: 0, enemies: 0, gates: 0, near_misses: 0, base_points: 0, combo_bonus: 0, max_combo: 0 };
}

export function addEvent(stats: RunStats, kind: 'star' | 'enemy' | 'gate' | 'near', streak: number): { stats: RunStats; gained: number; streak: number } {
  const base = kind === 'star' ? STAR_PTS : kind === 'enemy' ? ENEMY_PTS : kind === 'gate' ? GATE_PTS : NEAR_PTS;
  const a = award(base, streak);
  const next: RunStats = { ...stats };
  if (kind === 'star') next.stars += 1;
  if (kind === 'enemy') next.enemies += 1;
  if (kind === 'gate') next.gates += 1;
  if (kind === 'near') next.near_misses += 1;
  next.base_points += base;
  next.combo_bonus += a.points - base;
  next.max_combo = Math.max(next.max_combo, a.streak);
  return { stats: next, gained: a.points, streak: a.streak };
}
