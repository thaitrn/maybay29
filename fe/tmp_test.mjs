import { chromium } from '/Users/thaitrn/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch({headless:true});
const pg = await (await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,permissions:['clipboard-read','clipboard-write']})).newPage();
await pg.goto('https://thaitrn.github.io/maybay29/',{waitUntil:'load'});
await pg.waitForTimeout(3000);
console.log('title:', await pg.title());
const errs=[]; pg.on('pageerror',e=>errs.push(String(e).slice(0,100)));
console.log('canvas:', JSON.stringify(await pg.evaluate(()=>window.game.scale.canvasBounds)));
await b.close();
