# PRD v3 — Rebuild Máy Bay Mừng 2/9 và phục hồi GameHub

- Trạng thái: READY FOR BUILD
- Ngày: 2026-08-30
- Owner quyết định: Product/BA/Solution Architecture/UI-UX
- Phạm vi tài liệu: gameplay Maybay29, leaderboard contract, source/deploy provenance, điều kiện đưa lại vào GameHub
- Không thuộc phạm vi tài liệu: sửa code, tự duyệt production, tự thêm card GameHub trước các gate downstream

## 1. Executive decision — Product gate

Verdict của CEO là baseline: hiện chỉ Pixel Quest được coi là chơi được. Mọi approval cũ của Maybay29 hết hiệu lực.

MVP mới giữ thương hiệu **Máy Bay Mừng 2/9**, nhưng đổi fantasy và core loop thành:

> Người chơi là **Sứ giả Chim Lạc**, lái phi cơ lễ hội đỏ-vàng xuyên bầu trời Việt Nam. Máy bay tự tiến; **mỗi lần chạm tạo đúng một xung nâng**. Người chơi chọn đường bay để né mây giông/gió xoáy/chim bóng, xuyên cổng trời, gom sao và căn đường cho phi cơ tự phát pháo sáng vào mục tiêu. Chuỗi hành động tốt tăng combo và nạp trạng thái **Rực Trời**.

Quyết định bắt buộc:

1. **Một chạm, một hành động:** tap/pointerdown = một lift impulse. Không drag, không hold-to-steer, không nút bắn riêng, không thao tác khác trong gameplay.
2. **Một ván 60 giây**, có thể kết thúc sớm khi hết 3 tim; không cộng thời gian. Mục tiêu là vòng lặp dễ hiểu, chơi lại nhanh.
3. **Quiz lịch sử không thuộc MVP.** Baseline hiện ép quiz trước kết quả và cộng 30 điểm; việc này phá nhịp kết thúc và làm leaderboard trộn điểm arcade với kiến thức. Nếu làm lại ở pha sau, quiz chỉ là card tùy chọn sau màn kết quả, có nút bỏ qua ngay và tuyệt đối không đổi arcade score.
4. Không chỉ thay art. Build chỉ đạt khi control, pacing, obstacle/enemy variety, combo, progression và reward đều qua FUN-GATE.
5. Maybay29 chỉ trở lại GameHub sau FUN-PASS của PM, QA-PASS production và PM inventory gate. Khi trở lại, GameHub phải có **đúng 4 game**, không thay/xóa Pixel Quest, Game3 hoặc Babylon nếu không có lệnh CEO.

## 2. Evidence baseline — inspect source/live/provenance

### 2.1 Gameplay hiện tại

Nguồn inspect:

- `fe/src/scenes/GameScene.ts:15-20, 56-67, 105-133, 210-225, 241-266, 276-388, 470-489`
- `fe/src/scenes/HistoryQuizScene.ts:7-64`
- `fe/src/scenes/GameOverScene.ts:56-86, 104-111`
- `fe/src/api/client.ts:1-44`
- `be/src/server.js:6-61`

Actual baseline:

- Ván 60 giây nhưng clock item có thể nâng đến 75 giây.
- Control thực tế là giữ-rê ngón để lái 2D; pháo hoa tự bắn mỗi 0,5 giây. Menu vẫn ghi “TAP ... để bắn”, tạo mismatch hướng dẫn.
- Chỉ có star/smoke cùng hai special item; spawn rơi độc lập, chưa có obstacle pattern/cổng/enemy behavior tạo bài toán đường bay.
- Combo dựa trên auto-fire; một viên auto-fire bay khỏi màn tự làm đứt combo, nên reward không hoàn toàn phản ánh kỹ năng người chơi.
- Có 5 mạng; quiz bắt buộc chặn giữa gameplay và result, đáp án đúng cộng vào cùng arcade score.
- FE submit score và gọi leaderboard theo `/v2`; API client nuốt lỗi và chỉ hiện “Không tải được bảng vàng”.

Expected của rebuild: người chơi hiểu và làm chủ một control nhất quán, nhận challenge có telegraph, chủ động xây combo, thấy tiến triển trong từng ván và muốn bấm chơi lại.

### 2.2 Source/deploy provenance

Evidence kiểm trực tiếp ngày 2026-08-30:

- Live canonical hiện có: `https://thaitrn.github.io/maybay29/` trả HTTP 200.
- GitHub repo có thật: `https://github.com/thaitrn/maybay29`; default branch `main`, HEAD `447926951a237d5685b89317a750e8ac55e9c8e5` (`fix: plane intro fly-in (QA pass T1-T5)`).
- Tree của remote `main` chỉ có `index.html`, `assets/*`, `gf/*`: đây là **deployment artifact branch**, không có source TypeScript/backend.
- Thư mục local `/Users/thaitrn/Workspaces/work/maybay29` không có `.git`; vì vậy source hiện tại chưa có commit provenance.
- Live artifact khớp byte-for-byte với local `fe/dist`:
  - `index.html`: SHA-256 `2709aa737092d01dc7f927452509a53228957d538176d9818a0b2fb8176737d4`
  - `assets/index-rf-CEFBA.js`: SHA-256 `a6d9edf37001beb63a1aa88f3ec4287370e59cc5e10d0873f5726eb5ab21a9f6`
- Bundle production đang chứa `http://localhost:8391` và `/v2/*`. Với người dùng public, trình duyệt gọi localhost của chính người dùng; leaderboard production vì thế không có backend canonical dùng được.

Quyết định provenance cho release mới:

- Repo canonical: `thaitrn/maybay29`.
- Nhánh `source` phải chứa source buildable (`fe/`, `be/`, docs, lockfiles); mỗi release có source commit SHA.
- Nhánh `main` tạm tiếp tục là GitHub Pages artifact để giữ URL không gián đoạn; deployment commit phải ghi `source_sha=<40-char SHA>` và artifact phải được build từ đúng source SHA đó. Có thể migrate sang `main`=source, `gh-pages`=artifact ở roadmap sau, không chặn MVP.
- Canonical FE production dự kiến giữ `https://thaitrn.github.io/maybay29/` nếu QA probe xác nhận đúng build mới.
- Canonical BE HTTPS hiện **chưa tồn tại/chưa được chứng minh**. Backend owner phải publish và trả URL + health probe. Production build phải fail nếu API base là localhost, HTTP không TLS hoặc rỗng.

## 3. Benchmark — 4 flying arcade comparables

| Game / nguồn chính thống | Pattern đã chứng minh | Học cho Maybay29 | Không copy / trade-off |
|---|---|---|---|
| Jetpack Joyride — Halfbrick: `https://www.halfbrick.com/blog/jetpack-joyride-sep-1st` | Coin, nhiều vehicle, mission để level-up, Stash/upgrades, so điểm bạn bè | Một input đơn giản nhưng content variety và mục tiêu ngắn làm run có nhịp; leaderboard cần gắn progression/replay | Không đưa shop, nhiều vehicle hay mission vào MVP |
| Tiny Wings — App Store: `https://apps.apple.com/us/app/tiny-wings/id417817520` | “one button/one tap”, momentum, procedural daily world, mission, unlock bird, nest progression | Input tối giản vẫn có mastery nếu physics phản hồi nhất quán; reward meta tạo replay | Không dùng procedural art/daily mission trong MVP; chỉ local unlock nhẹ |
| Alto’s Odyssey — official press kit: `https://altosodyssey.com/press/` | One-touch trick, chain combo, 180 goals; biome có visual/gameplay riêng; balloon, rail, wall ride, weather; Zen Mode | Combo phải do hành động người chơi; variety nên mở theo phase/biome, không chỉ skin | Không scope-creep thành endless terrain, goal system hay nhiều nhân vật |
| Flappy Dragon — App Store: `https://apps.apple.com/us/app/flappy-dragon/id1586540488` | Nhiều world có gimmick, dragon có ability/control khác nhau, power-up phá tower/slow time, mastery reward | Fantasy sinh vật bay + world gimmick làm “flappy” có chiều sâu; power state giúp cao trào | MVP cố định một control, không dùng nhiều scheme TAP/HOLD/FOLLOW vì phá muscle memory |

Kết luận benchmark: công thức cần lấy là **control cực ít + obstacle có ngôn ngữ rõ + combo do kỹ năng + một power-state cao trào + reward nhìn thấy được**; không lấy breadth của shop, daily, 65+ nhân vật hay hàng trăm goals.

## 4. Target user, JTBD và outcome

### Persona chính

Người chơi web/mobile 8+, vào từ GameHub, chơi bằng một tay trong 1–5 phút; không muốn đọc tutorial dài hay đăng nhập.

### JTBD

“Khi có vài phút rảnh, tôi muốn vào game và làm chủ một nhịp bay dễ hiểu nhưng có thử thách tăng dần, để cảm thấy mình vừa tạo một màn bay lễ hội đẹp và muốn phá điểm ngay.”

### Outcome MVP

- Time-to-first-action: tối đa 2 tap từ khi page interactive.
- Người mới hiểu lift/né/nhặt trong 10 giây đầu mà không cần paragraph tutorial.
- Trong một run đủ 60 giây, người chơi gặp đầy đủ 3 obstacle archetype, 2 enemy behavior, 2 pickup type và ít nhất một cơ hội Rực Trời.
- Result xuất hiện ngay sau run; replay chỉ một tap.

## 5. Core loop và session pacing — BA/Product

### 5.1 State flow

`BOOT → MENU → PLAYING → RESULT → PLAYING`

Nhánh lỗi: `RESULT/LEADERBOARD_OFFLINE` vẫn cho chơi lại; API không được chặn render hoặc replay.

Không có `PLAYING → QUIZ → RESULT` trong MVP.

### 5.2 One-tap control

- Máy bay tự tiến theo trục ngang; thế giới cuộn từ phải sang trái.
- `pointerdown/touchstart/Space` tạo một lift impulse cố định; gravity kéo xuống giữa các tap.
- Mỗi pointerdown gameplay chỉ phát đúng một impulse. Pointermove/pointerup không đổi hướng; giữ ngón không lặp impulse.
- Auto-fire theo chu kỳ chỉ bắn thẳng trước mặt. Người chơi có agency bằng cách căn cao độ với enemy; auto-fire miss không làm mất combo.
- Chạm obstacle/enemy: mất 1 tim, break combo, bất tử 1 giây. Hết 3 tim thì kết thúc sớm.

### 5.3 Pacing 60 giây

| Thời gian | Mục tiêu | Content |
|---|---|---|
| 0–5s | Học không bị phạt | 1 cue “CHẠM ĐỂ NÂNG”, trail theo impulse, star line dẫn đường; chưa có collision damage trong 2,5s đầu |
| 5–20s | Xây confidence | Cổng Mây tĩnh + star line; 1 Chim Bóng bay thẳng; tốc độ cơ bản |
| 20–40s | Mix kỹ năng | Gió Xoáy đẩy cao độ có telegraph + Chim Bóng sine; xuất hiện Khiên Sen; tốc độ +10% |
| 40–55s | Cao trào | Pattern phối hợp nhưng luôn có một safe lane; tốc độ +20%; cơ hội nạp đủ Rực Trời |
| 55–60s | Finale/reward | Mưa sao và pháo hoa; không spawn pattern mới; fanfare, countdown 5 giây |

Spawn director dùng các pattern được thiết kế trước, không random từng vật thể độc lập. Không spawn hai hitbox tạo gap nhỏ hơn 1,6 lần chiều cao player; không spawn enemy trong vùng mù dưới HUD.

### 5.4 Content MVP

Obstacle:

1. **Cổng Mây**: hai cụm mây tạo gap tĩnh; telegraph viền sáng trước khi vào vùng va chạm.
2. **Gió Xoáy**: vùng lực đẩy lên/xuống; mũi tên gió báo hướng ít nhất 0,6 giây.
3. **Cột Mưa Giông**: hazard bật/tắt theo nhịp đã báo; người chơi chọn chờ cao độ hoặc luồn gap.

Enemy:

1. **Chim Bóng trinh sát**: bay ngang một lane, đường cảnh báo trước.
2. **Chim Bóng lượn**: sine chậm, có silhouette path; bị auto-fire hạ khi player căn cùng lane.

Pickup:

- **Sao Lạc**: +10 base point, tăng streak.
- **Khiên Sen**: chặn một hit trong tối đa 6 giây; không stack.

### 5.5 Scoring, combo và progression

Base event:

- Sao Lạc: 10
- Hạ Chim Bóng: 20
- Qua Cổng Mây sạch: 15
- Near-miss hợp lệ: 5, tối đa một lần/hazard

Combo multiplier áp lên base event: x1; x2 từ streak 5; x3 từ streak 10; x4 từ streak 20. Streak tăng bởi bốn event trên; chỉ break khi nhận damage. Auto-fire miss và khoảng lặng không break combo.

**Rực Trời meter** nhận 1 đơn vị mỗi streak event; đủ 12 thì tự kích hoạt 5 giây: shield, hút Sao Lạc gần, pháo hoa/audio tăng cường. Meter reset sau activation. Đây là progression trong run, phải có cơ hội kích hoạt trong một run người chơi tốt.

Meta progression MVP dùng local storage, không cần account:

- `best_score`, `total_stars`, `selected_skin`, `unlocked_skins`.
- Mặc định Sứ giả đỏ-vàng; mở skin “Sen Vàng” ở 100 total stars và “Trống Đồng” ở 300 total stars.
- Skin chỉ cosmetic, không đổi hitbox/physics/score.

## 6. User stories và acceptance criteria

### US-01 — Vào chơi ngay (Must)

Là người chơi mới, tôi muốn bắt đầu nhanh để không bỏ game trước khi hiểu nó.

- AC-01.1: Từ page interactive đến gameplay tối đa 2 tap.
- AC-01.2: Menu có một CTA chính “BAY NGAY”; target tối thiểu 44×44 CSS px.
- AC-01.3: 2,5 giây đầu không gây damage; cue lift biến mất sau input hợp lệ đầu tiên.
- AC-01.4: Không login, form tên hay quiz trước run.

### US-02 — Điều khiển bằng một chạm (Must)

- AC-02.1: Mỗi pointerdown/Space đang PLAYING tạo đúng một lift impulse; hold/drag/move không tạo thêm impulse.
- AC-02.2: Input có phản hồi visual/audio trong <=100ms ở production mobile emulation.
- AC-02.3: `touch-action:none`; trang không scroll/zoom do thao tác gameplay.
- AC-02.4: Cùng input timeline trên cùng config tạo trajectory tương đương, không phụ thuộc FPS; physics dùng delta time có clamp.

### US-03 — Challenge đa dạng nhưng công bằng (Must)

- AC-03.1: Một run đủ 60s gặp cả 3 obstacle archetype và 2 enemy behavior.
- AC-03.2: Mỗi hazard có telegraph >=600ms; safe lane nhìn thấy trước khi phải quyết định.
- AC-03.3: 100 seeded runs tự động không sinh overlap vi phạm gap 1,6× player hoặc hazard trong HUD.
- AC-03.4: Collision hitbox không lớn hơn phần thân nhìn thấy; có forgiveness inset ít nhất 6 px ở design resolution.

### US-04 — Combo và Rực Trời (Must)

- AC-04.1: Event hợp lệ tăng streak; damage reset streak; auto-fire miss không reset.
- AC-04.2: HUD hiển thị multiplier và meter, phản hồi trong <=200ms sau event.
- AC-04.3: Score trên HUD đúng công thức base × multiplier; result bằng đúng HUD cuối run.
- AC-04.4: Đủ 12 event kích Rực Trời đúng 5 giây; shield/hút sao/FX bắt đầu và kết thúc nhất quán.

### US-05 — Kết quả và replay (Must)

- AC-05.1: Sau chết hoặc mốc 60s, result hiện trong <=1,5 giây, không có quiz/interstitial bắt buộc.
- AC-05.2: Result có score, best, max combo, stars, trạng thái leaderboard và CTA “CHƠI LẠI”.
- AC-05.3: Chơi lại một tap, reset toàn bộ transient state nhưng giữ local progression.
- AC-05.4: Backend timeout/error không chặn result/replay; status nói rõ “Bảng xếp hạng đang offline”.

### US-06 — Leaderboard đáng tin ở mức casual MVP (Must)

- AC-06.1: FE tạo run với server trước khi chơi và finish đúng một lần; retry cùng run id idempotent.
- AC-06.2: Server tự tính/đối chiếu score từ summary, validate duration/event bounds và từ chối run hết hạn/đã dùng/sai owner.
- AC-06.3: Leaderboard lấy personal best đã accepted, tie-break bằng `achieved_at` sớm hơn.
- AC-06.4: Production bundle không chứa `localhost`, HTTP API hoặc secret; health, POST run→finish và GET leaderboard chạy qua HTTPS canonical BE.

### US-07 — Reward dài hạn nhẹ (Should)

- AC-07.1: total stars và unlock thresholds persist sau reload.
- AC-07.2: Unlock toast chỉ hiện sau result, không che gameplay/replay CTA.
- AC-07.3: Cosmetic không đổi gameplay và không được gửi làm yếu tố score.

### US-08 — Accessibility/comfort (Should)

- AC-08.1: Score/tim/combo không truyền nghĩa chỉ bằng màu; text/icon đều có contrast đủ đọc.
- AC-08.2: Có mute target >=44px; lựa chọn persist.
- AC-08.3: `prefers-reduced-motion` giảm shake/particle nhưng không đổi telegraph hoặc physics.
- AC-08.4: Keyboard Space chơi được, Enter kích CTA, focus visible ngoài canvas.

## 7. FUN-GATE — không thay bằng test pass

### 7.1 Hard gate trước self-play

Tất cả Must AC ở mục 6 phải có evidence. Ngoài ra:

- Production load không có uncaught error trong full loop + replay.
- Design resolution 480×720 hiển thị không crop HUD/CTA ở viewport 320×568, 390×844 và desktop.
- Một run đủ phải thể hiện đúng pacing table, không có khoảng >5 giây mà không có decision, reward hoặc telegraph mới.

### 7.2 PM FUN-GATE

PM tự chơi canonical production liên tục tối thiểu 5 phút trên mobile/touch, hoàn thành tối thiểu 5 run hoặc 5 lần restart nếu chết sớm. Ghi evidence từng run: duration, score, max combo, archetype đã gặp, Rực Trời có/không, lý do chết và có tự nguyện replay hay không.

Chấm 1–5 cho 5 tiêu chí:

1. Control phản hồi và có mastery.
2. Hazard rõ/công bằng.
3. Pacing không phẳng hoặc rối.
4. Combo/Rực Trời tạo “đã tay”.
5. Muốn phá điểm/chơi lại.

**FUN-PASS chỉ khi** trung bình >=4,0; không mục nào <3; đã tự nguyện bấm replay ít nhất 2 lần; không có Must AC fail. Nếu fail, request changes phải nêu run/timecode, expected vs actual, impact và sửa gì.

### 7.3 QA independent fun/release gate

QA lặp exploratory 5 phút độc lập trên canonical production, cộng automated/browser evidence. QA pass không thay thế PM FUN-PASS và PM pass không thay thế QA. Sau thay đổi gameplay bất kỳ, cả hai approval hết hiệu lực.

## 8. Backend leaderboard contract v3 — Solution Architecture

Base URL production: `https://<canonical-backend>` — backend owner phải thay placeholder bằng URL đã probe trước release. JSON UTF-8; `Content-Type: application/json`; CORS allowlist chỉ FE canonical và local dev đã định danh.

### 8.1 Endpoints

#### `POST /v3/players`

Request:

```json
{"player_id":"uuid-v4","display_name":"Phi công 2/9"}
```

- Idempotent upsert.
- `display_name`: trim, 1–24 Unicode chars; server escape output; không nhận HTML/control chars.
- Response 201 lần đầu, 200 khi update.

#### `POST /v3/runs`

Request:

```json
{"player_id":"uuid-v4","client_version":"source-sha-or-semver"}
```

Response 201:

```json
{"run_id":"uuid-v4","started_at":"ISO-8601","expires_at":"ISO-8601","config_version":"mb29-v3"}
```

#### `POST /v3/runs/{run_id}/finish`

Request:

```json
{
  "player_id":"uuid-v4",
  "duration_ms":60000,
  "score":1234,
  "finish_reason":"timer",
  "stats":{
    "stars":20,
    "enemies":4,
    "gates":8,
    "near_misses":3,
    "base_points":415,
    "combo_bonus":819,
    "max_combo":22
  }
}
```

Response 201; retry cùng payload trả 200 cùng body:

```json
{"accepted":true,"score":1234,"personal_best":true,"rank":7,"achieved_at":"ISO-8601"}
```

Validation tối thiểu:

- Run tồn tại, đúng player, chưa finish với payload khác, chưa quá 120 giây server time.
- `duration_ms` integer 1000..60000 và không vượt server elapsed + 5000ms.
- Các stats là integer không âm; giới hạn theo config: stars <=80, enemies <=40, gates <=40, near_misses <=40, max_combo <=200.
- `base_points = stars*10 + enemies*20 + gates*15 + near_misses*5`.
- `combo_bonus` từ 0 đến `base_points*3`; `score = base_points + combo_bonus`; `score <=10000`.
- `finish_reason ∈ {timer, lives, abandon}`; abandon không lên leaderboard.
- Server không tin display name/achieved_at/rank từ client.

Lỗi chuẩn:

```json
{"error":{"code":"INVALID_SCORE","message":"...","request_id":"..."}}
```

Mã chính: `INVALID_PLAYER_ID`, `PLAYER_NOT_FOUND`, `RUN_NOT_FOUND`, `RUN_EXPIRED`, `RUN_ALREADY_FINISHED`, `INVALID_DURATION`, `INVALID_STATS`, `INVALID_SCORE`, `RATE_LIMITED`.

#### `GET /v3/leaderboard?limit=10`

- `limit` 1..50, default 10.
- Một row tốt nhất/player; tie score thì `achieved_at ASC`.

```json
{
  "leaderboard":[
    {"rank":1,"display_name":"Phi công 2/9","score":1234,"max_combo":22,"achieved_at":"ISO-8601"}
  ],
  "config_version":"mb29-v3"
}
```

#### `GET /healthz`

Response 200 gồm `ok`, `version`, `db` nhưng không lộ secret/path.

### 8.2 Data model

- `player(id PK, display_name, created_at, updated_at)`
- `run(id PK, player_id FK, client_version, config_version, started_at, expires_at, finished_at, finish_hash UNIQUE)`
- `score(id PK, run_id UNIQUE FK, player_id FK, value, duration_ms, finish_reason, stars, enemies, gates, near_misses, base_points, combo_bonus, max_combo, achieved_at, accepted)`
- `daily_stats(player_id, date, rounds, play_seconds, best_score, PRIMARY KEY(player_id,date))` — optional analytics, không quyết định leaderboard.

Index: `score(accepted, value DESC, achieved_at ASC)`, `score(player_id, value DESC)`, `run(player_id, started_at DESC)`.

Security/performance:

- Rate limit theo IP + player: create run 30/phút, finish 30/phút, leaderboard 60/phút.
- Body <=16KB; prepared statements/transaction khi finish; WAL/backup nếu còn SQLite.
- Không coi UUID là auth. Contract chỉ chống lỗi/replay/score vô lý ở mức casual; client giả mạo tinh vi vẫn là residual risk.
- GET leaderboard p95 <300ms và finish p95 <500ms ở 50 concurrent requests trên target hosting.

## 9. UI/UX design spec — mobile first

### Layout

- Portrait 480×720 design space, scale FIT, center both axes.
- HUD top safe-area: trái score, giữa combo+meter, phải 3 tim + mute; không che play lane.
- Play lane dùng 70% giữa màn; telegraph luôn ở phía trước hướng scroll.
- Result bottom CTA: “CHƠI LẠI” primary full width; leaderboard nằm sau score summary, không đẩy CTA khỏi fold.

### Visual language

- Giữ bản sắc lễ hội Việt Nam nhưng giảm đỏ phủ toàn màn để hazard dễ đọc.
- Tokens: sky `#123A63`, flag red `#DA251D`, star yellow `#FFD84D`, paper `#F5E9D0`, ink `#2B2118`, success `#28A745`, danger `#E5484D`.
- Player đỏ-vàng có white/cream outline 2–3px; hazard tím/xám đậm; pickup vàng/xanh. Không dùng màu đỏ của cờ cho enemy body.
- Font system hỗ trợ tiếng Việt: `"Be Vietnam Pro", system-ui, Arial, sans-serif`; fallback không được mất dấu.
- Animation: impulse squash/stretch 120ms; collect pop 180ms; combo tier 240ms; Rực Trời 5s nhưng không flash >3Hz. Shake <=150ms, giảm/tắt theo reduced motion.
- Audio: lift nhẹ, collect có pitch tăng theo tier, damage khác rõ, Rực Trời fanfare ngắn; mute persist.

Copy tối thiểu:

- Menu: “CHẠM ĐỂ GIỮ NHỊP BAY”
- First cue: “CHẠM ĐỂ NÂNG”
- Offline: “Bảng xếp hạng đang offline — điểm vẫn lưu trên máy.”
- No quiz in MVP.

## 10. MoSCoW và out of scope

### Must

One-tap lift; 60s pacing director; 3 obstacle + 2 enemy + 2 pickup; combo/Rực Trời; 3 lives; result/replay; local best; v3 run/finish/leaderboard; source/deploy provenance; production HTTPS; PM/QA FUN gates.

### Should

Hai cosmetic unlock; mute persist; reduced motion; keyboard parity; local offline queue một finish chưa gửi (TTL còn hiệu lực).

### Could

Quiz tùy chọn sau result không điểm; daily mission; more biomes; share score; cloud-save cosmetics.

### Won’t in MVP

Shop/IAP, ads, account/login, multiplayer, boss, nhiều control scheme, nhiều character ability, endless mode, quiz bắt buộc/cộng leaderboard score, server-authoritative physics replay.

## 11. GameHub restoration contract

Chỉ áp dụng sau downstream QA-PASS và PM inventory approval:

```ts
{
  id: 'maybay29',
  name: 'Máy Bay Mừng 2/9',
  shortDescription: 'Chạm để giữ nhịp bay, né mây giông và chim bóng, gom sao tạo combo trong hành trình rực trời 2/9.',
  status: 'Live',
  tags: ['Arcade', 'Một chạm', 'Bay lượn'],
  art: 'flight',
  coverAlt: 'Phi cơ Chim Lạc đỏ vàng bay qua cổng mây và pháo hoa lễ hội 2/9.',
  playUrl: 'https://thaitrn.github.io/maybay29/',
  ctaLabel: 'Chơi ngay',
  published: true,
  sortOrder: 4,
  owner: 'thaitrn',
  lastVerifiedAt: '<ngày QA production>'
}
```

Inventory sau restore: Pixel Quest, Game3, Babylon Pilot, Maybay29 — đúng 4 record. `playUrl`, `status`, `lastVerifiedAt` chỉ được chốt khi production smoke pass; không lấy HTTP 200 đơn thuần làm bằng chứng “chơi được”.

## 12. Release evidence checklist và rủi ro

Evidence bắt buộc handoff:

1. Source branch + source SHA; clean build từ checkout đó.
2. Artifact hash + deploy commit chứa source SHA; live hash khớp artifact.
3. Canonical FE/BE URLs; health; v3 POST player → create run → finish → GET leaderboard thật.
4. Automated acceptance cho physics/input/pattern/scoring/API; production mobile full loop và replay.
5. PM 5-minute FUN log và QA 5-minute independent log.
6. GameHub chỉ update sau gate tổng hợp riêng.

Residual risks:

- Source hiện chưa versioned; nhánh `source` là release blocker cho FE/BE.
- Canonical backend HTTPS chưa biết; production leaderboard hiện chắc chắn trỏ localhost. Backend owner chịu trách nhiệm chốt URL/probe.
- Summary validation giảm cheat phổ thông nhưng không chống client giả mạo hoàn toàn.
- Random pattern có thể tạo unfair sequence nếu director/seed tests không đủ; giữ curated pattern pool trong MVP.
- Fantasy/FX có nguy cơ che telegraph trên máy nhỏ; reduced motion và contrast phải được exploratory check.

## 13. Responsibility / next action

- Frontend: implement core loop/UI theo AC, thiết lập source provenance, build/deploy canonical FE và self-play full session.
- Backend: implement/verify v3 contract, persistence/validation/rate limit, deploy HTTPS và probe POST→GET.
- PM acceptance downstream: tự chơi >=5 phút, chấm FUN-GATE; không tái dùng approval cũ.
- QA: independent production evidence + exploratory 5 phút.
- PM GameHub downstream: chỉ duyệt 4-game inventory sau tất cả game gates trong graph; sau đó frontend GameHub mới sửa/publish.
