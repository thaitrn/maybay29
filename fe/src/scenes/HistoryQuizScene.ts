import Phaser from 'phaser';
import { GAME_W, GAME_H } from './BootScene';
import { pickHistoryQuestion } from '../data/history';

export interface QuizData { score: number; durationS: number; badge: string | null; taps: number; perfect: boolean; livesLeft: number; bySmoke: boolean }

/** Cơ chế "HỎI ĐỀ LỊCH SỬ": hiện sau khi ván kết thúc, TRƯỚC leaderboard. Đúng +30 điểm. */
export class HistoryQuizScene extends Phaser.Scene {
  private d!: QuizData;

  constructor() { super('HistoryQuiz'); }

  create(data: QuizData): void {
    this.d = data;
    const q = pickHistoryQuestion();
    this.cameras.main.setBackgroundColor('#12203a');

    // khung giấy dó kem viền đỏ cờ
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W - 30, GAME_H - 60, 0xF5E9D0).setStrokeStyle(5, 0xDA251D);

    this.add.text(GAME_W / 2, 90, '📜 HỎI ĐỀ LỊCH SỬ 2/9', {
      fontFamily: 'Arial', fontSize: '26px', color: '#DA251D', fontStyle: 'bold',
    }).setOrigin(0.5);

    const qText = this.add.text(GAME_W / 2, 150, q.q, {
      fontFamily: 'Arial', fontSize: '21px', color: '#2B2B2B', fontStyle: 'bold',
      align: 'center', wordWrap: { width: GAME_W - 80 },
    }).setOrigin(0.5, 0);

    const startY = qText.y + qText.height + 28;
    const correct = q.correct;
    let answered = false;

    q.answers.forEach((ans, i) => {
      const y = startY + 30 + i * 64;
      const btn = this.add.rectangle(GAME_W / 2, y, GAME_W - 90, 54, 0xFFFFFF).setStrokeStyle(2, 0x8A6D3B)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(GAME_W / 2, y, `${'ABCD'[i]}. ${ans}`, {
        fontFamily: 'Arial', fontSize: '17px', color: '#2B2B2B', align: 'center',
        wordWrap: { width: GAME_W - 110 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const pick = () => {
        if (answered) return;
        answered = true;
        const ok = i === correct;
        btn.setFillStyle(ok ? 0x28A745 : 0xDC3545);
        label.setColor('#FFFFFF');
        if (ok) this.d.score += 30;
        this.add.text(GAME_W / 2, startY + 30 + 4 * 64 + 18,
          `${ok ? '✔ Đúng rồi! +30 điểm — ' : '✘ Chưa đúng — '}${q.explain}`, {
            fontFamily: 'Arial', fontSize: '15px', color: ok ? '#1B5E20' : '#8A1C1C',
            align: 'center', wordWrap: { width: GAME_W - 80 },
            backgroundColor: '#F5E9D0', padding: { x: 6, y: 4 },
          }).setOrigin(0.5, 0);
        this.add.rectangle(GAME_W / 2, GAME_H - 92, 160, 56, 0xDA251D).setStrokeStyle(3, 0xF5E9D0)
          .setInteractive({ useHandCursor: true });
        this.add.text(GAME_W / 2, GAME_H - 92, 'TIẾP ▶', {
          fontFamily: 'Arial', fontSize: '22px', color: '#FFFFFF', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('GameOver', this.d));
      };
      btn.on('pointerdown', pick);
      label.on('pointerdown', pick);
    });
  }
}
