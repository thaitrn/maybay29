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
await page.waitForTimeout(900);
const cdp = await ctx.newCDPSession(page);
const results = [];
for (const zone of [ { name: 'top', ty: 160 }, { name: 'mid', ty: 340 }, { name: 'bottom', ty: 560 } ]) {
  // POINTER_OFFSET: targetY = touchY - OFFSET clamp[120,560]; find offset dynamically: planeY≈touchY-35 (observed). touch at ty+35
  const touchY = zone.ty + 35;
  const start = await sceneState(page);
  const p0 = pageXY(start.planeX, start.planeY + 35);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p0.x, y: p0.y }] });
  // move toward target in steps
  for (let i = 1; i <= 10; i++) {
    const gx = start.planeX + (240 - start.planeX) * i / 10;
    const gy = start.planeY + 35 + (touchY - (start.planeY + 35)) * i / 10;
    const pt = pageXY(gx, gy);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pt.x, y: pt.y }] });
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(400); // let lerp settle
  const settled = await sceneState(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(600);
  const after = await sceneState(page);
  results.push({ zone: zone.name, wantY: zone.ty, settledY: Math.round(settled.planeY), settledTargetY: Math.round(settled.targetY), afterReleaseY: Math.round(after.planeY), afterTargetY: Math.round(after.targetY), dragging: after.dragging });
}
const okY = r => Math.abs(r.settledY - r.wantY) <= 2;
const okStay = r => Math.abs(r.afterReleaseY - r.settledY) <= 1 && !r.dragging;
const pass = results.every(r => okY(r) && okStay(r));
console.log('T3', JSON.stringify({ results, pass, errors }, null, 1));
await browser.close();
