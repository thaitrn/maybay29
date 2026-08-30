
import { chromium } from 'playwright';
const errors = [];
const b = await chromium.launch();
const pg = await b.newPage();
pg.on('pageerror', e => errors.push(String(e)));
await pg.goto('http://localhost:4391/');
await pg.waitForTimeout(1500);

const menuLanterns = await pg.evaluate(() => {
  const scene = window.game.scene.getScene('Menu');
  return scene ? scene.children.list.filter(c => c.name === 'vnLantern').length : -1;
});

await pg.evaluate(() => { window.game.scene.getScene('Menu').scene.start('Game'); });
await pg.waitForTimeout(1200);

const snap = () => pg.evaluate(() => {
  const sc = window.game.scene.getScene('Game');
  const banner = sc.children.list.find(c => c.name === 'vnBanner');
  const tiles = sc.children.list.filter(c => c.texture && c.texture.key === 'hanoi');
  const lanterns = sc.children.list.filter(c => c.name === 'vnLantern');
  return { bannerX: banner?.x, bannerAngle: +banner?.angle.toFixed(2), tile0: +tiles[0]?.x.toFixed(1), tile1: +tiles[1]?.x.toFixed(1), lanterns: lanterns.length };
});

const s1 = await snap();
await pg.waitForTimeout(3000);
const s2 = await snap();

await pg.evaluate(() => {
  const sc = window.game.scene.getScene('Game');
  sc['hitStreak'] = 3; // combo x2
  sc['lastComboForLantern'] = 1;
});
await pg.waitForTimeout(400);
const s3 = await snap();
await pg.waitForTimeout(1500);
const s4 = await pg.evaluate(() => {
  const sc = window.game.scene.getScene('Game');
  const ls = sc.children.list.filter(c => c.name === 'vnLantern');
  return { count: ls.length, ys: ls.map(l => Math.round(l.y)), alphas: ls.map(l => +l.alpha.toFixed(2)) };
});

console.log(JSON.stringify({ menuLanterns, t0: s1, t3s: s2, comboLanterns: s3, lanternRising: s4, pageErrors: errors }));
await b.close();
