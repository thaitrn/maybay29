const KEY = 'maybay29_player_id';

/** UUID v4 ổn định theo device (localStorage). */
export function ensurePlayerId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return id;
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return '00000000-0000-4000-8000-000000000001';
  }
}
