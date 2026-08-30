import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); gs.timeLeft=0.05;});
await pg.waitForTimeout(2500);
// share qua emit pointerdown trên nút
const shared=await pg.evaluate(async ()=>{
 const s=window.game.scene.getScene('GameOver');
 const btns=s.children.list.filter(o=>o.text&&String(o.text).includes('CHIA SẼ'));
 if(!btns.length) return {err:'no share btn', texts:s.children.list.filter(o=>o.text).map(o=>o.text)};
 btns[0].emit('pointerdown');
 await new Promise(r=>setTimeout(r,600));
 let clip='READ_FAIL';
 try{ clip=await navigator.clipboard.readText(); }catch(e){}
 return {clip, toast: document.body.innerText.includes('Đã copy')};
});
console.log('share:', JSON.stringify(shared));
await b.close();
