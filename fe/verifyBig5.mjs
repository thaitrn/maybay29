import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
let done=false;
for(let i=0;i<160&&!done;i++){
 const r=await pg.evaluate(()=>{
  const gs=window.game.scene.getScene('Game');
  const px=Math.round(gs.plane.x);
  const bs=gs.items.find(o=>o.kind==='bigstar'&&Math.abs(o.sprite.x-px)<30&&o.sprite.y>150&&o.sprite.y<600);
  return bs?{score:gs.score, starN:gs.items.filter(o=>o.kind==='star').length, px}:null;
 });
 if(r){ await pg.touchscreen.tap(sx(240),sy(300)); await new Promise(s=>setTimeout(s,2200));
  const after=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, starN:gs.items.filter(o=>o.kind==='star').length};});
  console.log('bigstar thẳng hàng máy bay — trước:', JSON.stringify(r), '| sau:', JSON.stringify(after));
  done=true;
 } else await new Promise(s=>setTimeout(s,150));
}
if(!done) console.log('không bắt được timing');
await b.close();
