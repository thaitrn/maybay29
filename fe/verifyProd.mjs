import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,80)));
await pg.goto('https://thaitrn.github.io/maybay29/',{waitUntil:'load'}); await pg.waitForTimeout(4000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
// bắn nhắm sao
for(let i=0;i<8;i++){
 const t=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); const st=gs.children.list.filter(o=>o.texture&&o.texture.key==='star'&&o.visible)[0]; return st?{x:Math.round(st.x),y:Math.round(st.y)}:null;});
 if(t) await pg.touchscreen.tap(sx(t.x),sy(t.y)); else await pg.touchscreen.tap(sx(240),sy(300));
 await new Promise(r=>setTimeout(r,450));
}
const st=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score,t:Math.round(gs.timeLeft)};});
await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); gs.timeLeft=0.05;});
await pg.waitForTimeout(3000);
const go=await pg.evaluate(()=>window.game.scene.getScenes(true).map(s=>s.scene.key));
console.log('PROD e2e:', JSON.stringify({score:st.score, scenes:go, errs:errs.length}));
await b.close();
