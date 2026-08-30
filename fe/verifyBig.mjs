import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,80)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
// chờ bigstar rơi xuống tầm giữa rồi bắn
let hit=false, scores=[];
for(let i=0;i<40&&!hit;i++){
 const bs=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); const st=gs.items.filter(o=>o.kind==='bigstar'&&o.sprite.y>200)[0]; return st?{x:Math.round(st.sprite.x),y:Math.round(st.sprite.y)}:null;});
 if(bs){ await pg.touchscreen.tap(sx(bs.x),sy(bs.y)); hit=true; await new Promise(r=>setTimeout(r,2500)); }
 else await new Promise(r=>setTimeout(r,300));
}
const st=await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); return {score:gs.score, items:gs.items.filter(o=>o.sprite.visible).length};});
// perfect round: hết giờ
await pg.evaluate(()=>{const gs=window.game.scene.getScene('Game'); gs.timeLeft=0.05;});
await pg.waitForTimeout(2500);
const go=await pg.evaluate(()=>{
 const s=window.game.scene.getScene('GameOver');
 return {scene:'GameOver', perfect: s.children.list.some(o=>o.text&&String(o.text).includes('HOÀN HẢO'))};
});
console.log(JSON.stringify({bigstarHit:hit, after:st, gameover:go, errs:errs.length}));
await b.close();
