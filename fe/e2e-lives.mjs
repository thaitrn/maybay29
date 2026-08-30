import { chromium } from 'playwright';
import { spawn } from 'child_process';

const preview = spawn('npx', ['vite', 'preview', '--port', '4183', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 480, height: 720 }, hasTouch: true });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));
await page.goto('http://localhost:4183/');
await page.waitForTimeout(1500);

const results = [];
const snap = () => page.evaluate(`(() => {
  const s = window.game.scene.getScene('Game');
  return { lives: s.lives, score: s.score, ended: s.ended,
    scene: s.scene.isActive('Game') ? 'Game' : (s.scene.isActive('GameOver') ? 'GameOver' : '?'),
    livesText: s.livesText ? s.livesText.text : null };
})()`);
const hitSmoke = () => page.evaluate(`(() => { const s = window.game.scene.getScene('Game'); s.hitSmoke(s.planeX, s.planeY); })()`);

// vào game
await page.evaluate(`window.game.scene.getScene('Menu').scene.start('Game')`);
await page.waitForTimeout(1200);

results.push(['(a) vào game', await snap()]);

await hitSmoke();
results.push(['(b1) chạm khói lần 1', await snap()]);
await hitSmoke();
results.push(['(b2) chạm khói lần 2 ngay (bất tử)', await snap()]);

await page.waitForTimeout(1300);
for (let i = 3; i <= 6; i++) {
  await hitSmoke();
  results.push([`(c) chạm khói lần ${i}`, await snap()]);
  if (i < 6) await page.waitForTimeout(1150);
}
await page.waitForTimeout(1800);
const over = await page.evaluate(`(() => {
  const g = window.game;
  const sc = g.scene.getScene('GameOver');
  const texts = sc ? sc.children.list.filter(c => c.text !== undefined).map(c => c.text) : [];
  return { activeGameOver: !!sc && sc.scene.isActive(), texts, lastSubmit: g.__lastSubmit ?? null };
})()`);
results.push(['(c) GameOver sau 5 lần chạm', over]);

// (d) ván mới: kéo ngón tới đáy → planeY dừng ở 560
await page.evaluate(`window.game.scene.getScene('GameOver').scene.start('Game')`);
await page.waitForTimeout(800);
await page.mouse.move(240, 620);
await page.mouse.down();
for (let y = 620; y <= 800; y += 20) { await page.mouse.move(240, y); await page.waitForTimeout(40); }
await page.waitForTimeout(1000);
const d = await page.evaluate(`(() => { const s = window.game.scene.getScene('Game');
  return { planeY: Math.round(s.planeY), targetY: Math.round(s.targetY) }; })()`);
await page.mouse.up();
results.push(['(d) kéo tới đáy → dừng 560', d]);

console.log('PAGEERRORS:', pageErrors.length ? pageErrors : 'none');
for (const [k, v] of results) console.log(k, '=>', JSON.stringify(v));
await browser.close();
preview.kill();
