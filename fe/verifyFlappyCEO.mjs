import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,80)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
const y0=await pg.evaluate(()=>Math.round(window.game.scene.getScene('Game').plane.y));
// flap 3 lần
for(let i=0;i<3;i++){ await pg.touchscreen.tap(sx(240),sy(200)); await new Promise(r=>setTimeout(r,150)); }
const y1=await pg.evaluate(()=>Math.round(window.game.scene.getScene('Game').plane.y));
await new Promise(r=>setTimeout(r,1200));
const y2=await pg.evaluate(()=>Math.round(window.game.scene.getScene('Game').plane.y));
// auto-fire 3s không tap
const s0=await pg.evaluate(()=>window.game.scene.getScene('Game').score);
await new Promise(r=>setTimeout(r,3000));
const s1=await pg.evaluate(()=>window.game.scene.getScene('Game').score);
console.log(JSON.stringify({flap:{y0,ySau3Tap:y1,yChungXuong:y2}, autofireScore:{s0,s1}, errs:errs.length}));
await b.close();
