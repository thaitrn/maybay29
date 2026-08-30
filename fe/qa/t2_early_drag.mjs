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
const btn = pageXY(240, 470);
await page.touchscreen.tap(btn.x, btn.y);
await page.waitForTimeout(300); // intro still running (600ms tween)
const pre = await sceneState(page);
// CDP touch: press and drag
const cdp = await ctx.newCDPSession(page);
const p0 = pageXY(100, 300);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p0.x, y: p0.y }] });
const samples = [];
let lastPl = null;
for (let i = 0; i <= 20; i++) {
  const gx = 100 + i * 12, gy = 300 + i * 5; // drag to 340,400
  const pt = pageXY(gx, gy);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pt.x, y: pt.y }] });
  await page.waitForTimeout(50);
  const s = await sceneState(page);
  samples.push({ gx, gy, planeX: Math.round(s.planeX), planeY: Math.round(s.planeY), tgt: Math.round(s.targetX) + ',' + Math.round(s.targetY), introDone: s.introDone, dragging: s.dragging });
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const end = await sceneState(page);
// check smoothness: plane-to-finger lag should shrink, no big jumps backward
let maxJump = 0;
for (let i = 1; i < samples.length; i++) maxJump = Math.max(maxJump, Math.abs(samples[i].planeX - samples[i-1].planeX));
const followed = samples.slice(-5).every(s => Math.abs(s.planeX - s.gx) < 60 && Math.abs(s.planeY - (s.gy)) < 60);
console.log('T2', JSON.stringify({ preIntroDone: pre.introDone, samples: samples.slice(0, 3).concat(samples.slice(-3)), maxJumpPxPerStep: maxJump, followed, endDragging: end.dragging, errors }, null, 1));
await browser.close();
