import { PLAYER_H } from './physics';

export type Archetype = 'cloud' | 'vortex' | 'thunder' | 'scout' | 'glider' | 'star' | 'lotus';

export interface SpawnSpec {
  t: number;
  kind: Archetype;
  y: number;
  gap?: number;
  dir?: 1 | -1;
  telegraph: number;
}

const MIN_GAP = PLAYER_H * 1.6;
const HUD_Y = 88;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function laneY(rng: () => number, i: number): number {
  const lanes = [180, 280, 380, 480, 560];
  return lanes[Math.floor(rng() * lanes.length + i) % lanes.length];
}

/** Curated timeline + light seed jitter. Always includes all archetypes in a full 60s run. */
export function buildTimeline(seed = 1): SpawnSpec[] {
  const rng = mulberry32(seed);
  const j = (n: number) => (rng() - 0.5) * n;
  const out: SpawnSpec[] = [];

  // 0–5s: star line, no damage content
  for (let i = 0; i < 4; i++) {
    out.push({ t: 0.6 + i * 0.9, kind: 'star', y: 320 + j(40), telegraph: 0.4 });
  }

  // 5–20s: cloud gates + scout
  out.push({ t: 6.0, kind: 'cloud', y: 340 + j(30), gap: 150, telegraph: 0.7 });
  out.push({ t: 7.2, kind: 'star', y: 340, telegraph: 0.4 });
  out.push({ t: 9.5, kind: 'scout', y: 240 + j(20), telegraph: 0.7 });
  out.push({ t: 11.0, kind: 'cloud', y: 420, gap: 160, telegraph: 0.7 });
  out.push({ t: 12.4, kind: 'star', y: 420, telegraph: 0.4 });
  out.push({ t: 14.5, kind: 'scout', y: 500, telegraph: 0.7 });
  out.push({ t: 16.5, kind: 'cloud', y: 280, gap: 155, telegraph: 0.7 });
  out.push({ t: 17.8, kind: 'star', y: 280, telegraph: 0.4 });
  out.push({ t: 19.2, kind: 'star', y: 360, telegraph: 0.4 });

  // 20–40s: vortex + glider + lotus
  out.push({ t: 21.0, kind: 'vortex', y: 300, dir: 1, telegraph: 0.7 });
  out.push({ t: 22.5, kind: 'star', y: 260, telegraph: 0.4 });
  out.push({ t: 24.0, kind: 'glider', y: 360, telegraph: 0.8 });
  out.push({ t: 26.0, kind: 'lotus', y: 400, telegraph: 0.5 });
  out.push({ t: 28.0, kind: 'cloud', y: 380, gap: 148, telegraph: 0.7 });
  out.push({ t: 30.5, kind: 'scout', y: 200, telegraph: 0.7 });
  out.push({ t: 32.0, kind: 'vortex', y: 460, dir: -1, telegraph: 0.7 });
  out.push({ t: 34.0, kind: 'glider', y: 300, telegraph: 0.8 });
  out.push({ t: 36.0, kind: 'star', y: 300, telegraph: 0.4 });
  out.push({ t: 37.5, kind: 'cloud', y: 250, gap: 150, telegraph: 0.7 });
  out.push({ t: 39.0, kind: 'lotus', y: 500, telegraph: 0.5 });

  // 40–55s: mix, always a safe lane
  out.push({ t: 41.0, kind: 'thunder', y: 220, telegraph: 0.8 });
  out.push({ t: 42.5, kind: 'star', y: 480, telegraph: 0.4 });
  out.push({ t: 44.0, kind: 'glider', y: 400, telegraph: 0.8 });
  out.push({ t: 45.5, kind: 'cloud', y: 360, gap: 145, telegraph: 0.7 });
  out.push({ t: 47.0, kind: 'vortex', y: 280, dir: 1, telegraph: 0.7 });
  out.push({ t: 48.5, kind: 'scout', y: 520, telegraph: 0.7 });
  out.push({ t: 50.0, kind: 'thunder', y: 500, telegraph: 0.8 });
  out.push({ t: 51.5, kind: 'star', y: 300, telegraph: 0.4 });
  out.push({ t: 52.5, kind: 'glider', y: 240, telegraph: 0.8 });
  out.push({ t: 53.8, kind: 'cloud', y: 400, gap: 155, telegraph: 0.7 });

  // 55–60s: star rain, no new patterns
  for (let i = 0; i < 8; i++) {
    out.push({ t: 55.2 + i * 0.45, kind: 'star', y: 200 + (i % 5) * 70, telegraph: 0.3 });
  }

  return out.map((s) => ({
    ...s,
    y: Math.max(HUD_Y + 48, Math.min(580, s.y + j(6))),
    gap: s.gap ? Math.max(MIN_GAP + 40, s.gap) : s.gap,
  }));
}

export function validateTimeline(specs: SpawnSpec[]): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const kinds = new Set(specs.map((s) => s.kind));
  for (const k of ['cloud', 'vortex', 'thunder', 'scout', 'glider', 'star', 'lotus'] as Archetype[]) {
    if (!kinds.has(k)) reasons.push(`missing ${k}`);
  }
  for (const s of specs) {
    if (s.y < HUD_Y + 20) reasons.push(`hud overlap t=${s.t}`);
    if (s.kind === 'cloud' && (s.gap ?? 0) < MIN_GAP) reasons.push(`gap too small t=${s.t}`);
    if (s.telegraph < 0.3) reasons.push(`telegraph short t=${s.t}`);
  }
  return { ok: reasons.length === 0, reasons };
}

export function auditSeeds(n = 100): { ok: boolean; failed: number[] } {
  const failed: number[] = [];
  for (let i = 1; i <= n; i++) {
    const v = validateTimeline(buildTimeline(i));
    if (!v.ok) failed.push(i);
  }
  return { ok: failed.length === 0, failed };
}
