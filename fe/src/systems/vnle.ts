import Phaser from 'phaser';

/** Yếu tố design VN lễ hội 2/9 — texture 100% code (docs/design-vn-le.md). */
export const VN = {
  red: 0xda251d, yellow: 0xffff00, gold: 0xffc107, blue: 0x1b7fa8,
  orange: 0xe8763a, cream: 0xf5e9d0, charcoal: 0x2b2118, pink: 0xf2668b,
};

/** Sinh 3 texture: 'banner' (360x64), 'hanoi' (960x220), 'lantern' (44x72). */
export function createVnTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  // BĂNG RÔN: dải đỏ cong viền vàng (chữ add bằng Text ở scene)
  g.fillStyle(VN.red, 1); g.fillRect(0, 8, 360, 44);
  g.fillTriangle(0, 8, 0, 52, -0, 0); // mép trái nhẹ
  g.lineStyle(3, VN.gold, 1); g.strokeRect(1.5, 9.5, 357, 41);
  g.lineStyle(1.5, VN.yellow, 0.9); g.strokeRect(6, 14, 348, 31);
  // 2 đầu buộc dây (nơ vàng)
  g.fillStyle(VN.gold, 1);
  g.fillRect(0, 14, 8, 32); g.fillRect(352, 14, 8, 32);
  g.generateTexture('banner', 360, 60);
  g.clear();

  // HÀ NỘI SILHOUETTE 960x220 — đen than #2B2118
  const S = 0x241c15; // đen than pha xanh đêm
  // === lăng Bác (x~120): 3 khối bậc + cột + mái ===
  g.fillStyle(S, 1);
  g.fillRect(60, 170, 130, 50);            // bậc 1
  g.fillRect(78, 140, 94, 34);             // bậc 2
  g.fillRect(96, 112, 58, 32);             // bậc 3 (chính giữa)
  g.fillRect(108, 88, 34, 26);             // phần trên
  g.fillTriangle(112, 88, 138, 70, 164, 88); // mái tam giác
  g.fillRect(116, 64, 4, 24); g.fillRect(136, 64, 4, 24); // cột
  g.fillRect(112, 60, 32, 6);              // xà
  // === tháp Rùa (x~330): tháp cổ nhỏ 4 tầng ===
  g.fillRect(310, 160, 44, 60);
  g.fillRect(314, 130, 36, 32);
  g.fillRect(318, 104, 28, 28);
  g.fillRect(322, 82, 20, 24);
  g.fillTriangle(322, 82, 332, 68, 342, 82);
  // cửa vòm tháp
  g.fillStyle(0x1b2a33, 1);
  g.fillRect(326, 140, 10, 18);
  // === cầu Long Biên (x~430..940): dãy cột + dây vòm ===
  g.fillStyle(S, 1);
  g.fillRect(430, 196, 510, 24);           // dầm dưới
  for (let i = 0; i < 7; i++) {
    const px = 450 + i * 74;
    g.fillRect(px, 130, 6, 66);            // trụ
    g.fillTriangle(px - 14, 196, px + 3, 130, px + 20, 196); // dầm tam giác
  }
  g.lineStyle(3, S, 1);
  for (let i = 0; i < 6; i++) {            // dây vòm
    const x1 = 450 + i * 74, x2 = x1 + 74;
    const mx = (x1 + x2) / 2;
    const pts = [];
    for (let t = 0; t <= 8; t++) {
      const x = x1 + ((x2 - x1) * t) / 8;
      const y = 134 + Math.sin((t / 8) * Math.PI) * 26;
      pts.push(new Phaser.Geom.Point(x, y));
    }
    g.beginPath(); g.moveTo(x1, 136);
    pts.forEach(pt => g.lineTo(pt.x, pt.y));
    g.lineTo(x2, 136); g.strokePath();
  }
  g.generateTexture('hanoi', 960, 220);
  g.clear();

  // ĐÈN LỒNG ĐỎ 44x72: viền vàng + gân + tua rua
  g.fillStyle(VN.red, 1); g.fillEllipse(22, 32, 38, 40);
  g.fillStyle(0xb81f16, 1); g.fillEllipse(22, 32, 22, 38);
  g.fillStyle(VN.red, 1); g.fillEllipse(22, 32, 8, 36);
  g.lineStyle(2, VN.yellow, 1); g.strokeEllipse(22, 32, 38, 40);
  g.lineStyle(1, VN.gold, 0.7); g.strokeEllipse(22, 32, 30, 40);
  g.lineStyle(1, VN.gold, 0.7); g.strokeEllipse(22, 32, 14, 40);
  g.fillStyle(VN.gold, 1); g.fillRect(16, 8, 12, 6);   // nắp trên
  g.fillRect(16, 55, 12, 5);                            // đế dưới
  g.fillRect(21, 60, 2, 10);                            // tua giữa
  g.lineStyle(1.5, VN.gold, 1);
  g.lineBetween(15, 62, 13, 70); g.lineBetween(22, 65, 22, 72); g.lineBetween(29, 62, 31, 70);
  g.generateTexture('lantern', 44, 74);
  g.destroy();
}

import { GAME_W, GAME_H } from '../scenes/BootScene';

export interface VnDecor {
  bgTiles: Phaser.GameObjects.Image[];
  banner: Phaser.GameObjects.Container;
  lanterns: Phaser.GameObjects.Image[];
  t: number;
  lastMs: number; // thời gian thực lần cập nhật (chống dt phình khi lag)
}

/** Nền trời hoàng hôn gradient (texture 'sky'). */
export function createSkyTexture(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const stops = [0xe8763a, 0xf2668b, 0x9a5a8c, 0x1b7fa8];
  const H = 720;
  for (let y = 0; y < H; y++) {
    const t = y / H;
    const i = Math.min(2, Math.floor(t * 3));
    const lt = (t - i / 3) * 3;
    const c0 = stops[i], c1 = stops[i + 1];
    const mix = (a: number, b: number) => Math.round(a + (b - a) * lt);
    const r = mix((c0 >> 16) & 255, (c1 >> 16) & 255);
    const gg = mix((c0 >> 8) & 255, (c1 >> 8) & 255);
    const b = mix(c0 & 255, c1 & 255);
    g.fillStyle(Phaser.Display.Color.GetColor(r, gg, b), 1);
    g.fillRect(0, y, 480, 1);
  }
  g.generateTexture('sky', 480, 720);
  g.destroy();
}

/** Gắn decor lễ hội cho GameScene: trời + parallax Hà Nội + băng rôn.
 * Trả về VnDecor; gọi updateVnDecor(dt) trong update(). */
export function attachGameDecor(scene: Phaser.Scene): VnDecor {
  const t = scene.textures.exists('sky') ? null : null;
  // trời hoàng hôn
  const sky = scene.add.image(0, 0, 'sky').setOrigin(0).setDepth(-9);
  // parallax silhouette: 2 tile lặp
  const tiles: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < 2; i++) {
    const img = scene.add.image(i * 960, GAME_H - 190, 'hanoi')
      .setOrigin(0, 1).setDepth(-8).setScrollFactor(0);
    tiles.push(img);
  }
  // băng rôn treo lơ lửng y~100
  const banner = scene.add.container(GAME_W / 2, 100);
  const ropeL = scene.add.rectangle(-175, -14, 3, 60, 0xf5e9d0, 0.9).setOrigin(0.5, 1);
  const ropeR = scene.add.rectangle(175, -14, 3, 60, 0xf5e9d0, 0.9).setOrigin(0.5, 1);
  const cloth = scene.add.image(0, 0, 'banner');
  const label = scene.add.text(0, 0, 'CHÀO MỪNG 2-9', {
    fontFamily: 'Arial', fontSize: '26px', color: '#FFFF00', fontStyle: 'bold',
  }).setOrigin(0.5);
  banner.add([ropeL, ropeR, cloth, label]);
  banner.setDepth(-7); // trên nền, dưới gameplay
  banner.setName('vnBanner');
  return { bgTiles: tiles, banner, lanterns: [], t: 0, lastMs: Date.now() };
}

/** Cập nhật mỗi frame: parallax 12px/s phải→trái, băng rôn đung đưa sin.
 * Dùng thời gian thực (Date.now) để tốc độ không phình khi delta bị clamp. */
export function updateVnDecor(d: VnDecor, _dt: number): void {
  const now = Date.now();
  const dt = Math.min(0.1, Math.max(0, (now - d.lastMs) / 1000));
  d.lastMs = now;
  d.t += dt;
  const speed = 12; // px/s
  for (const tile of d.bgTiles) {
    tile.x -= speed * dt;
    if (tile.x <= -960) tile.x += 1920;
  }
  // đung đưa nhẹ
  d.banner.angle = Math.sin(d.t * 1.2) * 4;
  d.banner.x = GAME_W / 2 + Math.sin(d.t * 0.8) * 6;
}

/** Thả đèn lồng bay lên từ đáy màn (gọi khi combo ≥ x2). */
export function releaseLanterns(scene: Phaser.Scene, decor: VnDecor, n: number): void {
  for (let i = 0; i < n; i++) {
    const x = 60 + Math.random() * (GAME_W - 120);
    const img = scene.add.image(x, GAME_H + 30, 'lantern').setScale(1.2).setDepth(-6);
    img.setName('vnLantern');
    decor.lanterns.push(img);
    scene.tweens.add({
      targets: img,
      y: -60,
      x: x + Phaser.Math.Between(-40, 40),
      alpha: 0,
      duration: Phaser.Math.Between(9000, 12000),
      onComplete: () => {
        const idx = decor.lanterns.indexOf(img);
        if (idx >= 0) decor.lanterns.splice(idx, 1);
        img.destroy();
      },
    });
    scene.tweens.add({ targets: img, angle: { from: -6, to: 6 }, duration: 1400, yoyo: true, repeat: -1 });
  }
}

/** Menu: 2 đèn lồng treo 2 góc trên. */
export function attachMenuLanterns(scene: Phaser.Scene): void {
  [[60, 40], [GAME_W - 60, 40]].forEach(([x, y]) => {
    const l = scene.add.image(x, y, 'lantern').setScale(1.3).setOrigin(0.5, 0);
    l.setName('vnLantern');
    scene.tweens.add({ targets: l, angle: { from: -5, to: 5 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const rope = scene.add.rectangle(x, 0, 3, y, 0xf5e9d0, 0.9).setOrigin(0.5, 0);
    rope.setDepth(-1);
  });
}
