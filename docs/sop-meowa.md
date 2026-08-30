# SOP sử dụng Meowa (khi cần bật)

Áp dụng cho maybay29 và pixel-quest. Trạng thái hiện tại: CLI đã dựng xong, CHƯA mua key, chưa tốn phí.
Bằng chứng đã chạy thật: `git clone` thành công vào `~/Workspaces/tools/meowa-skills`; lệnh `python3 skills/game-assets/meowart_api.py --version` in ra `meowart_api.py 2026.08.25.1`; lệnh `pixel-gen-template-info` hiện lỗi "Meowa authentication is not configured" — đúng như kỳ vọng khi chưa có key.

## Bước 0 — Khi nào bật

Sếp quyết định cần asset mới (ví dụ sau 2/9, hoặc skins mới). Lúc đó mới mua key.

## Bước 1 — Mua key

1. Vào https://meowa.ai , đăng nhập, mở trang API Keys (https://meowa.ai/#/api-keys).
2. Mua gói Starter (khoảng 6 USD — kiểm tra giá hiện tại trên web tại thời điểm mua).
3. Bấm Create API Key, copy key dạng `ma_live_...`. KHÔNG dán key vào chat, prompt, command line, screenshot hay Git (nguyên tắc chính thức của repo meowa-skills, file meowart_api.md).

## Bước 2 — Cắm key

Tạo file `.env` ngay trong thư mục `~/Workspaces/tools/meowa-skills`:

    MEOWART_API_KEY="ma_live_xxxxxxxxxxxxxxxxxxxx"

- Runner tự đọc `.env` từ thư mục hiện hành hoặc thư mục của script (bằng chứng: meowart_api.py dòng 6473-6475 liệt kê các vị trí .env được dò).
- Đảm bảo `.env` bị Git ignore; kiểm tra bằng `git check-ignore .env`.
- Chỉ ghi đúng giá trị key, không thêm "Bearer" hay tiền tố khác.

Kiểm tra key sống:

    cd ~/Workspaces/tools/meowa-skills
    python3 skills/game-assets/meowart_api.py credits-balance

Trả về total_credits = cấu hình thành công.

## Bước 3 — Sinh asset

1. Liệt kê preset: `python3 skills/game-assets/meowart_api.py pixel-gen-template-info` — chọn preset đúng kích thước.
2. Chạy 1 prompt từ prompt-pack (gõ một dòng):

    python3 skills/game-assets/meowart_api.py pixel-gen-run --template-name PRESET --requirement "REQ" --aspect-ratio RATIO --output-dir ./outputs/maybay29/MA-ASSET

3. Kết quả nằm trong subfolder slug + file `final_outputs.json` (chỉ chứa media đã validate).
4. Nếu job bị gián đoạn: KHÔNG nộp lại (tốn phí lần nữa) — dùng `pixel-gen-poll` với job_id cũ.

## Bước 4 — Designer duyệt style

- Sinh 1 asset mẫu mỗi nhóm (máy bay / enemy / tileset) trước, duyệt style rồi mới sinh số lượng.
- Duyệt ở integer zoom, nearest-neighbor; kiểm tra khung hình, hướng nhìn, khoảng trống chuyển động.

## Bước 5 — Handoff FE

- Bàn giao đúng file trong subfolder output + final_outputs.json.
- KHÔNG đụng code game — FE tự tích hợp theo workflow công ty (QC → FE → QA, deploy GitHub Pages).

## Bước 6 — QA verify

Chạy checklist bên dưới trước khi chấp nhận asset.

## Checklist QA asset

| # | Hạng mục | Chuẩn | Cách kiểm |
|---|---|---|---|
| 1 | Kích thước | đúng preset đã chọn (vd 64x64) | mở file, xem dimensions |
| 2 | Số frame animation | đủ như yêu cầu (4-8 frame) | đếm frame trong sheet/GIF |
| 3 | Transparency | nền trong suốt, không viền màu | xem alpha channel, thử đặt lên nền game |
| 4 | Khối lượng | dưới 200KB mỗi asset | ls -la / Get Info |
| 5 | Nhất quán style | cùng palette, cùng hướng sáng | so sánh trực quan với asset mẫu đã duyệt |
| 6 | Pixel sạch | không bị blur/mở rộng lệch grid | zoom integer kiểm tra |
| 7 | Loop animation | frame cuối nối frame đầu mượt | chạy preview vòng lặp |
| 8 | Readability | đọc rõ ở kích thước gameplay thật | xem ở scale game thực tế |

Lưu ý an toàn: nếu runner báo `skill_upgrade_required`, cập nhật repo bằng `git pull --ff-only` rồi poll lại job cũ theo job_id — KHÔNG submit mới (nguồn: meowart_api.md).
