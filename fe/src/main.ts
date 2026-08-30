import Phaser from 'phaser';
import { BootScene, GAME_W, GAME_H } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { startWatchdog } from './systems/watchdog';
import { unlockAudio } from './systems/audio';
import { setupMuteButton } from './systems/ui';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#123A63',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
});

(window as unknown as { game: Phaser.Game }).game = game;
startWatchdog(game);
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
setupMuteButton();
