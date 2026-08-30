import Phaser from 'phaser';

/** Sinh texture pixel-art hoàn toàn bằng code (không asset file). */
export function createTextures(scene: Phaser.Scene): void {
  // máy bay pixel đỏ/vàng 32x20
  const g = scene.add.graphics();
  const put = (c: number, x: number, y: number, w: number, h: number) => { g.fillStyle(c, 1); g.fillRect(x, y, w, h); };
  // thân đỏ
  put(0xda251d, 10, 6, 14, 9);
  put(0xa01208, 10, 13, 14, 2);
  // cockpit vàng
  put(0xffd700, 15, 8, 5, 4);
  // cánh trên
  put(0xffd700, 12, 0, 8, 6);
  // cánh dưới + đuôi
  put(0xffd700, 12, 14, 8, 6);
  put(0xffd700, 22, 2, 6, 6);
  // mũi
  put(0xffe066, 24, 8, 4, 5);
  // động cơ
  put(0x333333, 8, 9, 3, 3);
  g.generateTexture('plane', 32, 20);
  g.clear();

  // sao vàng 5 cánh 16x16
  drawStar(g, 8, 8, 7, 0xffd700, 0xffec80);
  g.generateTexture('star', 16, 16);
  g.clear();

  // "khói" — quả xám tròn
  g.fillStyle(0x555555, 1); g.fillCircle(8, 8, 7);
  g.fillStyle(0x888888, 1); g.fillCircle(6, 6, 3);
  g.generateTexture('smoke', 16, 16);
  g.clear();

  // ITEM: sao vàng lớn 28x28 — nền tia sáng + sao to (viền sáng nhấp nháy xử lý ở scene)
  g.fillStyle(0xfff7cc, 1); g.fillCircle(14, 14, 13);
  g.fillStyle(0xffd700, 1); g.fillCircle(14, 14, 10);
  drawStar(g, 14, 14, 9, 0xffffff, 0xffec80);
  g.generateTexture('bigstar', 28, 28);
  g.clear();

  // ITEM: đồng hồ +5s 26x26
  g.fillStyle(0x222222, 1); g.fillCircle(13, 13, 12);
  g.fillStyle(0x2fd4ff, 1); g.fillCircle(13, 13, 10);
  g.fillStyle(0xffffff, 1); g.fillRect(12, 6, 2, 8); g.fillRect(12, 12, 6, 2);
  g.generateTexture('clock', 26, 26);
  g.clear();

  // hạt pháo hoa 4x4
  g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4);
  g.generateTexture('px', 4, 4);
  g.clear();

  // pháo hoa bắn lên (đạn) 6x10
  g.fillStyle(0xffd700, 1); g.fillRect(1, 0, 4, 10);
  g.generateTexture('shell', 6, 10);
  g.clear();

  // cờ đỏ sao vàng 300x200
  g.fillStyle(0xda251d, 1); g.fillRect(0, 0, 300, 200);
  drawStar(g, 150, 100, 55, 0xffd700, 0xffd700);
  g.generateTexture('flag', 300, 200);
  g.destroy();
}

function drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, fill: number, hi: number): void {
  const pts: number[][] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  g.fillStyle(fill, 1);
  g.fillPoints(pts.map(p => new Phaser.Geom.Point(p[0], p[1])), true);
  g.fillStyle(hi, 0.6);
  g.fillCircle(cx, cy, r * 0.2);
}
