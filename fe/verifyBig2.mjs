import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
let done=false;
for(let i=0;i<60&&!done;i++){
 const r=await pg.evaluate(()=>{
  const gs=window.game.scene.getScene('Game');
  const st=gs.items.filter(o=>o.kind==='bigstar'&&o.sprite.y>250&&o.sprite.y<550)[0];
  return st?{x:Math.round(st.sprite.x),y:Math.round(st.sprite.y),n:gs.items.filter(o=>o.sprite.visible).length,score:gs.score}:null;
 });
 if(r){ await pg.touchscreen.tap(sx(r.x),sy(r.y)); await new Promise(s=>setTimeout(s,2200));
  const after=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, n:gs.items.filter(o=>o.sprite.visible).length};});
  console.log('TRƯỚC bigstar:', JSON.stringify(r), '| SAU:', JSON.stringify(after));
  done=true;
 } else await new Promise(s=>setTimeout(s,250));
}
if(!done) console.log('bigstar không xuất hiện trong 15s');
await b.close();
