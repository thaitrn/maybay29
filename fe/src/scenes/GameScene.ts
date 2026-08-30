import Phaser from 'phaser';
import { GAME_W, GAME_H } from './BootScene';
import { api } from '../api/client';
import { ensurePlayerId } from '../systems/player';
import { applyLift, createPlane, playerHitbox, scrollSpeed, stepPlane, aabb, PLAYER_X } from '../game/physics';
import { addEvent, comboMult, emptyStats, GRACE_MS, INVULN_MS, LIVES, ROUND_MS, RUC_MS, RUC_NEED, SHIELD_MS, type RunStats } from '../game/scoring';
import { buildTimeline, type SpawnSpec } from '../game/director';
import { sfx } from '../systems/audio';
import { isMuted, toggleMuted } from '../systems/audio';
import { durationMsFromWall, roundOver, spawnDue, splitDt } from '../systems/clock';

type EntKind = SpawnSpec['kind'] | 'bullet' | 'cloudTop' | 'cloudBot';

interface Ent {
  kind: EntKind;
  spr: Phaser.GameObjects.Image;
  tel?: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;
  w: number;
  h: number;
  vx: number;
  amp?: number;
  baseY?: number;
  phase?: number;
  dir?: number;
  armedAt: number;
  near?: boolean;
  passed?: boolean;
  on?: boolean;
  pulse?: number;
}

export class GameScene extends Phaser.Scene {
  private planeS = createPlane();
  private plane!: Phaser.GameObjects.Image;
  private ents: Ent[] = [];
  private timeline: SpawnSpec[] = [];
  private spawnI = 0;
  private elapsed = 0;
  /** Unclamped session seconds from performance.now (visible tab). Timer/spawn/finish use this, not physics dt. */
  private wallElapsed = 0;
  private wallOrigin = 0;
  private score = 0;
  private streak = 0;
  private lives = LIVES;
  private stats = emptyStats();
  private meter = 0;
  private rucUntil = 0;
  private shieldUntil = 0;
  private invulnUntil = 0;
  private graceUntil = 0;
  private fireAcc = 0;
  private ended = false;
  private cue?: Phaser.GameObjects.Text;
  private hudScore!: Phaser.GameObjects.Text;
  private hudCombo!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private hudTime!: Phaser.GameObjects.Text;
  private meterFill!: Phaser.GameObjects.Rectangle;
  private runId: string | null = null;
  private seen = { cloud: false, vortex: false, thunder: false, scout: false, glider: false };

  constructor() {
    super('Game');
  }

  create(): void {
    this.planeS = createPlane();
    this.ents = [];
    this.timeline = buildTimeline(1 + Math.floor(Math.random() * 90));
    this.spawnI = 0;
    this.elapsed = 0;
    this.wallElapsed = 0;
    this.wallOrigin = performance.now();
    this.score = 0;
    this.streak = 0;
    this.lives = LIVES;
    this.stats = emptyStats();
    this.meter = 0;
    this.rucUntil = 0;
    this.shieldUntil = 0;
    this.invulnUntil = 0;
    this.graceUntil = GRACE_MS / 1000;
    this.fireAcc = 0;
    this.ended = false;
    this.seen = { cloud: false, vortex: false, thunder: false, scout: false, glider: false };

    this.cameras.main.setBackgroundColor('#123A63');
    this.add.image(GAME_W / 2, GAME_H / 2, 'sky-bg').setDisplaySize(GAME_W, GAME_H).setDepth(-5);

    this.plane = this.add.image(PLAYER_X, this.planeS.y, 'player').setScale(2).setDepth(10);
    this.textures.get('player').setFilter(Phaser.Textures.FilterMode.NEAREST);

    this.hudScore = this.add.text(12, 10, '0', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '22px', color: '#FFD84D', fontStyle: 'bold',
      stroke: '#123A63', strokeThickness: 5,
    }).setDepth(20);
    this.hudCombo = this.add.text(GAME_W / 2, 12, 'x1', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '18px', color: '#F5E9D0', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(20);
    this.meterFill = this.add.rectangle(GAME_W / 2 - 60, 40, 0, 10, 0xffd84d).setOrigin(0, 0.5).setDepth(20);
    this.add.rectangle(GAME_W / 2, 40, 120, 12, 0x2b2118, 0.7).setStrokeStyle(1, 0xf5e9d0).setDepth(19);
    this.hudLives = this.add.text(GAME_W - 88, 10, '❤❤❤', {
      fontFamily: 'Arial', fontSize: '18px', color: '#E5484D',
    }).setDepth(20);
    this.hudTime = this.add.text(GAME_W - 12, 36, '60', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '16px', color: '#F5E9D0',
    }).setOrigin(1, 0).setDepth(20);

    const mute = this.add.text(GAME_W - 36, 64, isMuted() ? '🔇' : '🔊', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-22, -22, 44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    mute.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      mute.setText(toggleMuted() ? '🔇' : '🔊');
    });

    this.cue = this.add.text(GAME_W / 2, 200, 'CHẠM ĐỂ NÂNG', {
      fontFamily: '"Be Vietnam Pro", system-ui, Arial, sans-serif', fontSize: '26px', color: '#FFD84D', fontStyle: 'bold',
      stroke: '#2B2118', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(15);

    this.input.addPointer(1);
    this.input.on('pointerdown', () => this.lift());
    this.input.keyboard?.on('keydown-SPACE', () => this.lift());

    (this.game as unknown as { __scene: string }).__scene = 'Game';
    void this.openRun();
  }

  private lift(): void {
    if (this.ended) return;
    this.planeS = applyLift(this.planeS);
    this.plane.setScale(2.2, 1.7);
    this.tweens.killTweensOf(this.plane);
    this.tweens.add({ targets: this.plane, scaleX: 2, scaleY: 2, duration: 120 });
    sfx.whoosh();
    if (this.cue) {
      this.cue.destroy();
      this.cue = undefined;
    }
  }

  private async openRun(): Promise<void> {
    const pid = ensurePlayerId();
    await api.registerPlayer(pid, 'Phi công 2/9');
    const run = await api.createRun(pid, 'mb29-v3');
    this.runId = run?.run_id ?? null;
    (this.game as unknown as { __runId: string | null }).__runId = this.runId;
  }

  update(_t: number, dtMs: number): void {
    if (this.ended) return;
    const { phys: dt } = splitDt(dtMs);
    this.elapsed += dt;
    this.wallElapsed = Math.max(0, (performance.now() - this.wallOrigin) / 1000);
    const left = Math.max(0, ROUND_MS / 1000 - this.wallElapsed);
    this.hudTime.setText(String(Math.ceil(left)));

    this.planeS = stepPlane(this.planeS, dt);
    this.plane.setPosition(this.planeS.x, this.planeS.y);
    this.plane.angle = Phaser.Math.Clamp(this.planeS.vy * 0.04, -22, 28);

    const spd = scrollSpeed(this.elapsed);
    this.spawn();
    this.autoFire(dt, spd);
    this.moveEnts(dt, spd);
    this.collide();
    this.hud();

    if (roundOver(this.wallElapsed, this.lives)) this.finish(this.lives <= 0 ? 'lives' : 'timer');
  }

  private spawn(): void {
    while (this.spawnI < this.timeline.length && spawnDue(this.timeline[this.spawnI].t, this.wallElapsed)) {
      const s = this.timeline[this.spawnI++];
      if (s.kind === 'cloud' || s.kind === 'vortex' || s.kind === 'thunder' || s.kind === 'scout' || s.kind === 'glider') {
        this.seen[s.kind] = true;
      }
      const x = GAME_W + 40;
      if (s.kind === 'cloud') {
        const gap = s.gap ?? 150;
        const tel = this.add.rectangle(x, s.y, 28, gap, 0xf5e9d0, 0.25).setStrokeStyle(2, 0xffd84d);
        this.ents.push({ kind: 'cloudTop', spr: this.add.image(x, s.y - gap / 2 - 28, 'cloud').setScale(2), w: 56, h: 56, vx: 0, armedAt: this.elapsed + s.telegraph, tel });
        this.ents.push({ kind: 'cloudBot', spr: this.add.image(x, s.y + gap / 2 + 28, 'cloud').setScale(2).setFlipY(true), w: 56, h: 56, vx: 0, armedAt: this.elapsed + s.telegraph });
      } else if (s.kind === 'vortex') {
        const arrow = this.add.text(x - 40, s.y, s.dir === 1 ? '▲ GIÓ' : '▼ GIÓ', { fontSize: '14px', color: '#65B8C8', fontStyle: 'bold' }).setOrigin(0.5);
        this.ents.push({ kind: 'vortex', spr: this.add.image(x, s.y, 'vortex').setScale(2), w: 48, h: 72, vx: 0, dir: s.dir ?? 1, armedAt: this.elapsed + s.telegraph, tel: arrow });
      } else if (s.kind === 'thunder') {
        const warn = this.add.rectangle(x, s.y, 36, 140, 0xe5484d, 0.2).setStrokeStyle(2, 0xffd84d);
        this.ents.push({ kind: 'thunder', spr: this.add.image(x, s.y, 'thunder').setScale(2, 3), w: 36, h: 120, vx: 0, armedAt: this.elapsed + s.telegraph, on: true, pulse: 0, tel: warn });
      } else {
        const key = s.kind === 'scout' ? 'scout' : s.kind === 'glider' ? 'glider' : s.kind === 'lotus' ? 'lotus' : 'star';
        const spr = this.add.image(x, s.y, key).setScale(s.kind === 'star' || s.kind === 'lotus' ? 1.4 : 2);
        const tel = (s.kind === 'scout' || s.kind === 'glider')
          ? this.add.rectangle(x, s.y, 80, 8, 0x514463, 0.5)
          : undefined;
        this.ents.push({
          kind: s.kind, spr, w: s.kind === 'star' ? 28 : 40, h: s.kind === 'star' ? 28 : 36, vx: 0,
          armedAt: this.elapsed + s.telegraph, tel, amp: s.kind === 'glider' ? 46 : 0, baseY: s.y, phase: 0,
        });
      }
    }
  }

  private autoFire(dt: number, spd: number): void {
    this.fireAcc += dt;
    const rate = this.elapsed < this.rucUntil ? 0.22 : 0.45;
    if (this.fireAcc >= rate) {
      this.fireAcc = 0;
      const b = this.add.rectangle(this.planeS.x + 28, this.planeS.y, 10, 6, 0xffd84d) as unknown as Phaser.GameObjects.Image;
      this.ents.push({ kind: 'bullet', spr: b, w: 10, h: 6, vx: spd + 220, armedAt: 0 });
    }
  }

  private moveEnts(dt: number, spd: number): void {
    const keep: Ent[] = [];
    for (const e of this.ents) {
      const vx = e.kind === 'bullet' ? e.vx : -spd;
      e.spr.x += vx * dt;
      if (e.tel) e.tel.x = e.spr.x - (e.kind === 'vortex' ? 40 : 0);
      if (e.kind === 'glider' && e.baseY != null) {
        e.phase = (e.phase ?? 0) + dt * 2.2;
        e.spr.y = e.baseY + Math.sin(e.phase) * (e.amp ?? 40);
      }
      if (e.kind === 'thunder') {
        e.pulse = (e.pulse ?? 0) + dt;
        e.on = Math.floor((e.pulse ?? 0) / 0.7) % 2 === 0;
        e.spr.setAlpha(e.on ? 1 : 0.25);
      }
      if (e.kind === 'vortex' && this.elapsed >= e.armedAt) {
        const box = { x: e.spr.x - e.w / 2, y: e.spr.y - e.h / 2, w: e.w, h: e.h };
        if (aabb(playerHitbox(this.planeS), box)) {
          this.planeS.vy += (e.dir ?? 1) * 520 * dt;
        }
      }
      if (e.spr.x < -80 || e.spr.x > GAME_W + 120) {
        e.spr.destroy();
        e.tel?.destroy();
      } else keep.push(e);
    }
    this.ents = keep;
  }

  private collide(): void {
    const nowOk = this.elapsed > this.graceUntil && this.elapsed * 1000 > this.invulnUntil && this.elapsed * 1000 > this.shieldUntil;
    const ph = playerHitbox(this.planeS);
    const ruc = this.elapsed * 1000 < this.rucUntil;

    for (const e of this.ents) {
      if (e.kind === 'bullet') {
        for (const o of this.ents) {
          if (o.kind !== 'scout' && o.kind !== 'glider') continue;
          const box = { x: o.spr.x - o.w / 2, y: o.spr.y - o.h / 2, w: o.w, h: o.h };
          const bb = { x: e.spr.x - 5, y: e.spr.y - 3, w: 10, h: 6 };
          if (aabb(bb, box)) {
            this.credit('enemy');
            o.spr.destroy();
            o.tel?.destroy();
            o.kind = 'bullet';
            o.spr.x = -999;
            e.spr.x = GAME_W + 200;
          }
        }
        continue;
      }

      if (e.kind === 'star' || e.kind === 'lotus') {
        const box = { x: e.spr.x - e.w / 2, y: e.spr.y - e.h / 2, w: e.w, h: e.h };
        if (ruc && e.kind === 'star' && Math.hypot(e.spr.x - this.planeS.x, e.spr.y - this.planeS.y) < 90) {
          e.spr.x += (this.planeS.x - e.spr.x) * 0.12;
          e.spr.y += (this.planeS.y - e.spr.y) * 0.12;
        }
        if (aabb(ph, box) || (ruc && e.kind === 'star' && Math.hypot(e.spr.x - this.planeS.x, e.spr.y - this.planeS.y) < 28)) {
          if (e.kind === 'star') this.credit('star');
          else this.shieldUntil = this.elapsed * 1000 + SHIELD_MS;
          e.spr.destroy();
          e.spr.x = -999;
        }
        continue;
      }

      if (e.kind === 'cloudTop' || e.kind === 'cloudBot') {
        if (!e.passed && e.spr.x + e.w / 2 < ph.x) {
          e.passed = true;
          const pair = this.ents.find((o) => o !== e && (o.kind === 'cloudTop' || o.kind === 'cloudBot') && Math.abs(o.spr.x - e.spr.x) < 8);
          if (pair && !pair.passed) {
            pair.passed = true;
            this.credit('gate');
          }
        }
      }

      const hazard = e.kind === 'cloudTop' || e.kind === 'cloudBot' || e.kind === 'scout' || e.kind === 'glider' || (e.kind === 'thunder' && e.on);
      if (!hazard) continue;
      if (this.elapsed < e.armedAt) continue;
      const box = { x: e.spr.x - e.w / 2 + 6, y: e.spr.y - e.h / 2 + 6, w: e.w - 12, h: e.h - 12 };
      if (!e.near && Math.abs(e.spr.x - this.planeS.x) < 40 && !aabb(ph, box) && Math.abs(e.spr.y - this.planeS.y) < e.h) {
        e.near = true;
        this.credit('near');
      }
      if (aabb(ph, box) && nowOk && !(this.elapsed * 1000 < this.shieldUntil)) {
        this.hit();
      } else if (aabb(ph, box) && this.elapsed * 1000 < this.shieldUntil) {
        this.shieldUntil = 0;
        this.invulnUntil = this.elapsed * 1000 + INVULN_MS;
      }
    }
  }

  private credit(kind: 'star' | 'enemy' | 'gate' | 'near'): void {
    const r = addEvent(this.stats, kind, this.streak);
    this.stats = r.stats;
    this.streak = r.streak;
    this.score += r.gained;
    this.meter += 1;
    if (this.meter >= RUC_NEED && this.elapsed * 1000 >= this.rucUntil) {
      this.rucUntil = this.elapsed * 1000 + RUC_MS;
      this.meter = 0;
      this.shieldUntil = Math.max(this.shieldUntil, this.rucUntil);
      sfx.fanfare();
    } else sfx.ting(1 + Math.min(0.6, this.streak * 0.04));
  }

  private hit(): void {
    this.lives -= 1;
    this.streak = 0;
    this.invulnUntil = this.elapsed * 1000 + INVULN_MS;
    this.cameras.main.shake(this.game.device.os ? 80 : 120, 0.004);
    sfx.puff();
    this.tweens.add({ targets: this.plane, alpha: 0.35, duration: 80, yoyo: true, repeat: 4, onComplete: () => this.plane.setAlpha(1) });
  }

  private hud(): void {
    this.hudScore.setText(String(this.score));
    this.hudCombo.setText(`x${comboMult(this.streak)}  ${this.streak}`);
    this.hudLives.setText('❤'.repeat(Math.max(0, this.lives)) + '♡'.repeat(Math.max(0, LIVES - this.lives)));
    this.meterFill.width = Math.min(120, (this.meter / RUC_NEED) * 120);
    (this.game as unknown as { __hud: { score: number; streak: number; lives: number; seen: Record<string, boolean> } }).__hud = {
      score: this.score, streak: this.streak, lives: this.lives, seen: this.seen,
    };
  }

  private finish(reason: 'timer' | 'lives'): void {
    if (this.ended) return;
    this.ended = true;
    const duration_ms = durationMsFromWall(this.wallElapsed);
    const payload = {
      score: this.score,
      duration_ms,
      finish_reason: reason,
      stats: this.stats,
      runId: this.runId,
      seen: this.seen,
    };
    this.scene.start('GameOver', payload);
  }
}
