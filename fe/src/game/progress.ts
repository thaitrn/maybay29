const KEY = 'maybay29_v3_meta';

export interface Meta {
  best_score: number;
  total_stars: number;
  selected_skin: string;
  unlocked_skins: string[];
  muted?: boolean;
}

const DEFAULT: Meta = {
  best_score: 0,
  total_stars: 0,
  selected_skin: 'default',
  unlocked_skins: ['default'],
};

export const SKINS = [
  { id: 'default', name: 'Sứ giả', need: 0 },
  { id: 'sen-vang', name: 'Sen Vàng', need: 100 },
  { id: 'trong-dong', name: 'Trống Đồng', need: 300 },
];

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, unlocked_skins: [...DEFAULT.unlocked_skins] };
    const p = JSON.parse(raw) as Meta;
    return {
      best_score: Number(p.best_score) || 0,
      total_stars: Number(p.total_stars) || 0,
      selected_skin: typeof p.selected_skin === 'string' ? p.selected_skin : 'default',
      unlocked_skins: Array.isArray(p.unlocked_skins) ? p.unlocked_skins : ['default'],
    };
  } catch {
    return { ...DEFAULT, unlocked_skins: [...DEFAULT.unlocked_skins] };
  }
}

export function saveMeta(m: Meta): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function applyRun(prev: Meta, score: number, stars: number): { meta: Meta; unlocked: string[] } {
  const total = prev.total_stars + stars;
  const unlocked = [...new Set(prev.unlocked_skins)];
  const newly: string[] = [];
  for (const s of SKINS) {
    if (total >= s.need && !unlocked.includes(s.id)) {
      unlocked.push(s.id);
      newly.push(s.id);
    }
  }
  const meta: Meta = {
    best_score: Math.max(prev.best_score, score),
    total_stars: total,
    selected_skin: prev.selected_skin,
    unlocked_skins: unlocked,
  };
  return { meta, unlocked: newly };
}
