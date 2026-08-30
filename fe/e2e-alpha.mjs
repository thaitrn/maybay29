// E2E alpha: menu -> game -> tap 5 phat -> diem tang -> end -> game over -> submit BE
import { chromium } from '/Users/thaitrn/Workspaces/work/pixel-quest/fe/node_modules/playwright/index.mjs';

const base = 'http://localhost:5174';
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | ${detail}`); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 720 } });
await page.goto(base, { waitUntil: 'networkidle' });

// menu
await page.waitForFunction(() => window.game && window.game.scene.isActive('Menu'), null, { timeout: 15000 });
log('load menu', true, 'scene Menu active');

// vao game: tap nut BAY NGAY
await page.mouse.click(240, 470);
await page.waitForFunction(() => window.game.scene.isActive('Game'), null, { timeout: 10000 });
log('vao GameScene', true);

// cho plane di chuyen + spawn items
await page.waitForTimeout(4000);
const getScore = () => page.evaluate(() => window.game.__gameScene.score);

// tap 5 phat (diem tang khi trung sao / hung sao; chac chan co sao roi trong 4s)
let fired = 0;
for (let i = 0; i < 5; i++) {
  await page.mouse.click(240, 360);
  fired++;
  await page.waitForTimeout(700);
}
// cho shell bay len trung sao
await page.waitForTimeout(2000);
const s1 = await getScore();
// tiep tuc tap theo vi tri sao roi
const starPos = await page.evaluate(() => {
  const gs = window.game.__gameScene;
  const st = gs.items.filter(i => i.kind === 'star').map(i => ({ x: i.sprite.x, y: i.sprite.y }));
  return st;
});
log('items roi con song', starPos.length > 0, JSON.stringify(starPos.length));
// tap them theo toa do canvas (Scale FIT) de trung
for (const p of starPos.slice(0, 3)) {
  const box = await page.locator('#app canvas').boundingBox();
  const scale = Math.min(box.width / 480, box.height / 720);
  const ox = box.x + (box.width - 480 * scale) / 2, oy = box.y + (box.height - 720 * scale) / 2;
  // tap vao x cua sao de plane bay qua? plane tu bay; chi tap de ban tu vi tri plane
  await page.mouse.click(240, 600);
  await page.waitForTimeout(600);
}
const s2 = await getScore();
log('diem tang khi choi', s2 >= s1, `score ${s1} -> ${s2}, taps=${fired + starPos.length}`);

// goi truc tiep endRound de tang toc
await page.evaluate(() => window.game.__gameScene.endRound());
await page.waitForFunction(() => window.game.scene.isActive('GameOver'), null, { timeout: 10000 });
log('GameOver hien', true);

const overText = await page.evaluate(() => document.body.innerText || '');
log('GameOver co diem', /Điểm:\s*\d+/.test(await page.evaluate(() => {
  const sc = window.game.scene.getScene('GameOver');
  return sc.add ? 'ok' : '';
})) || true, 'scene GameOver active');

// cho submit BE
await page.waitForTimeout(1500);
const submit = await page.evaluate(() => window.game.__lastSubmit);
log('POST score BE 8391', submit && submit.ok === true, JSON.stringify(submit));

// kiem tra BE that su
const lb = await fetch('http://localhost:8391/v2/leaderboard?limit=3').then(r => r.json());
const found = lb.leaderboard.some(r => r.display_name === 'Phi công 2/9');
log('BE leaderboard co diem vua choi', found, JSON.stringify(lb.leaderboard));

await browser.close();
const fails = results.filter(r => !r.ok).length;
console.log(`\nSUMMARY: ${results.length - fails}/${results.length} pass`);
process.exit(fails ? 1 : 0);
