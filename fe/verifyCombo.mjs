import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,80)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
// bắn trúng 4 sao liên tiếp, ghi score từng bước
const scores=[];
for(let i=0;i<4;i++){
 let t=null;
 for(let k=0;k<10&&!t;k++){
  t=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); const st=gs.items.filter(o=>o.sprite&&o.sprite.texture.key==='star'&&o.sprite.visible&&o.sprite.y>60&&o.sprite.y<660)[0]; return st?{x:Math.round(st.sprite.x),y:Math.round(st.sprite.y)}:null;});
  if(!t) await new Promise(r=>setTimeout(r,300));
 }
 if(!t){scores.push('no-star'); continue;}
 await pg.touchscreen.tap(sx(t.x),sy(t.y));
 await new Promise(r=>setTimeout(r,500));
 scores.push(await pg.evaluate(()=>window.game.scene.getScene('Game').score));
}
// bắn trượt vào góc trống → combo reset
await pg.touchscreen.tap(sx(20),sy(650));
await new Promise(r=>setTimeout(r,400));
const afterMiss=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, combo:gs.comboMult? gs.comboMult(): gs.hits, mult: typeof gs.comboMult==='function'? gs.comboMult():null};});
console.log('scores từng phát:', JSON.stringify(scores), '| sau trượt:', JSON.stringify(afterMiss), 'errs:', errs.length);
await b.close();
