/** Wall/session clock vs physics dt. Physics stays capped so low FPS does not explode sim;
 * round timer uses unclamped wall dt so a 60s round ends ~60s while the tab is visible. */

export const PHYS_DT_CAP = 1 / 30;
export const ROUND_SEC = 60;

export function splitDt(dtMs: number, physCap = PHYS_DT_CAP): { wall: number; phys: number } {
  const wall = Math.max(0, dtMs / 1000);
  return { wall, phys: Math.min(wall, physCap) };
}

export function roundOver(wallElapsedSec: number, lives: number, roundSec = ROUND_SEC): boolean {
  return lives <= 0 || wallElapsedSec >= roundSec;
}

export function durationMsFromWall(wallElapsedSec: number, roundMs = ROUND_SEC * 1000): number {
  return Math.min(roundMs, Math.max(1000, Math.round(wallElapsedSec * 1000)));
}
