import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
// chờ bigstar + cho rơi xuống rồi bắn THẲNG TÂM nó nhiều lần liên tiếp (nhanh)
let done=false;
for(let i=0;i<80&&!done;i++){
 const r=await pg.evaluate(()=>{
  const gs=window.game.scene.getScene('Game');
  const bs=gs.items.find(o=>o.kind==='bigstar'&&o.sprite.y>200&&o.sprite.y<520);
  return bs?{x:Math.round(bs.sprite.x),y:Math.round(bs.sprite.y),score:gs.score,starN:gs.items.filter(o=>o.kind==='star').length}:null;
 });
 if(r){
  for(let k=0;k<4;k++){ await pg.touchscreen.tap(sx(r.x),sy(r.y)); await new Promise(s=>setTimeout(s,250)); const bs2=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); const q=gs.items.find(o=>o.kind==='bigstar'); return q?Math.round(q.sprite.y):-1;}); if(bs2<0) break; }
  await new Promise(s=>setTimeout(s,2500));
  const after=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, starN:gs.items.filter(o=>o.kind==='star').length};});
  console.log('bigstar trước:', JSON.stringify(r), '| sau:', JSON.stringify(after));
  done=true;
 } else await new Promise(s=>setTimeout(s,200));
}
if(!done) console.log('no bigstar');
await b.close();
