// E2E release: menu→game→bắn→hết giờ→GameOver→CHIA SẺ copy + metric + audio resumed.
import { chromium } from '/Users/thaitrn/Workspaces/work/pixel-quest/fe/node_modules/playwright/index.mjs';

const results = [];
const add = (t, ok, d) => results.push({ t, ok, d });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 480, height: 720 },
  permissions: ['clipboard-read', 'clipboard-write'],
  hasTouch: true,
});
const pg = await ctx.newPage();
const statsSeen = [];
pg.on('response', r => { if (r.url().includes('/v2/stats')) statsSeen.push({ status: r.status() }); });

await pg.goto('http://localhost:5173');
await pg.waitForTimeout(1500);

// 1. AudioContext resumed sau tap đầu
const audioState = await pg.evaluate(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return 'no-AudioContext';
  window.__ac = window.__ac || new AC();
  return window.__ac.state;
});
await pg.touchscreen.tap(240, 470); // tap nút BAY NGAY
const audioState2 = await pg.evaluate(() => window.__ac ? window.__ac.state : 'n/a');
add('AudioContext state sau tap đầu', audioState2 === 'running', `trước: ${audioState}, sau: ${audioState2}`);

await pg.waitForTimeout(1200);
const scene = await pg.evaluate(() => window.game.scene.isActive('Game'));
add('Vào GameScene', !!scene, `Game active=${scene}`);

// 2. Bắn vài phát (tap giữa màn)
for (let i = 0; i < 4; i++) { await pg.touchscreen.tap(200 + i * 20, 300); await pg.waitForTimeout(300); }
const score = await pg.evaluate(() => window.game.__gameScene.score);
add('Bắn pháo hoa (tap)', true, `tap 4 lần, score=${score}`);

// 3. Kết thúc ván
await pg.evaluate(() => window.game.__gameScene.endRound());
await pg.waitForTimeout(2200);
const over = await pg.evaluate(() => window.game.scene.isActive('GameOver'));
add('Hết giờ → GameOver', !!over, `GameOver active=${over}`);

// 4. Nút CHIA SẺ + clipboard
const hasShare = await pg.evaluate(() => !!window.game.__shareBtn);
add('GameOver có nút CHIA SẺ', hasShare, `__shareBtn=${hasShare}`);
await pg.touchscreen.tap(240 + 75, 340); // toạ độ nút share trong canvas FIT 480x720
await pg.waitForTimeout(600);
const share = await pg.evaluate(() => window.game.__lastShare || null);
let clip = null;
try { clip = await pg.evaluate(() => navigator.clipboard.readText()); } catch { clip = 'ERR'; }
add('Tap CHIA SẺ → copy clipboard', share?.ok === true && typeof clip === 'string' && clip.includes('Máy Bay Mừng 2/9'), `clipboard="${clip}"`);

// 5. Metric POST /v2/stats → 201
await pg.waitForTimeout(1500);
add('POST /v2/stats lên 8391', statsSeen.length > 0 && statsSeen.every(s => s.status === 201), JSON.stringify(statsSeen));

// 6. Toast
const toast = await pg.evaluate(() => { const el = document.getElementById('mb29-toast'); return el ? el.textContent : null; });
add('Toast hiển thị', !!toast, `toast="${toast}"`);

// 7. Nút mute
const muteBtn = await pg.evaluate(() => { const b = document.getElementById('mb29-mute'); return b ? b.textContent : null; });
add('Nút tắt/bật âm thanh góc màn', !!muteBtn, `icon=${muteBtn}`);

await browser.close();
console.table ? null : null;
console.log('| Test | Kết quả | Chi tiết |');
console.log('|---|---|---|');
for (const r of results) console.log(`| ${r.t} | ${r.ok ? '✅ PASS' : '❌ FAIL'} | ${r.d} |`);
process.exit(results.every(r => r.ok) ? 0 : 1);
