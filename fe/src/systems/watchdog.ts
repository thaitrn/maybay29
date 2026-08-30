/**
 * FE watchdog: recover only when RAF is actually frozen (frame not advancing).
 * Low FPS while frames still increase is NOT a strike — never location.reload for that.
 * Two consecutive frozen samples (default 3s apart) → soft recover, then reload.
 */

export interface WatchdogHandle { stop(): void; }

export interface WatchdogDeps {
  setIntervalFn?: (fn: () => void, ms: number) => unknown;
  clearIntervalFn?: (id: unknown) => void;
  reloadFn?: () => void;
  warnFn?: (...args: unknown[]) => void;
  intervalMs?: number;
}

export type WatchdogVerdict = 'ok' | 'sample' | 'frozen';

/** Pure decision: ignore actualFps if frame advanced. First sample never frozen. */
export function watchdogVerdict(frame: number, lastFrame: number, _actualFps?: number): WatchdogVerdict {
  if (lastFrame < 0) return 'sample';
  if (frame !== lastFrame) return 'ok';
  return 'frozen';
}

export function startWatchdog(game: Phaser.Game, deps: WatchdogDeps = {}): WatchdogHandle {
  const setIntervalFn = deps.setIntervalFn ?? ((fn: () => void, ms: number) => setInterval(fn, ms));
  const clearIntervalFn = deps.clearIntervalFn ?? ((id: unknown) => clearInterval(id as ReturnType<typeof setInterval>));
  const reload = deps.reloadFn ?? (() => location.reload());
  const warn = deps.warnFn ?? ((...a: unknown[]) => console.warn(...a));

  let lastFrame = -1;
  let strikes = 0;

  const inGameScene = (): boolean =>
    game.scene.isActive('Game') || game.scene.getScenes(true).some(s => s.scene.key === 'Game');

  const resetInput = (): void => {
    try {
      if (game.input.keyboard && typeof (game.input.keyboard as unknown as { resetKeys?: () => void }).resetKeys === 'function') {
        (game.input.keyboard as unknown as { resetKeys: () => void }).resetKeys();
      }
    } catch { /* ignore */ }
  };

  const tick = (): void => {
    if (document.visibilityState !== 'visible') return;
    if (!inGameScene()) { strikes = 0; lastFrame = -1; return; }

    const loop = game.loop as unknown as { frame: number; actualFps: number; sleep(): void; resume(): void; running: boolean };
    const verdict = watchdogVerdict(loop.frame, lastFrame, loop.actualFps);
    lastFrame = loop.frame;
    if (verdict !== 'frozen') {
      strikes = 0;
      return;
    }

    strikes++;
    if (strikes === 1) {
      warn('[watchdog] recovered (soft: loop sleep/resume + reset input)', { fps: loop.actualFps, frozen: true });
      try { if (loop.running) loop.sleep(); } catch { /* ignore */ }
      try { loop.resume(); } catch { /* ignore */ }
      resetInput();
    } else {
      warn('[watchdog] recovered (reload)', { fps: loop.actualFps, frozen: true });
      reload();
    }
  };

  const id = setIntervalFn(tick, deps.intervalMs ?? 3000);
  return { stop: () => clearIntervalFn(id) };
}
