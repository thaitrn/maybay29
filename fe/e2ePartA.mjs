// E2E PHẦN A: vào game bằng UI thật (tap BAY NGAY), kiểm texture mới + anim + drag 3 vị trí + ăn sao + 0 pageerror
import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})).newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('http://localhost:4391/',{waitUntil:'load'}); await pg.waitForTimeout(3000);
const c=await pg.evaluate(()=>window.game.scale.canvasBounds);
const sx=(gx)=>Math.round(c.x+(c.width/480)*gx), sy=(gy)=>Math.round(c.y+(c.height/720)*gy);
// tap BAY NGAY qua UI thật
await pg.touchscreen.tap(sx(240),sy(470)); await pg.waitForTimeout(1500);
const s1=await pg.evaluate(()=>{const g=window.game.scene.getScene('Game');return {key:g?g.scene.key:'none'}});
console.log('scene:',s1.key);
const getPlane=`(() => window.game.__gameScene ? window.game.__gameScene.plane : window.game.scene.getScene('Game').children.list.find(o=>o.texture&&o.texture.key==='gf-plane'))()`;
const planeInfo=await pg.evaluate(`(() => { const p=${getPlane}; return {texture:p.texture.key,scaleX:p.scaleX,f0:p.frame.name,playing:p.anims?p.anims.isPlaying:null,animKey:p.anims?p.anims.key:null}; })()`);
console.log('plane:',JSON.stringify(planeInfo));
await pg.waitForTimeout(400);
const f1=await pg.evaluate(`${getPlane}.frame.name`);
console.log('frame after 400ms:',f1,'(f0 was',planeInfo.f0+')');
// drag 3 vị trí
for (const [tx,ty] of [[360,300],[120,200],[240,420]]) {
  await pg.touchscreen.tap(sx(tx),sy(ty)); await pg.waitForTimeout(900);
  const p=await pg.evaluate(`(() => { const q=${getPlane}; return {x:Math.round(q.x),y:Math.round(q.y)}; })()`);
  console.log('drag to',tx,ty,'-> plane',JSON.stringify(p));
}
// ăn sao: kéo item về máy bay, chờ điểm tăng
const r=await pg.evaluate(`(async () => {
  const g=window.game.scene.getScene('Game');
  const before=g.score;
  for (let i=0;i<40;i++){
    const it=g.items&&g.items.find(x=>x.kind!=='smoke'&&x.sprite.active);
    const p=${getPlane};
    if(it){it.sprite.setPosition(p.x,p.y);} else {g.spawnItem&&g.spawnItem();}
    await new Promise(res=>setTimeout(res,100));
    if(g.score>before) break;
  }
  return {before,after:g.score};
})()`);
console.log('score:',JSON.stringify(r));
const texs=await pg.evaluate(()=>{const t=window.game.scene.getScene('Game').textures;return ['star','bigstar','smoke','clock'].map(k=>k+':'+t.get(k).getSourceImage().width+'px')});
console.log('pickup textures:',texs.join(' '));
await pg.waitForTimeout(500);
console.log('pageerrors:',errs.length, errs.slice(0,3));
console.log('VERDICT:', s1.key==='Game' && planeInfo.texture==='gf-plane' && f1!==planeInfo.f0 && r.after>r.before && errs.length===0 ? 'PHAN_A_PASS' : 'PHAN_A_FAIL');
await b.close();
