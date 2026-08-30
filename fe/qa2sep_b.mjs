import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await pg.goto('https://thaitrn.github.io/maybay29/',{waitUntil:'load'});
await pg.waitForTimeout(3000);
const c = await pg.evaluate(() => window.game.scale.canvasBounds);
const sx = gx => Math.round(c.x + (c.width/480)*gx);
const sy = gy => Math.round(c.y + (c.height/720)*gy);
const snap = () => pg.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  return { lives: s.lives, score: s.score, planeX: Math.round(s.planeX||0), planeY: Math.round(s.planeY||0),
           hitStreak: s.hitStreak !== undefined ? s.hitStreak : null,
           tileX: s.vnDecor && s.vnDecor.bgTiles && s.vnDecor.bgTiles[0] ? +(s.vnDecor.bgTiles[0].tilePositionX||0).toFixed(2) : null,
           tilesAll: s.vnDecor && s.vnDecor.bgTiles ? s.vnDecor.bgTiles.map(t=>+(t.tilePositionX||0).toFixed(1)) : null };
});
await pg.touchscreen.tap(sx(240), sy(470));
await pg.waitForTimeout(1500);

// (2-retry) drag bằng touch-CDP pointer, bù offset ngón-máy bay: cầm tại đúng planeX/planeY rồi kéo
const cdp = await pg.context().newCDPSession(pg);
async function dragTo(targetGy, label) {
  const cur = await snap();
  const x = cur.planeX, y0 = cur.planeY;
  await pg.mouse.move(sx(x), sy(y0)); await pg.mouse.down();
  for (let i = 1; i <= 15; i++) { await pg.mouse.move(sx(x), sy(y0 + (targetGy - y0) * i / 15)); await pg.waitForTimeout(50); }
  await pg.waitForTimeout(300);
  const during = await snap();
  await pg.mouse.up();
  await pg.waitForTimeout(1500);
  const p1 = await snap(); await pg.waitForTimeout(300); const p2 = await snap();
  const drift = Math.abs(p2.planeY - p1.planeY);
  console.log(`(2${label}) target=${targetGy} planeY hold=${during.planeY} after=${p1.planeY} Δ=${drift}px -> hold ${Math.abs(during.planeY-targetGy)<=20?'PASS':'FAIL'} | stationary ${drift<2?'PASS':'FAIL'}`);
}
await dragTo(80, '-top');
await dragTo(360, '-mid');
await dragTo(700, '-bot');

// (4-retry) 4 phát liên tiếp, kiểm tra mức tăng
const st0 = await snap();
const scores = [];
for (let i = 0; i < 4; i++) {
  let t = null;
  for (let k = 0; k < 15 && !t; k++) {
    t = await pg.evaluate(() => {
      const gs = window.game.scene.getScene('Game');
      const st = gs.items.filter(o => o.sprite && o.sprite.texture.key === 'star' && o.sprite.visible && o.sprite.y > 60 && o.sprite.y < 660)[0];
      return st ? { x: Math.round(st.sprite.x), y: Math.round(st.sprite.y) } : null;
    });
    if (!t) await pg.waitForTimeout(300);
  }
  if (!t) { scores.push('miss'); continue; }
  await pg.touchscreen.tap(sx(t.x), sy(t.y));
  await pg.waitForTimeout(600);
  const s = await snap(); scores.push(s.score);
}
console.log(`(4) scores ${st0.score} -> ${scores.join(',')} streak=${(await snap()).hitStreak}`);

// (5-retry + 6b tile) — bắn trượt reset combo trước; đủ 6 hit khói cho hết mạng
const hitSmoke = () => pg.evaluate(() => { const s = window.game.scene.getScene('Game'); s.hitSmoke(s.planeX, s.planeY); });
await hitSmoke(); await pg.waitForTimeout(150); console.log('(5a) lives=' + (await snap()).lives);
await hitSmoke(); await pg.waitForTimeout(120); console.log('(5b) lives=' + (await snap()).lives);
for (let i = 3; i <= 6; i++) { await pg.waitForTimeout(1150); await hitSmoke(); await pg.waitForTimeout(200); console.log(`(5c#${i}) lives=` + (await snap()).lives); }
await pg.waitForTimeout(2200);
const over = await pg.evaluate(() => {
  const g = window.game; const sc = g.scene.getScene('GameOver');
  const texts = sc ? sc.children.list.filter(ch => ch.text !== undefined).map(ch => ch.text) : [];
  return { active: !!sc && sc.scene.isActive(), texts, lastSubmit: g.__lastSubmit ?? null };
});
console.log(`(5d) GameOver active=${over.active} texts=${JSON.stringify(over.texts).slice(0,100)}`);
console.log(`(5e) __lastSubmit=${JSON.stringify(over.lastSubmit)}`);
// (6b) parallax tile của scene mới
await pg.evaluate(() => { window.game.scene.getScene('GameOver').scene.start('Game'); });
await pg.waitForTimeout(1000);
const t1 = await snap(); await pg.waitForTimeout(3000); const t2 = await snap();
console.log(`(6b) tiles ${JSON.stringify(t1.tilesAll)} -> ${JSON.stringify(t2.tilesAll)} increased=${JSON.stringify(t2.tilesAll)!==JSON.stringify(t1.tilesAll)}`);
console.log(`(7b) pageerrors=${errs.length} ${errs[0]||''}`);
await b.close(); console.log('DONE');
