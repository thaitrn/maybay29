import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,100)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
// menu: đèn lồng
const menu=await pg.evaluate(()=>({lanterns: window.game.scene.getScene('Menu').children.list.filter(o=>o.texture&&o.texture.key==='lantern').length}));
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
// vào game: kiểm decor + kéo máy bay
const d0=await pg.evaluate(()=>{
 const gs=window.game.scene.getScene('Game');
 return {banner: !!gs.children.list.find(o=>o.texture&&o.texture.key==='banner'), hanoiTiles: gs.children.list.filter(o=>o.texture&&o.texture.key==='hanoi').length, plane:{x:Math.round(gs.plane.x),y:Math.round(gs.plane.y)}, score:gs.score};
});
// kéo ngón: touchstart+move bằng evaluate gọi handler + mô phỏng pointer
await pg.evaluate(()=>{
 const gs=window.game.scene.getScene('Game');
 gs.setTarget&&gs.setTarget(300,200);
});
await new Promise(r=>setTimeout(r,900));
const d1=await pg.evaluate(()=>{
 const gs=window.game.scene.getScene('Game');
 return {plane:{x:Math.round(gs.plane.x),y:Math.round(gs.plane.y)}, score:gs.score, timeLeft:Math.round(gs.timeLeft)};
});
await new Promise(r=>setTimeout(r,3000));
const d2=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {plane:{x:Math.round(gs.plane.x),y:Math.round(gs.plane.y)}, score:gs.score};});
console.log(JSON.stringify({menu, d0, sauKeo:d1, sauThe3s:d2, errs:errs.length}));
await b.close();
