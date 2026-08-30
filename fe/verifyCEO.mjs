import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,80)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const toScr=(gx,gy)=>({x:Math.round(c.x+(c.width/480)*gx),y:Math.round(c.y+(c.height/720)*gy)});
// audio unlock + vào game
await pg.touchscreen.tap(toScr(240,470).x,toScr(240,470).y);
await pg.waitForTimeout(1500);
const audio=await pg.evaluate(()=>{const el=document.querySelector('audio'); const ac=window.__audioCtx||document.__audioCtx; return {ctx: ac? ac.state : (window.AudioContext? 'check-dom':'none'), muteBtn: !!document.querySelector('[data-mute]')||document.body.innerHTML.includes('🔊')};});
// bắn
for(let i=0;i<6;i++){ await pg.touchscreen.tap(toScr(240,360).x,toScr(240,360).y); await new Promise(r=>setTimeout(r,400)); }
const st=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return gs&&gs.scene? {score:gs.score,t:Math.round(gs.timeLeft)}:null;});
// hết giờ
await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); if(gs) gs.timeLeft=0.05;});
await pg.waitForTimeout(2500);
const go=await pg.evaluate(()=>window.game.scene.getScenes(true).map(s=>s.scene.key));
// share
await pg.evaluate(()=>{const s=window.game.scene.getScene('GameOver'); if(s&&s.__shareBtn) s.__shareBtn.emit('pointerdown');});
await pg.waitForTimeout(800);
const clip=await pg.evaluate(()=>navigator.clipboard.readText().catch(()=>'READ_FAIL'));
console.log(JSON.stringify({audio, afterShoot:st, scenes:go, clipboard:clip, errs:errs.length}));
await b.close();
