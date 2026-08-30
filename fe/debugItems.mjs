import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(2000);
const info=await pg.evaluate(()=>{
 const gs=window.game.scene.getScene('Game');
 return {itemsLen: gs.items.length, sample: gs.items.slice(0,5).map(it=>({kind:it.kind,x:Math.round(it.sprite.x),y:Math.round(it.sprite.y),tex:it.sprite.texture.key,vis:it.sprite.visible}))};
});
console.log(JSON.stringify(info,null,1));
await b.close();
