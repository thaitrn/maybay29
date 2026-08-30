import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,80)));
await pg.goto('http://localhost:5174/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const cdp = await pg.context().newCDPSession(pg);
const gw=480, gh=720;
const toScr=(gx,gy)=>({x:Math.max(1,Math.round(c.x+(c.w/gw)*gx)),y:Math.max(1,Math.round(c.y+(c.h/gh)*gy))});
// vào game
let p=toScr(240,470);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
await new Promise(r=>setTimeout(r,100));
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await pg.waitForTimeout(1500);
// tap bắn 6 phát tại giữa màn
for(let i=0;i<6;i++){
 const q=toScr(240,360);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});
 await new Promise(r=>setTimeout(r,90));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await new Promise(r=>setTimeout(r,400));
}
const st=await pg.evaluate(()=>{
 const gs=window.game.scene.getScene('Game');
 return {active:gs.scene.isActive(), score: gs.state? gs.state.score : 'no-state', timeLeft: gs.state? Math.round(gs.state.timeLeft??-1) : '?'};
});
console.log('game state sau 6 phát bắn:', JSON.stringify(st), 'errs:', errs.length);
await b.close();
