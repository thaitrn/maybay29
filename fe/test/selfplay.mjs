import { chromium } from 'playwright';

const url = process.env.PLAY_URL || 'http://127.0.0.1:4174/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.game && window.game.__scene === 'Menu', { timeout: 15000 });

async function tapGame(gx, gy) {
  const box = await page.locator('canvas').boundingBox();
  const x = box.x + (gx / 480) * box.width;
  const y = box.y + (gy / 720) * box.height;
  await page.mouse.click(x, y);
}

await tapGame(240, 500);
await page.waitForFunction(() => window.game && window.game.__scene === 'Game', { timeout: 8000 });
const scene1 = await page.evaluate(() => window.game.__scene);

// Play ~12s realtime then force finale so headless rAF throttle cannot stall 60s clock.
const t0 = Date.now();
while (Date.now() - t0 < 14000) {
  await tapGame(200, 360);
  await page.waitForTimeout(200);
}
await page.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  if (s && s.elapsed < 59) s.elapsed = 59.2;
});
await page.waitForFunction(() => window.game && window.game.__scene === 'GameOver', { timeout: 8000 });
await tapGame(240, 280);
await page.waitForFunction(() => window.game && window.game.__scene === 'Game', { timeout: 8000 });
const replayScene = await page.evaluate(() => window.game.__scene);
const end = await page.evaluate(() => ({
  scene: window.game.__scene,
  result: window.game.__result,
}));
await browser.close();
console.log(JSON.stringify({ errors, scene1, replayScene, end }, null, 2));
if (errors.length || replayScene !== 'Game') process.exit(1);
