import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
console.log('bounds:', JSON.stringify(c));
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
// bắn rải + theo dõi vị trí sao để bắn trúng
for(let i=0;i<10;i++){
 const items=await pg.evaluate(()=>{
  const gs=window.game.scene.getScene('Game');
  const stars=gs.children.list.filter(o=>o.texture&&o.texture.key==='star'&&o.visible).map(o=>({x:Math.round(o.x),y:Math.round(o.y)}));
  return stars.slice(0,3);
 });
 if(items.length){
  const t=items[0];
  await pg.touchscreen.tap(sx(t.x),sy(t.y));
 } else await pg.touchscreen.tap(sx(240),sy(300));
 await new Promise(r=>setTimeout(r,450));
}
const st=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score,t:Math.round(gs.timeLeft)};});
console.log('sau 10 phát nhắm sao:', JSON.stringify(st));
await b.close();
