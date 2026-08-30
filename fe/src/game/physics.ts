/** One-tap lift physics — delta-time, FPS independent. */

export const PLAYER_X = 110;
export const PLAYER_W = 48;
export const PLAYER_H = 28;
export const HIT_INSET = 6;
export const SKY_MIN = 96;
export const SKY_MAX = 620;
export const GRAVITY = 1650;
export const LIFT_IMPULSE = -420;
export const MAX_FALL = 620;
export const MAX_LIFT = -520;
export const DT_CLAMP = 1 / 30;

export interface PlaneState {
  x: number;
  y: number;
  vy: number;
}

export function createPlane(): PlaneState {
  return { x: PLAYER_X, y: (SKY_MIN + SKY_MAX) / 2, vy: 0 };
}

export function applyLift(p: PlaneState): PlaneState {
  return { ...p, vy: Math.max(MAX_LIFT, p.vy + LIFT_IMPULSE) };
}

export function stepPlane(p: PlaneState, dt: number): PlaneState {
  const t = Math.min(Math.max(dt, 0), DT_CLAMP);
  let vy = p.vy + GRAVITY * t;
  vy = Math.min(MAX_FALL, Math.max(MAX_LIFT, vy));
  let y = p.y + vy * t;
  if (y < SKY_MIN) {
    y = SKY_MIN;
    vy = Math.max(0, vy);
  }
  if (y > SKY_MAX) {
    y = SKY_MAX;
    vy = Math.min(0, vy);
  }
  return { x: p.x, y, vy };
}

export function playerHitbox(p: PlaneState): { x: number; y: number; w: number; h: number } {
  return {
    x: p.x - PLAYER_W / 2 + HIT_INSET,
    y: p.y - PLAYER_H / 2 + HIT_INSET,
    w: PLAYER_W - HIT_INSET * 2,
    h: PLAYER_H - HIT_INSET * 2,
  };
}

export function aabb(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function scrollSpeed(elapsed: number): number {
  if (elapsed < 20) return 160;
  if (elapsed < 40) return 176;
  if (elapsed < 55) return 192;
  return 168;
}
