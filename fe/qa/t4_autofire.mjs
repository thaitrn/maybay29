// T4: auto-fire hits star placed on plane -> score up + gf-firework appears
import { loadPW, URL, VIEWPORT, sceneState } from './helpers.mjs';
const GW = 480, GH = 720;
const pw = await loadPW();
const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(URL); await page.waitForTimeout(600);
function pageXY(gx, gy) {
  const scale = Math.min(390 / GW, 844 / GH);
  const offX = (390 - GW * scale) / 2, offY = (844 - GH * scale) / 2;
  return { x: offX + gx * scale, y: offY + gy * scale };
}
await page.touchscreen.tap(...Object.values(pageXY(240, 470)));
await page.waitForTimeout(1000);
const before = await sceneState(page);
// inject a star 60px above plane (shell travels up 12px/frame from planeY-24; spawn star so shell reaches it before top)
const injected = await page.evaluate(() => {
  const s = window.game.__gameScene;
  const spr = s.add.image(s.planeX, s.planeY - 80, 'gf-star').setScale(2);
  s.items.push({ sprite: spr, kind: 'star', vy: 0 }); // vy 0: hover in place
  return { starX: spr.x, starY: spr.y, planeX: s.planeX, planeY: s.planeY };
});
// monitor for gf-firework image appearing + score change
let fireworkSeen = null, scoreAfter = null;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => {
    const s = window.game.__gameScene;
    // look for particles/images using gf-firework texture
    let fw = null;
    s.children.list.forEach(c => { if (c.texture && c.texture.key === 'gf-firework' && c.visible) fw = { x: Math.round(c.x), y: Math.round(c.y) }; });
    return { score: s.score, fw, itemsLen: s.items.length };
  });
  if (r.fw && !fireworkSeen) fireworkSeen = r.fw;
  scoreAfter = r.score;
  if (fireworkSeen && r.score > before.score) break;
}
console.log('T4', JSON.stringify({ beforeScore: before.score, injected, fireworkSeen, scoreAfter, pass: fireworkSeen && scoreAfter > before.score, errors }));
await browser.close();
