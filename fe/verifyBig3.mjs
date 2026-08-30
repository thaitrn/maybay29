import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
let done=false;
for(let i=0;i<80&&!done;i++){
 const r=await pg.evaluate(()=>{
  const gs=window.game.scene.getScene('Game');
  const bs=gs.items.filter(o=>o.kind==='bigstar'&&o.sprite.y>250&&o.sprite.y<550)[0];
  if(!bs) return null;
  // các item khác có gần bigstar không (trong pad 40)?
  const near=gs.items.some(o=>o!==bs&&Math.abs(o.sprite.x-bs.sprite.x)<74&&Math.abs(o.sprite.y-bs.sprite.y)<74);
  return near? null : {x:Math.round(bs.sprite.x),y:Math.round(bs.sprite.y),n:gs.items.filter(o=>o.sprite.visible).length,score:gs.score};
 });
 if(r){ await pg.touchscreen.tap(sx(r.x),sy(r.y)); await new Promise(s=>setTimeout(s,2500));
  const after=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, n:gs.items.filter(o=>o.sprite.visible).length};});
  console.log('CÔ LẬP — trước:', JSON.stringify(r), 'sau:', JSON.stringify(after));
  done=true;
 } else await new Promise(s=>setTimeout(s,200));
}
if(!done) console.log('không có bigstar cô lập trong ~16s');
await b.close();
