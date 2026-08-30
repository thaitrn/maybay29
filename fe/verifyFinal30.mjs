import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,100)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(2000);
const st=async()=>await pg.evaluate(()=>{
 const gs=window.game.scene.getScene('Game');
 return {active: gs.scene.isActive(), planeX: Math.round(gs.planeX||0), planeY: Math.round(gs.planeY||0), score: gs.score, t: Math.round(gs.timeLeft), bannerContainer: !!gs.vnDecor, shells: gs.shells.length};
});
console.log('vừa vào:', JSON.stringify(await st()));
// kéo bằng pointer thật: touchstart tại (100,400) rồi move
const cdp = await pg.context().newCDPSession(pg);
async function tap(x,y){ await pg.touchscreen.tap(x,y); }
// dùng mouse (input pointer chung)
await pg.mouse.move(sx(100),sy(400)); await pg.mouse.down();
for(let i=1;i<=8;i++){ await pg.mouse.move(sx(100+i*25),sy(400-i*20)); await new Promise(r=>setTimeout(r,80)); }
await pg.mouse.up();
await new Promise(r=>setTimeout(r,800));
console.log('sau kéo:', JSON.stringify(await st()));
await new Promise(r=>setTimeout(r,3000));
console.log('sau 3s thả:', JSON.stringify(await st()));
console.log('errs:', errs.length);
await b.close();
