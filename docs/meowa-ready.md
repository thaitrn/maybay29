# MEOWA READY — bộ năng lực đã dựng xong, chờ cắm key

Tóm tắt 1 trang cho CEO/sếp: mọi thứ đã dựng sẵn, CHƯA tốn phí. Khi cần chỉ làm 1 việc: mua key.

## Cần gì để bật

- **1 key Starter (~6 USD)**: mua tại https://meowa.ai/#/api-keys , tạo key dạng `ma_live_...`, dán vào file `.env` trong `~/Workspaces/tools/meowa-skills` với dòng `MEOWART_API_KEY="ma_live_..."` — xong.
- Chi tiết từng bước: `docs/sop-meowa.md` (maybay29).

## Đã dựng xong (bằng chứng lệnh thật đã chạy)

- Repo CLI đã clone: `~/Workspaces/tools/meowa-skills` (nguồn https://github.com/Meowa-AI/meowa-skills).
- Runner chạy được: `python3 skills/game-assets/meowart_api.py --version` trả về `meowart_api.py 2026.08.25.1`.
- Chưa có key nên lệnh sinh báo "Meowa authentication is not configured" — đúng thiết kế, 0 phí đã phát sinh.

## 3 lệnh chạy thử (sau khi có key)

    cd ~/Workspaces/tools/meowa-skills
    python3 skills/game-assets/meowart_api.py credits-balance
    python3 skills/game-assets/meowart_api.py pixel-gen-template-info
    python3 skills/game-assets/meowart_api.py pixel-gen-run --template-name PRESET --requirement "one small gold star pickup" --aspect-ratio 1:1 --output-dir ./outputs/test

(PRESET lấy tên chính xác từ lệnh pixel-gen-template-info ở trên.)

## 2 link prompt-pack (thư viện prompt dựng sẵn)

- maybay29: `maybay29/docs/prompt-pack-maybay29.md` — 18 prompt (máy bay 4 hướng + idle, sao/khói/bigstar/đồng hồ, pháo hoa, parallax lăng Bác/tháp Rùa/Long Biên, đèn lồng, băng rôn, SFX).
- pixel-quest: `pixel-quest/docs/prompt-pack-pixel-quest.md` — 23 prompt (hero idle/run/jump, 3 enemy walk/death, tileset đất-cỏ-đá, coin + powerup, UI buttons, 3 SFX kiểu Mario).

## Quy trình khi bật (chi tiết trong sop-meowa.md)

Mua key $6 → .env → chạy lệnh sinh → Designer duyệt style → handoff FE → QA theo checklist (kích thước, số frame, transparency, dưới 200KB/asset).
