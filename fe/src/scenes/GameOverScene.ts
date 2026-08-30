import Phaser from 'phaser';
import { GAME_W, GAME_H } from './BootScene';
import { api, type FinishBody } from '../api/client';
import { ensurePlayerId } from '../systems/player';
import { applyRun, loadMeta, saveMeta, SKINS } from '../game/progress';
import { sfx } from '../systems/audio';
import { showToast } from '../systems/ui';
import { canUpdateGameObject } from '../systems/sceneUi';
import type { RunStats } from '../game/scoring';

export interface OverData {
  score: number;
  duration_ms: number;
  finish_reason: 'timer' | 'lives';
  stats: RunStats;
  runId: string | null;
  seen: Record<string, boolean>;
}

export class GameOverScene extends Phaser.Scene {
  private submitGen = 0;

  constructor() {
    super('GameOver');
  }

  create(d: OverData): void {
    const data: OverData = {
      score: d?.score ?? 0,
      duration_ms: d?.duration_ms ?? 1000,
      finish_reason: d?.finish_reason ?? 'timer',
      stats: d?.stats ?? { stars: 0, enemies: 0, gates: 0, near_misses: 0, base_points: 0, combo_bonus: 0, max_combo: 0 },
      runId: d?.runId ?? null,
      seen: d?.seen ?? {},
    };
    this.cameras.main.setBackgroundColor('#123A63');
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky-bg').setDisplaySize(GAME_W, GAME_H).setDepth(-2);

    const prev = loadMeta();
    const applied = applyRun(prev, data.score, data.stats.stars);
    saveMeta(applied.meta);

    this.add.text(GAME_W / 2, 70, data.finish_reason === 'lives' ? 'HẾT TIM' : 'HẾT GIỜ', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '36px', color: '#FFD84D', fontStyle: 'bold',
      stroke: '#2B2118', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 130, `Điểm: ${data.score}`, {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '40px', color: '#F5E9D0', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 180, `Kỷ lục: ${applied.meta.best_score}   Combo: ${data.stats.max_combo}   Sao: ${data.stats.stars}`, {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '16px', color: '#F5E9D0',
    }).setOrigin(0.5);

    const status = this.add.text(GAME_W / 2, 210, 'Đang gửi bảng xếp hạng…', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '14px', color: '#65B8C8',
    }).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_W / 2, 280, 320, 72, 0xda251d)
      .setStrokeStyle(4, 0xffd84d)
      .setInteractive({ useHandCursor: true });
    const btnT = this.add.text(GAME_W / 2, 280, 'CHƠI LẠI', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '28px', color: '#F5E9D0', fontStyle: 'bold',
    }).setOrigin(0.5);
    const gen = ++this.submitGen;
    const replay = () => {
      this.submitGen += 1;
      this.scene.start('Game');
    };
    btn.on('pointerdown', replay);
    btnT.setInteractive({ useHandCursor: true }).on('pointerdown', replay);
    this.input.keyboard?.on('keydown-ENTER', replay);

    this.add.text(GAME_W / 2, 340, 'BẢNG XẾP HẠNG', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '16px', color: '#FFD84D', fontStyle: 'bold',
    }).setOrigin(0.5);
    const board = this.add.text(GAME_W / 2, 365, '', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '14px', color: '#F5E9D0', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);

    if (applied.unlocked.length) {
      const names = applied.unlocked.map((id) => SKINS.find((s) => s.id === id)?.name ?? id).join(', ');
      this.time.delayedCall(200, () => showToast(`Mở khóa: ${names}`));
    }

    (this.game as unknown as { __scene: string; __result: OverData }).__scene = 'GameOver';
    (this.game as unknown as { __result: OverData }).__result = data;

    void this.submit(data, status, board, gen);
    sfx.bloom();
  }

  private canPaint(gen: number, obj: Phaser.GameObjects.Text): boolean {
    if (gen !== this.submitGen) return false;
    if (!this.sys.isActive()) return false;
    if (obj.scene !== this) return false;
    return canUpdateGameObject(true, obj);
  }

  private async submit(
    data: OverData,
    status: Phaser.GameObjects.Text,
    board: Phaser.GameObjects.Text,
    gen: number,
  ): Promise<void> {
    const pid = ensurePlayerId();
    await api.registerPlayer(pid, 'Phi công 2/9');
    let ok = false;
    if (data.runId) {
      const body: FinishBody = {
        player_id: pid,
        duration_ms: data.duration_ms,
        score: data.score,
        finish_reason: data.finish_reason,
        stats: data.stats,
      };
      const fin = await api.finishRun(data.runId, body);
      ok = !!fin;
      if (this.sys.isActive() && gen === this.submitGen) {
        (this.game as unknown as { __lastSubmit: { ok: boolean } }).__lastSubmit = { ok };
      }
    }
    const lb = await api.leaderboard(8);
    if (!this.canPaint(gen, status) || !this.canPaint(gen, board)) return;
    if (!lb) {
      status.setText('Bảng xếp hạng đang offline — điểm vẫn lưu trên máy.');
      board.setText('');
      return;
    }
    status.setText(ok ? 'Đã ghi điểm' : 'Bảng xếp hạng đang offline — điểm vẫn lưu trên máy.');
    board.setText(lb.leaderboard.map((r) => `${r.rank}. ${r.display_name} — ${r.score}`).join('\n'));
  }
}
