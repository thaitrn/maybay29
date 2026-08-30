// Âm thanh sinh code bằng WebAudio (không file ngoài). iOS Safari: unlock ở touch đầu.
const MUTE_KEY = 'maybay29_muted';

let ctx: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* ignore */ }

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
    const Ctor = AC.AudioContext ?? AC.webkitAudioContext;
    if (!Ctor) return null;
    try { ctx = new Ctor(); } catch { return null; }
  }
  return ctx;
}

/** Gọi trong handler touch/click đầu tiên để resume AudioContext (iOS Safari). */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

export function isMuted(): boolean { return muted; }

export function toggleMuted(): boolean {
  muted = !muted;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
  return muted;
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number, pitch = 1): void {
  if (muted) return;
  const c = getCtx();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq * pitch), t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo * pitch), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** tap bắn pháo hoa — "pop" ngắn */
  pop: () => tone(420, 0.09, 'square', 0.12, 0, 140),
  /** trúng sao — "ting" cao; pitch = 1..1.6 tăng theo cấp combo */
  ting: (pitch = 1) => { tone(1568, 0.12, 'triangle', 0.18, 0, undefined, pitch); tone(2093, 0.18, 'triangle', 0.12, 0.05, undefined, pitch); },
  /** nổ dây chuyền sao vàng lớn */
  fanfare: () => { [0, 0.1, 0.2, 0.32].forEach((d, i) => { tone(1046 + i * 262, 0.35, 'triangle', 0.15, d); }); },
  /** khói — "phụt" trầm */
  puff: () => tone(120, 0.22, 'sawtooth', 0.15, 0, 55),
  /** hết ván — chuỗi pháo hoa "bloom" */
  bloom: () => { [0, 0.16, 0.32, 0.5, 0.7].forEach((d, i) => { tone(300 + i * 90, 0.4, 'triangle', 0.16, d, 90 + i * 30); tone(1200 + i * 150, 0.3, 'sine', 0.1, d + 0.05); }); },
  /** Flap nhẹ — tiếng gió "whoosh" khi vẫy cánh. */
  whoosh: () => { tone(240, 0.16, 'sine', 0.1, 0, 640); tone(120, 0.12, 'triangle', 0.06, 0, 320); },
  /** nút BAY NGAY — chime */
  chime: () => { tone(880, 0.25, 'sine', 0.18); tone(1318, 0.3, 'sine', 0.15, 0.1); tone(1760, 0.4, 'sine', 0.12, 0.2); },
};
