import { loadPW, URL, VIEWPORT, sceneState, toPage, canvasBounds } from './helpers.mjs';

const GW = 480, GH = 720; // Phaser game logical size, Scale.FIT CENTER_BOTH

const pw = await loadPW();
const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL); await page.waitForTimeout(600);

// canvas bounds & map
function pageXY(gx, gy) {
  // canvas fills 390x844; FIT scale = min(390/480, 844/720)=0.8125; offsets centered
  const scale = Math.min(390 / GW, 844 / GH);
  const offX = (390 - GW * scale) / 2, offY = (844 - GH * scale) / 2;
  return { x: offX + gx * scale, y: offY + gy * scale };
}
const btn = pageXY(240, 470);
console.log('BAY NGAY tap at', btn);
await page.touchscreen.tap(btn.x, btn.y);
const t0 = Date.now();
await page.waitForTimeout(1250 - (Date.now() - t0));
const f1 = await sceneState(page);
await page.waitForTimeout(350);
const f2 = await sceneState(page);
const pass = f1 && f1.visible && f1.planeX >= 80 && f1.planeX <= 140 && f1.anim === 'gf-plane-flap' && f1.frame !== f2.frame;
console.log('T1', JSON.stringify({ f1, f2, frameChanged: f1 && f1.frame !== f2.frame, pass, errors }));
await browser.close();
