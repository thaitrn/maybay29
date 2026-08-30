import { chromium } from 'playwright';

const url = process.env.PLAY_URL || 'https://thaitrn.github.io/maybay29/';
const GAME_W = 480;
const GAME_H = 720;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 393, height: 851 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2.75,
  userAgent:
    'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

const errors = [];
const reloads = [];
const finishes = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) reloads.push({ url: frame.url(), t: Date.now() });
});
page.on('response', async (res) => {
  const u = res.url();
  if (u.includes('/v3/runs/') && u.includes('/finish')) {
    finishes.push({ status: res.status(), url: u, t: Date.now() });
  }
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.game && window.game.__scene === 'Menu', { timeout: 20000 });

async function tapGame(gx, gy) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('no canvas');
  const x = box.x + (gx / GAME_W) * box.width;
  const y = box.y + (gy / GAME_H) * box.height;
  await page.touchscreen.tap(x, y);
}

const rounds = [];

async function playUntilOver(label) {
  const t0 = Date.now();
  let frames = [];
  while (Date.now() - t0 < 70000) {
    await tapGame(200, 360);
    const snap = await page.evaluate(() => {
      const g = window.game;
      const s = g?.scene?.getScene?.('Game');
      return {
        scene: g?.__scene,
        elapsed: s?.elapsed ?? null,
        frame: g?.loop?.frame ?? null,
        fps: g?.loop?.actualFps ?? null,
      };
    });
    frames.push({ ...snap, wall: Date.now() - t0 });
    if (snap.scene === 'GameOver') break;
    await page.waitForTimeout(250);
  }
  const wall = Date.now() - t0;
  const result = await page.evaluate(() => ({
    scene: window.game?.__scene,
    result: window.game?.__result,
  }));
  const frameAdvanced = frames.filter((f) => f.frame != null).length >= 2 &&
    frames[frames.length - 1].frame > frames[1].frame;
  rounds.push({ label, wall, result, frameAdvanced, last: frames.at(-1) });
  return { wall, result, frameAdvanced };
}

await tapGame(240, 500);
await page.waitForFunction(() => window.game && window.game.__scene === 'Game', { timeout: 12000 });
const r1 = await playUntilOver('round1');
if (r1.result.scene !== 'GameOver') {
console.error(JSON.stringify({ fail: 'no result after round1', r1, errors, reloads, finishes }, null, 2));
await browser.close();
process.exit(1);
}
await page.waitForTimeout(2500);

await tapGame(240, 280);
await page.waitForFunction(() => window.game && window.game.__scene === 'Game', { timeout: 12000 });
const r2 = await playUntilOver('round2');
await page.waitForTimeout(2500);

await browser.close();

const navAfterStart = reloads.filter((n, i) => i > 0);
const bad410 = finishes.filter((f) => f.status === 410);
const canvasNoise = errors.filter((e) => e.includes("reading 'drawImage'"));
const realErrors = errors.filter((e) => !e.includes("reading 'drawImage'"));
const r1Timer = r1.result.result?.finish_reason === 'timer' ? r1.wall : null;
const r2Timer = r2.result.result?.finish_reason === 'timer' ? r2.wall : null;
const wallOk = [r1Timer, r2Timer].every((w) => w == null || (w >= 55000 && w <= 75000));
const ok =
  realErrors.length === 0 &&
  navAfterStart.length === 0 &&
  bad410.length === 0 &&
  finishes.every((f) => f.status === 200 || f.status === 201) &&
  finishes.length >= 1 &&
  r1.result.scene === 'GameOver' &&
  r2.result.scene === 'GameOver' &&
  r1.frameAdvanced &&
  r2.frameAdvanced &&
  wallOk &&
  r1.result.result?.finish_reason === 'timer' &&
  r2.result.result?.finish_reason === 'timer';

const report = {
  url,
  asset: 'assets/index-ljgHzyrU.js',
  wallOk,
  r1Timer,
  rounds: rounds.map((r) => ({
    label: r.label,
    wall: r.wall,
    scene: r.result.scene,
    reason: r.result.result?.finish_reason,
    duration_ms: r.result.result?.duration_ms,
    score: r.result.result?.score,
    frameAdvanced: r.frameAdvanced,
  })),
  finishes,
  reloads: navAfterStart,
  errors,
  ok,
};
console.log(JSON.stringify(report, null, 2));
if (!ok) process.exit(1);
