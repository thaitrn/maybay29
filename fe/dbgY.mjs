import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4392/',{waitUntil:"networkidle"}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(2000);
const pts=[];
await pg.touchscreen.tap(sx(240),sy(300));
for(let t=0;t<=1200;t+=100){ const y=await pg.evaluate(()=>Math.round(window.game.scene.getScene('Game').plane.y)); pts.push(`${t}ms:${y}`); await pg.waitForTimeout(100); }
console.log(pts.join(' | '));
await b.close();
