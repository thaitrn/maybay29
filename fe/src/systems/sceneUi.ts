/** Guard Phaser text/object writes after the scene has been shut down (replay mid-fetch). */
export function canUpdateGameObject(
  sceneAlive: boolean,
  obj: { active?: boolean; scene?: unknown } | null | undefined,
): boolean {
  if (!sceneAlive || !obj) return false;
  if (obj.active === false) return false;
  if (obj.scene == null) return false;
  return true;
}
