// E2E QA: (1) máy bay hiện ngay không chạm — sau 1s plane x>60 visible dispW~70
// (2) drag 3 vị trí theo ngón; fps; 0 pageerror
import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,120)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(2500);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const toScr=(gx,gy)=>({x:Math.round(c.x+(c.width/480)*gx),y:Math.round(c.y+(c.height/720)*gy)});
// vào game (tap menu) nhưng KHÔNG chạm gì sau đó
await pg.touchscreen.tap(toScr(240,470).x,toScr(240,470).y);
await pg.waitForTimeout(1000); // đúng 1s sau
const gs0=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game');
  if(!gs||!gs.scene.isActive()) return {active:false};
  return {active:true, x:Math.round(gs.planeX), y:Math.round(gs.planeY),
    visible:gs.plane.visible, dispW:Math.round(gs.plane.displayWidth), targetX:Math.round(gs.targetX), introDone:gs.introDone};});
// fps đo 2s
const fps=await pg.evaluate(async()=>{let n=0; const t0=performance.now();
  const cb=()=>{n++; if(performance.now()-t0<2000) requestAnimationFrame(cb);}; requestAnimationFrame(cb);
  await new Promise(r=>setTimeout(r,2100)); return Math.round(n/((performance.now()-t0)/1000));});
// drag 3 vị trí theo ngón — target = ngón - 36px y, clamp
const dragTo=async(gx,gy,hold=800)=>{
  const p=toScr(gx,gy);
  await pg.mouse.move(p.x,p.y); await pg.mouse.down();
  await pg.waitForTimeout(hold);
  const st=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game');
    return {px:Math.round(gs.planeX),py:Math.round(gs.planeY),tx:Math.round(gs.targetX),ty:Math.round(gs.targetY)};});
  await pg.mouse.up();
  return st;
};
const d1=await dragTo(200,300);
const d2=await dragTo(400,500);
const d3=await dragTo(100,200);
console.log(JSON.stringify({after1sNoTouch:gs0, fps, drags:[d1,d2,d3], pageerrors:errs},null,1));
await b.close();
