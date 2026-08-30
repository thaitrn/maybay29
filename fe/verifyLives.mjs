import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,100)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1800);
const hud=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {lives:gs.lives, text: gs.livesText? gs.livesText.text:'?'};});
// kéo xuống đáy kiểm 560
await pg.mouse.move(sx(240),sy(660)); await pg.mouse.down(); await pg.mouse.up();
await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); gs.setTarget&&0;});
const low=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return Math.round(gs.planeY);});
console.log('HUD:', JSON.stringify(hud), '| kéo đáy → planeY:', low, 'errs:', errs.length);
await b.close();
