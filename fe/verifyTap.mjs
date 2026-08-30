import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:5174/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>{const r=window.game.scale.canvasBounds; return {x:r.x,y:r.y,w:r.width,h:r.height,gw:window.game.config.width,gh:window.game.config.height};});
console.log('canvas:', JSON.stringify(c));
// nút game-coords (gw/2, 470) → screen
const tx=c.x+(c.w/c.gw)*(c.gw/2), ty=c.y+(c.h/c.gh)*470;
const cdp = await pg.context().newCDPSession(pg);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(tx),y:Math.round(ty)}]});
await new Promise(r=>setTimeout(r,100));
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await pg.waitForTimeout(2000);
const r=await pg.evaluate(()=>{
 const g=window.game;
 const keys=g.scene.getScenes(true).map(s=>s.scene.key);
 const gs=g.scene.getScene('Game');
 return {keys, active: gs&&gs.scene.isActive(), score: gs&&gs.state? gs.state.score : undefined};
});
console.log('sau tap BAY NGAY:', JSON.stringify(r));
await b.close();
