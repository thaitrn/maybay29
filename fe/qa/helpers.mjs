// QA helpers for Máy Bay 2/9 intro fix verification
const PW = '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

export async function loadPW() {
  return await import(PW);
}

export const URL = 'http://localhost:4395/';
export const VIEWPORT = { width: 390, height: 844 };

// canvas-to-page coordinate mapper: game is 480x?? logical, canvas fills viewport
export async function canvasBounds(page) {
  return await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const gs = window.game;
    const scale = Math.min(r.width / gs.config.width, r.height / gs.config.height);
    return { rect: { x: r.x, y: r.y, w: r.width, h: r.height },
             gw: gs.config.width, gh: gs.config.height, scale };
  });
}

// map game coords -> page coords (touchscreen uses page coords)
export function toPage(cb, gx, gy) {
  const { rect, gw, gh } = cb;
  const scale = Math.min(rect.w / gw, rect.h / gh);
  const offX = rect.x + (rect.w - gw * scale) / 2;
  const offY = rect.y + (rect.h - gh * scale) / 2;
  return { x: offX + gx * scale, y: offY + gy * scale };
}

export async function sceneState(page) {
  return await page.evaluate(() => {
    const s = window.game && window.game.__gameScene;
    if (!s) return null;
    const p = s.plane;
    return {
      planeX: s.planeX, planeY: s.planeY, targetX: s.targetX, targetY: s.targetY,
      introDone: s.introDone, dragging: s.dragging, score: s.score, lives: s.lives,
      ended: s.ended, visible: p && p.visible, frame: p && p.frame && p.frame.name,
      anim: p && p.anims && p.anims.currentAnim && p.anims.currentAnim.key,
      timeLeft: s.timeLeft,
    };
  });
}
