import Phaser from 'phaser';

export const GAME_W = 480;
export const GAME_H = 720;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.image('player', 'meowa/player-chim-lac-plane.png');
    this.load.image('cloud', 'meowa/hazard-cloud-gate.png');
    this.load.image('vortex', 'meowa/hazard-wind-vortex.png');
    this.load.image('thunder', 'meowa/hazard-thunder-column.png');
    this.load.image('scout', 'meowa/enemy-shadow-scout.png');
    this.load.image('glider', 'meowa/enemy-shadow-glider.png');
    this.load.image('star', 'meowa/collectible-sao-lac.png');
    this.load.image('lotus', 'meowa/pickup-lotus-shield.png');
  }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillGradientStyle(0x123a63, 0x123a63, 0x1b7fa8, 0x1b7fa8, 1);
    g.fillRect(0, 0, 16, 16);
    g.generateTexture('sky-bg', 16, 16);
    g.destroy();
    this.scene.start('Menu');
  }
}
