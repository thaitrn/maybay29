# Máy Bay Mừng 2/9 — ALPHA

Game arcade mừng Quốc khánh 2/9 (Phaser 3.90 + Vite + TS). PRD: `docs-prd.md`. Trạng thái: **ALPHA chơi được** (M2 — end-to-end start → chơi → điểm → leaderboard). Chưa deploy GitHub Pages (mốc M3, trước 01/09/2026).

## Cấu trúc
```
maybay29/
├── docs-prd.md        # PRD (sếp Jack.T đã duyệt)
├── fe/                # Vite + TS + Phaser 3.90
│   ├── src/scenes/    # Boot, Menu, Game, GameOver
│   ├── src/systems/   # textures sinh code, watchdog (copy pattern Pixel Quest), player id
│   ├── src/api/       # client BE /v2
│   └── e2e-alpha.mjs  # E2E Playwright headless
└── be/                # Fastify :8391, SQLite riêng data/maybay29.db
```

## Chạy BE (port 8391 — RIÊNG, không đụng pixel-quest :8390)
```bash
cd be && npm install && npm start
# log: /tmp/maybay29-be.log · CORS mặc định: localhost:5173/5174/4391 + thaitrn.github.io
# override: CORS_ORIGIN="url1,url2" npm start
```
Endpoints:
- `POST /v2/players` `{player_id, display_name}` — idempotent upsert (UUID v4)
- `POST /v2/scores` `{player_id, value, duration_s}` — phải register trước (PLAYER_NOT_FOUND)
- `GET /v2/leaderboard?limit=10` — top điểm mỗi player
- `GET /healthz`

## Chạy FE
```bash
cd fe && npm install
npm run dev        # dev server :5174 (VITE_API_BASE mặc định http://localhost:8391)
npm run build      # tsc --noEmit && vite build
npm run preview    # preview dist
VITE_API_BASE=https://... npm run build   # cho Pages (mốc M3)
```

## Gameplay (alpha)
- Menu: cờ đỏ sao vàng + "CHÀO MỪNG 2/9" + nút **BAY NGAY** (tap 1 lần).
- Ván 60s: máy bay tự bay trái→phải dưới màn hình; sao vàng rơi từ trời.
- **TAP = 1 pháo hoa** bay thẳng lên từ máy bay; trúng sao → nổ +20. Hứng sao bằng máy bay +10. "Khói" chạm → −5 (không chết, không thua sớm — đúng PRD).
- Hết giờ: pháo hoa chúc mừng → điểm + badge "Ngày Hội" (≥100) → auto submit BE → leaderboard.

## Bài học Pixel Quest đã áp dụng
1. Không camera fade trước scene.start (giết physics 3.90).
2. Watchdog tự hồi phục (`fe/src/systems/watchdog.ts`).
3. Mobile tap-to-act, không hold/drag.
4. Register player trước khi gửi score; duration_s `Math.max(1, …)`.
5. Texture sinh 100% bằng code (không asset file).

## Trạng thái alpha / chưa làm
- ✅ Core loop end-to-end, E2E Playwright 8/8 pass (`cd fe && node e2e-alpha.mjs`).
- ⬜ Âm thanh, nút chia sẻ điểm, metric rounds/play_seconds/best_score, deploy Pages (M3), QA mobile thật.
