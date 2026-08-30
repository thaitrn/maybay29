import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); gs.timeLeft=0.05;});
await pg.waitForTimeout(2500);
// đọc vị trí text CHIA SẾ trong tree (kể cả container)
const info=await pg.evaluate(()=>{
 const s=window.game.scene.getScene('GameOver');
 const out=[];
 const walk=(o,depth)=>{ if(o.text&&String(o.text).includes('CHIA S')) out.push({d:depth,x:Math.round(o.x),y:Math.round(o.y),parent:o.parentContainer?'container':'scene'}); (o.list||[]).forEach(ch=>walk(ch,depth+1)); };
 s.children.list.forEach(o=>walk(o,0));
 return out;
});
console.log('share text pos:', JSON.stringify(info));
if(info.length){ const t=info[0]; await pg.touchscreen.tap(sx(t.x),sy(t.y)); await pg.waitForTimeout(700); }
const clip=await pg.evaluate(()=>navigator.clipboard.readText().catch(()=>'READ_FAIL'));
console.log('clipboard:', JSON.stringify(clip.slice(0,80)));
await b.close();
