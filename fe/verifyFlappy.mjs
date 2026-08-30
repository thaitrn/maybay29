import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4392/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
// vào Menu -> tap BAY NGAY
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
const getY=()=>pg.evaluate(()=>{const gs=window.game.scene.getScene('Game');return Math.round(gs.plane.y);});
const getShells=()=>pg.evaluate(()=>{const gs=window.game.scene.getScene('Game');return gs.shells.length;});
await pg.waitForTimeout(800);

// (a) FLAP: đo y tại 0s / 0.3s / 1s sau tap
const y0=await getY();
const tc0=await pg.evaluate(()=>window.game.scene.getScene('Game').tapCount);
await pg.touchscreen.tap(sx(240),sy(300));
const yTap=await getY();
const dbg=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game');return {tapCount:gs.tapCount, vy:Math.round(gs.vy), y:Math.round(gs.plane.y)};});
await pg.waitForTimeout(300); const y03=await getY();
await pg.waitForTimeout(700); const y1s=await getY();
console.log(`(a) FLAP  y0=${y0} (tapCount0=${tc0}) | yTap=${yTap} | dbg=${JSON.stringify(dbg)} | y+0.3s=${y03} | y+1s=${y1s}  (nhỏ hơn = bay lên)`);

// (b) TỰ BẮN: không tap 3s -> shell spawns
const s0=await getShells();
await pg.waitForTimeout(3000);
const s1=await getShells();
const score=await pg.evaluate(()=>window.game.scene.getScene('Game').score);
console.log(`(b) AUTO-FIRE  shells trước=${s0}, sau 3s không tap=${s1} (tối đa 6), score=${score}`);

// (c) KÈP VÙNG TRỜI: tap 10 lần liên tiếp -> y >= 80
let minY=9999, lastY;
for(let i=0;i<10;i++){ await pg.touchscreen.tap(sx(240),sy(300)); await pg.waitForTimeout(100); lastY=await getY(); minY=Math.min(minY,lastY); }
console.log(`(c) CLAMP  tap x10: minY=${minY}, yCuối=${lastY} (>=80: ${minY>=80})`);

// (d) BIGSTAR/combo: đợi bigstar gần thẳng hàng máy bay rồi quan sát điểm (pháo tự bắn trúng)
let done=false;
for(let i=0;i<400&&!done;i++){
 const r=await pg.evaluate(()=>{
  const gs=window.game.scene.getScene('Game');
  const px=Math.round(gs.plane.x);
  const bs=gs.items.find(o=>o.kind==='bigstar'&&Math.abs(o.sprite.x-px)<55&&o.sprite.y>150&&o.sprite.y<560&&o.sprite.y>gs.plane.y);
  return bs?{score:gs.score, starN:gs.items.filter(o=>o.kind==='star').length, px}:null;
 });
 if(r){ const scoreTruoc=r.score;
  await new Promise(s=>setTimeout(s,2500));
  const after=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, starN:gs.items.filter(o=>o.kind==='star').length, streak:gs.hitStreak};});
  console.log(`(d) BIGSTAR thẳng hàng — score trước=${scoreTruoc} | sau=${after.score} (sao còn=${after.starN}, streak=${after.streak})`);
  done=true;
 } else await new Promise(s=>setTimeout(s,150));
}
if(!done) console.log('(d) không bắt được timing bigstar (thử lại nếu cần)');

// hint hiển thị? (đã quá 2s lúc này — chỉ ghi nhận cơ chế tồn tại qua log)
await b.close();
