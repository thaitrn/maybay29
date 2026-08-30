# Prompt Pack MEOWA — maybay29 (Quốc khánh 2/9)

Thư viện prompt dựng sẵn để sinh asset pixel-art lễ hội Việt Nam (đỏ/vàng) cho game **maybay29** bằng Meowa CLI.
Repo CLI đã clone tại `~/Workspaces/tools/meowa-skills` (nguồn: https://github.com/Meowa-AI/meowa-skills — lệnh thật đã chạy: git clone thành công, xem `sop-meowa.md`).
Trạng thái: **CHƯA CÓ KEY** — các prompt dưới đây CHƯA chạy. KHÔNG chạy lệnh sinh trước khi có key.

## Cách dùng 1 prompt (gõ một dòng)

    cd ~/Workspaces/tools/meowa-skills
    python3 skills/game-assets/meowart_api.py pixel-gen-run --template-name PRESET --requirement "REQ BÊN DƯỚI" --aspect-ratio RATIO --output-dir ./outputs/maybay29/MÃ-ASSET

## Quy ước bắt buộc (bằng chứng: skills/game-assets/SKILL.md và references/pixel-and-hd-assets.md trong repo meowa-skills)

1. PRESET lấy tên chính xác từ lệnh `pixel-gen-template-info` sau khi có key — KHÔNG tự bịa tên preset. Ưu tiên preset 64x64 cho prop nhỏ; asset lớn dùng `large-pixel-gen-run`.
2. Prompt viết ngôn ngữ tự nhiên ngắn gọn ("Write simple natural-language prompts" — SKILL.md), không keyword-stack.
3. Giữ nhất quán style: cùng [STYLE] + cùng preset kích thước giữa các asset liên quan.
4. Animation: sinh STILL trước, duyệt ổn rồi mới animate ("animate only after the design is stable" — SKILL.md); canvas không quá 128x128 cho asset động.
5. Parallax ngang: có thể dùng `side-scrolling-map-run` sinh 3 lớp bg/mid/fg trong 1 lệnh thay vì 3 prompt riêng.
6. SFX: dùng `sound-run` (alias `sfx-run`) — module references/audio.md.

[STYLE] = "Vietnamese National Day festival pixel art, red and gold palette, dark night sky, transparent background, soft warm glow, consistent top-left light."

## A. Máy bay — 4 hướng + idle (5 prompt)

Giữ CÙNG một chiếc máy bay qua 4 hướng: chạy MB-01 trước, các hướng còn lại dùng MB-01 làm ảnh tham chiếu (`--reference-file`, bằng chứng: references/pixel-and-hd-assets.md mục hướng dẫn multi-view).

| Mã | Aspect | Requirement |
|---|---|---|
| MB-01 | 1:1 | [STYLE] one small vintage propeller airplane seen from directly above, flying upward on the screen, red fuselage with gold star emblem, cream wings. |
| MB-02 | 1:1 | [STYLE] the same vintage propeller airplane seen from directly above, flying downward on the screen. |
| MB-03 | 1:1 | [STYLE] the same vintage propeller airplane seen from directly above, flying to the left. |
| MB-04 | 1:1 | [STYLE] the same vintage propeller airplane seen from directly above, flying to the right. |
| MB-05 | animate | IDLE: dùng animate-run với ảnh MB-01, requirement: gentle hover bob with slow propeller spin, 8 frames, seamless loop. |

## B. Vật phẩm — sao / khói / bigstar / đồng hồ (4 prompt)

| Mã | Aspect | Requirement |
|---|---|---|
| IT-01 | 1:1 | [STYLE] one small gold five-pointed star pickup, simple and readable at 32px, transparent background. |
| IT-02 | 1:1 | [STYLE] one puff of soft grey-white smoke cloud, simple round shape, transparent background. |
| IT-03 | 1:1 | [STYLE] one large radiant golden star trophy with warm glow, still readable silhouette. |
| IT-04 | 1:1 | [STYLE] one small round countdown clock, cream face, gold rim, red star at center, transparent background. |

## C. Pháo hoa nổ (2 prompt)

| Mã | Aspect | Requirement |
|---|---|---|
| FW-01 | 1:1 | [STYLE] one firework burst at full bloom, red and gold sparks radiating symmetrically from center, transparent background. |
| FW-02 | animate | dùng animate-run với FW-01, requirement: firework expanding then fading, 10-12 frames, seamless loop. |

## D. Parallax Hà Nội — lăng Bác / tháp Rùa / Long Biên (3 prompt)

3 lớp cuộn ngang, khuyến nghị chạy 1 lệnh `side-scrolling-map-run` (3 lớp trong 1 job) thay vì 3 prompt rời; giữ 3 prompt này làm requirement từng lớp.

| Mã | Lớp | Aspect | Requirement |
|---|---|---|---|
| BG-01 | background xa | 16:9 | [STYLE] distant Hanoi night skyline with the Ho Chi Minh Mausoleum silhouette, dark indigo sky, small stars. |
| BG-02 | midground | 16:9 | [STYLE] Hanoi Hoan Kiem lake middle layer with Turtle Tower silhouette and tree line, darker green palette. |
| BG-03 | foreground | 16:9 | [STYLE] near layer with Long Bien bridge steel truss silhouette passing fast, darkest silhouette shapes. |

## E. Đèn lồng + băng rôn (2 prompt)

| Mã | Aspect | Requirement |
|---|---|---|
| LN-01 | 1:1 | [STYLE] one hanging red Vietnamese lantern with gold tassel and warm inner glow, transparent background. |
| BR-01 | 3:1 | [STYLE] one festive red banner with gold star and the words "2-9", flat front view, transparent background. |

## F. SFX (2 prompt — lệnh `sound-run`)

| Mã | Requirement |
|---|---|
| SFX-01 | one short bright coin-like pickup chime under 1 second, cheerful arcade feel. |
| SFX-02 | one soft firework pop under 1.5 seconds, festive and not scary. |

Tổng: 18 prompt (16 hình + 2 SFX).
