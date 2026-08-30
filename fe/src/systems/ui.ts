// Overlay DOM: nút tắt/bật âm thanh góc màn hình + toast (tự ẩn 1.5s).
import { isMuted, toggleMuted } from './audio';

const TOAST_QUEUE: string[] = [];
let toastEl: HTMLElement | null = null;
let showing = false;

function ensureStyles(): void {
  if (document.getElementById('mb29-ui-style')) return;
  const s = document.createElement('style');
  s.id = 'mb29-ui-style';
  s.textContent = `
#mb29-mute{position:fixed;top:8px;right:8px;z-index:50;width:44px;height:44px;min-width:44px;min-height:44px;border-radius:50%;border:2px solid #ffd700;background:rgba(18,58,99,.85);color:#ffd700;font-size:20px;line-height:40px;text-align:center;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation}
#mb29-mute:active{background:rgba(255,215,0,.3)}
#mb29-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:60;background:rgba(0,0,0,.78);color:#fff;padding:8px 18px;border-radius:18px;font-family:Arial,sans-serif;font-size:15px;max-width:86vw;text-align:center;word-break:break-all}
@media(max-width:520px){#mb29-mute{right:8px;transform:none}}
`;
  document.head.appendChild(s);
}

export function showToast(msg: string): void {
  TOAST_QUEUE.push(msg);
  if (showing) return;
  showing = true;
  const next = (): void => {
    const m = TOAST_QUEUE.shift();
    if (!m) { showing = false; return; }
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'mb29-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = m;
    toastEl.style.display = 'block';
    setTimeout(() => {
      if (toastEl) toastEl.style.display = 'none';
      setTimeout(next, 200);
    }, 1500);
  };
  next();
}

/** Tạo nút mute một lần (idempotent). */
export function setupMuteButton(): void {
  if (document.getElementById('mb29-mute')) return;
  ensureStyles();
  const btn = document.createElement('div');
  btn.id = 'mb29-mute';
  btn.setAttribute('role', 'button');
  btn.textContent = isMuted() ? '🔇' : '🔊';
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    btn.textContent = toggleMuted() ? '🔇' : '🔊';
  });
  document.body.appendChild(btn);
}
