# PRD Nhanh — Máy Bay Mừng 2/9

**Loại:** Arcade shooter/表演 nhẹ · **Tech:** Phaser 3 + Vite + TS · **Nền:** Mobile-first (GitHub Pages)
**Deadline:** Release trước **01/09/2026** · **Trạng thái:** Chờ sếp Jack.T duyệt (duyệt nhanh: "Duyệt")

## 1. Concept & Gameplay loop
Máy bay biểu diễn tự bay qua trời Quốc khánh; người chơi **tap 1 lần = 1 hành động** (bắn pháo hoa chúc mừng / thu sao vàng, né vật cản) để ghi điểm cao nhất trong 60–90 giây — không hold, không drag.

## 2. Tính năng MVP
1. Màn hình start: cờ đỏ sao vàng + chữ "Chào mừng 2/9", nút chơi to rõ.
2. Gameplay 60–90s/ván: máy bay tự bay, tap bắn pháo hoa trúng mục tiêu + thu sao vàng tính điểm, kết thúc khi hết giờ.
3. Màn kết: pháo hoa chúc mừng + điểm + badge "Ngày Hội" (đạt ngưỡng điểm).
4. Leaderboard điểm + nút chia sẻ điểm (link/ảnh).
5. Âm thanh + hiệu ứng nhẹ (pháo hoa, sao vàng) — đủ vui, không nặng.

## 3. Độ khó & đối tượng
- Dễ, tăng nhẹ theo thời lượng ván; không thua sớm — luôn hết giờ mới tính điểm.
- Đối tượng: trẻ ~10 tuổi (người chơi chính) + người lớn; 1 ngón tay, chơi ngay không hướng dẫn.

## 4. Metric tối thiểu (log về server)
- `rounds` (số ván chơi), `play_seconds` (tổng giây chơi), `best_score`.

## 5. Out of scope (không làm)
- Không i18n (chỉ tiếng Việt) · Không quảng cáo · Không mua sắm/IAP · Không tài khoản đăng nhập.

## 6. Phân công đề xuất
| Vai trò | Việc |
|---|---|
| FE (game) | Phaser 3 + Vite + TS, deploy GitHub Pages (reuse pipeline Pixel Quest) |
| BE | Reuse Fastify :8390 — thêm prefix `pq2` (hoặc board riêng) cho leaderboard + metric |
| Designer | Màu lễ hội đỏ/vàng, cờ sao vàng, máy bay giấy/ biểu diễn |
| QA | Chạy thử mobile (iOS/Android browser), metric log, alpha → release |

## 7. Timeline (3 mốc)
| Mốc | Ngày | Kết quả |
|---|---|---|
| M1 | 25–26/08 | PRD được duyệt, setup repo + board `pq2` |
| M2 | 30/08 | Alpha chơi được end-to-end (start → chơi → điểm → leaderboard) |
| M3 | **01/09** | Release GitHub Pages + QA pass, sẵn sàng mừng 2/9 |

---
*Câu hỏi mở: none — duyệt là làm ngay.*
