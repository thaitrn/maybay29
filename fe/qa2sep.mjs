import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await pg.goto('https://thaitrn.github.io/maybay29/',{waitUntil:'load'});
await pg.waitForTimeout(3000);

// ===== helpers =====
const c = await pg.evaluate(() => window.game.scale.canvasBounds);
const sx = gx => Math.round(c.x + (c.width/480)*gx);
const sy = gy => Math.round(c.y + (c.height/720)*gy);
const gs = () => pg.evaluate(() => window.game.scene.getScene('Game'));
const snap = () => pg.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  return { lives: s.lives, score: s.score, planeX: Math.round(s.planeX||0), planeY: Math.round(s.planeY||0),
           ended: !!s.ended, active: s.scene.isActive(), livesText: s.livesText ? s.livesText.text : null,
           hitStreak: s.hitStreak !== undefined ? s.hitStreak : null,
           tileX: s.vnDecor && s.vnDecor.bgTiles && s.vnDecor.bgTiles[0] ? +(s.vnDecor.bgTiles[0].tilePositionX||0).toFixed(1) : null,
           bannerAngle: s.vnDecor && s.vnDecor.banner ? +(s.vnDecor.banner.angle||0).toFixed(2) : null,
           lanterns: s.vnDecor && s.vnDecor.lanterns ? s.vnDecor.lanterns.length : null };
});

// ===== (1) Menu: 2 lanterns + tap BAY NGAY =====
const menu = await pg.evaluate(() => {
  const m = window.game.scene.getScene('Menu');
  const lant = m.children.list.filter(o => o.texture && o.texture.key === 'lantern');
  const btn = m.children.list.find(o => o.text === 'BAY NGAY');
  return { lanterns: lant.length, btn: !!btn, btnX: btn ? Math.round(btn.x) : null, btnY: btn ? Math.round(btn.y) : null };
});
console.log(`(1a) Menu lanterns = ${menu.lanterns} -> ${menu.lanterns===2 ? 'PASS' : 'FAIL'}`);
if (menu.btn) { await pg.touchscreen.tap(sx(menu.btnX), sy(menu.btnY)); await pg.waitForTimeout(1500); }
const st0 = await snap();
console.log(`(1b) Tap BAY NGAY -> Game active=${st0.active} -> ${st0.active ? 'PASS' : 'FAIL'}`);

// ===== (3) HUD livesText =====
console.log(`(3) livesText="${st0.livesText}" lives=${st0.lives} -> ${st0.livesText==='❤❤❤❤❤' || (st0.lives===5 && /❤/.test(st0.lives||'')) ? 'PASS' : 'FAIL'}`);

// ===== (2) drag plane: top / middle / bottom; release 1.5s stationary =====
async function dragTo(gy, label) {
  const cur = await snap();
  const y0 = Math.max(20, Math.min(700, cur.planeY)), x = 100;
  await pg.mouse.move(sx(x), sy(y0)); await pg.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++) { await pg.mouse.move(sx(x), sy(y0 + (gy - y0) * i / steps)); await pg.waitForTimeout(50); }
  await pg.waitForTimeout(300);
  const during = await snap();
  await pg.mouse.up();
  await pg.waitForTimeout(1500);
  const p1 = await snap(); await pg.waitForTimeout(300); const p2 = await snap();
  const drift = Math.abs(p2.planeY - p1.planeY);
  console.log(`(2${label}) planeY during-hold=${during.planeY} after-release=${p1.planeY} drift(Δ)=${drift}px -> hold ${Math.abs(during.planeY-gy)<=25 ? 'PASS' : 'FAIL'} | stationary ${drift<2 ? 'PASS' : 'FAIL'}`);
}
await dragTo(80, '-top');
await dragTo(360, '-mid');
await dragTo(700, '-bottom');
const btm = await snap();
console.log(`(2-bottom-clamp) planeY at bottom=${btm.planeY} (expect ~560) -> ${Math.abs(btm.planeY-560)<=15 ? 'PASS' : 'FAIL'}`);

// ===== (4) hit 3 stars in a row -> combo score increments =====
const scoreLog = [];
for (let i = 0; i < 3; i++) {
  let t = null;
  for (let k = 0; k < 15 && !t; k++) {
    t = await pg.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      const st = gs.items.filter(o => o.sprite && o.sprite.texture.key === 'star' && o.sprite.visible && o.sprite.y > 60 && o.sprite.y < 660)[0];
      return st ? { x: Math.round(st.sprite.x), y: Math.round(st.sprite.y) } : null;
    });
    if (!t) await pg.waitForTimeout(300);
  }
  if (!t) { scoreLog.push(null); continue; }
  await pg.touchscreen.tap(sx(t.x), sy(t.y));
  await pg.waitForTimeout(500);
  scoreLog.push(await snap());
}
const deltas = [];
for (let i = 1; i < scoreLog.length; i++) if (scoreLog[i] && scoreLog[i-1]) deltas.push(scoreLog[i].score - scoreLog[i-1].score);
const firstInc = scoreLog[0] ? scoreLog[0].score - st0.score : 0;
const allInc = [firstInc, ...deltas].every(d => d > 0);
const notEqual = new Set(deltas).size > 1 || (deltas.length && firstInc !== deltas[0]);
console.log(`(4) scores: start=${st0.score} -> ${scoreLog.map(s=>s?s.score:'miss').join(',')} | incs=[${firstInc},${deltas.join(',')}] streak=${scoreLog[2]?scoreLog[2].hitStreak:'?'} -> allInc ${allInc?'PASS':'FAIL'} | combo-uneven ${notEqual?'PASS':'FAIL'}`);

// ===== (5) smoke hits: invuln then GameOver =====
const hitSmoke = () => pg.evaluate(() => { const s = window.game.scene.getScene('Game'); s.hitSmoke(s.planeX, s.planeY); });
await hitSmoke(); await pg.waitForTimeout(150);
const h1 = await snap();
console.log(`(5a) smoke#1 lives=${h1.lives} -> ${h1.lives===4 ? 'PASS' : 'FAIL'}`);
await hitSmoke(); await pg.waitForTimeout(120);
const h2 = await snap();
console.log(`(5b) smoke#2 immediate lives=${h2.lives} (invuln expect still 4) -> ${h2.lives===4 ? 'PASS' : 'FAIL'}`);
for (let i = 3; i <= 5; i++) { await pg.waitForTimeout(1150); await hitSmoke(); await pg.waitForTimeout(200); const s = await snap(); console.log(`(5c) smoke#${i} lives=${s.lives}`); }
await pg.waitForTimeout(2000);
const over = await pg.evaluate(() => {
  const g = window.game;
  const sc = g.scene.getScene('GameOver');
  const texts = sc ? sc.children.list.filter(c => c.text !== undefined).map(c => c.text) : [];
  return { active: !!sc && sc.scene.isActive(), texts, lastSubmit: g.__lastSubmit ?? null };
});
const fallTitle = over.texts.some(t => String(t).includes('RƠI RỒI'));
console.log(`(5d) GameOver active=${over.active} title RƠI RỒI! ${fallTitle?'PASS':'FAIL'} texts=${JSON.stringify(over.texts).slice(0,120)}`);
console.log(`(5e) __lastSubmit=${JSON.stringify(over.lastSubmit)} -> ${over.lastSubmit && (over.lastSubmit.score!==undefined||over.lastSubmit.name!==undefined) ? 'PASS' : 'FAIL'}`);

// ===== (6) banner angle, parallax, lanterns on hitStreak>=2 =====
await pg.evaluate(() => { const s = window.game.scene.getScene('GameOver'); s.scene.start('Game'); });
await pg.waitForTimeout(1200);
const s1 = await snap();
await pg.waitForTimeout(3100);
const s2 = await snap();
console.log(`(6a) banner angle ${s1.bannerAngle} -> ${s2.bannerAngle} changed=${s2.bannerAngle!==s1.bannerAngle} -> ${s2.bannerAngle!==s1.bannerAngle ? 'PASS' : 'FAIL'}`);
console.log(`(6b) tilePositionX ${s1.tileX} -> ${s2.tileX} increased=${s2.tileX>s1.tileX} -> ${s2.tileX>s1.tileX ? 'PASS' : 'FAIL'}`);
const lan0 = (await snap()).lanterns;
await pg.evaluate(() => { const s = window.game.scene.getScene('Game'); s.hitStreak = 2; });
await pg.waitForTimeout(1500);
const s3 = await snap();
console.log(`(6c) lanterns before=${lan0} after force hitStreak=2 -> ${s3.lanterns} -> ${s3.lanterns>0 ? 'PASS' : 'FAIL'} (streak=${s3.hitStreak})`);

// ===== (7) share button -> clipboard contains "điểm"; pageerrors =====
await pg.evaluate(() => { const s = window.game.scene.getScene('Game'); s.timeLeft = 0.05; });
await pg.waitForTimeout(2500);
const info = await pg.evaluate(() => {
  const s = window.game.scene.getScene('GameOver');
  const out = [];
  const walk = (o, d) => { if (o.text && String(o.text).includes('CHIA S')) out.push({ x: Math.round(o.x), y: Math.round(o.y) }); (o.list || []).forEach(ch => walk(ch, d+1)); };
  s.children.list.forEach(o => walk(o, 0));
  return out;
});
if (info.length) { await pg.touchscreen.tap(sx(info[0].x), sy(info[0].y)); await pg.waitForTimeout(800); }
const clip = await pg.evaluate(() => navigator.clipboard.readText().catch(() => 'READ_FAIL'));
const hasDiem = typeof clip === 'string' && clip.toLowerCase().includes('điểm');
console.log(`(7a) tap CHIA SẺ (${info.length?`btn@${info[0].x},${info[0].y}`:'NOT FOUND'}) clipboard=${JSON.stringify(String(clip).slice(0,80))} -> ${hasDiem ? 'PASS' : 'FAIL'}`);
console.log(`(7b) pageerrors=${errs.length} -> ${errs.length===0 ? 'PASS' : 'FAIL ' + errs[0]}`);
await b.close();
console.log('DONE');
