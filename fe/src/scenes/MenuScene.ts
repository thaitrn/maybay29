import Phaser from 'phaser';
import { GAME_W, GAME_H } from './BootScene';
import { sfx } from '../systems/audio';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#123A63');
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky-bg').setDisplaySize(GAME_W, GAME_H).setDepth(-2);

    this.add.text(GAME_W / 2, 160, 'MÁY BAY MỪNG 2/9', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif',
      fontSize: '28px',
      color: '#FFD84D',
      fontStyle: 'bold',
      stroke: '#2B2118',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 210, 'Sứ giả Chim Lạc', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif',
      fontSize: '20px',
      color: '#F5E9D0',
    }).setOrigin(0.5);

    const plane = this.add.image(GAME_W / 2, 340, 'player').setScale(3);
    (plane.texture.getSourceImage() as HTMLCanvasElement);
    this.tweens.add({ targets: plane, y: 352, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const btn = this.add.rectangle(GAME_W / 2, 500, 280, 88, 0xda251d)
      .setStrokeStyle(4, 0xffd84d)
      .setInteractive({ useHandCursor: true });
    const btnT = this.add.text(GAME_W / 2, 500, 'BAY NGAY', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif',
      fontSize: '32px',
      color: '#F5E9D0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.go());
    btnT.setInteractive({ useHandCursor: true });
    btnT.on('pointerdown', () => this.go());

    this.add.text(GAME_W / 2, 590, 'CHẠM ĐỂ GIỮ NHỊP BAY', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif',
      fontSize: '16px',
      color: '#F5E9D0',
    }).setOrigin(0.5);

    this.input.keyboard?.on('keydown-ENTER', () => this.go());
    (this.game as unknown as { __scene: string }).__scene = 'Menu';
  }

  private go(): void {
    sfx.chime();
    this.scene.start('Game');
  }
}
