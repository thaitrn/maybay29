// T5: regression — menu->BAY NGAY, hitSmoke x5 -> quiz (answer, TIẾP) -> GameOver; 0 pageerror; fps 8s
import { loadPW, URL, VIEWPORT, sceneState } from './helpers.mjs';
const GW = 480, GH = 720;
const pw = await loadPW();
const browser = await pw.chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL); await page.waitForTimeout(600);
function pageXY(gx, gy) {
  const scale = Math.min(390 / GW, 844 / GH);
  const offX = (390 - GW * scale) / 2, offY = (844 - GH * scale) / 2;
  return { x: offX + gx * scale, y: offY + gy * scale };
}
const active = () => page.evaluate(() => {
  const s = window.game.scene.scenes.find(s => s.scene.isActive());
  return s ? s.scene.key : null;
});
const buttons = () => page.evaluate(() => {
  const s = window.game.scene.scenes.find(s => s.scene.isActive());
  if (!s) return [];
  return s.children.list.filter(c => c.input && c.input.hitArea).map(c => ({
    x: c.x, y: c.y, w: c.width, h: c.height, text: c.text ? String(c.text).slice(0, 30) : null
  }));
});

// fps probe
await page.evaluate(() => { window.__frames = 0; const loop = () => { window.__frames++; requestAnimationFrame(loop); }; requestAnimationFrame(loop); });

// 1. menu -> BAY NGAY
await page.touchscreen.tap(...Object.values(pageXY(240, 470)));
await page.waitForTimeout(900);
const sceneAfterStart = await active();

// 2. hitSmoke x5 (invuln 1s each hit -> wait between)
const trace = [];
for (let i = 0; i < 5; i++) {
  const r = await page.evaluate(() => {
    const s = window.game.__gameScene;
    if (!s || s.ended) return null;
    s.invulnUntil = 0;
    s.hitSmoke(0, 0);
    return { lives: s.lives, ended: s.ended };
  });
  trace.push(r);
  if (r && r.ended) break;
  await page.waitForTimeout(1150);
}
await page.waitForTimeout(2200); // endRound 1200ms -> HistoryQuiz
const sceneAfterDeath = await active();
const qBtns = await buttons();

// 3. tap first answer button (highest y among options, avoid TIẾP which appears after)
let answerTapped = false, tiepSeen = null, sceneGameOver = null;
if (qBtns.length) {
  const ans = qBtns[0];
  await page.touchscreen.tap(...Object.values(pageXY(ans.x, ans.y)));
  answerTapped = true;
  await page.waitForTimeout(500);
  const after = await buttons();
  tiepSeen = after.find(b => b.text && b.text.includes('TIẾP')) || null;
  if (tiepSeen) {
    await page.touchscreen.tap(...Object.values(pageXY(tiepSeen.x, tiepSeen.y)));
    await page.waitForTimeout(900);
    sceneGameOver = await active();
  }
}
// fps over 8s (total run includes play; measure now for remaining, but simpler: report frames since start / elapsed)
const fpsData = await page.evaluate(() => ({ frames: window.__frames, ms: performance.now() }));
const fps = fpsData.frames / (fpsData.ms / 1000);
console.log('T5', JSON.stringify({ sceneAfterStart, hitTrace: trace, sceneAfterDeath, qBtnCount: qBtns.length, answerTapped, tiepSeen, sceneGameOver, fpsAvg: Math.round(fps * 10) / 10, elapsedS: Math.round(fpsData.ms / 1000), errors }, null, 1));
await browser.close();
