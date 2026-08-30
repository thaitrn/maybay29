# Design đặc trưng dân tộc Việt Nam — Quốc khánh 2/9

Game: Máy Bay Mừng 2/9 (Phaser 3, texture vẽ 100% bằng code). Người chơi: gia đình VN, trẻ 10 tuổi.

## 1. Nguồn tham khảo (web search)

1. Cờ đỏ sao vàng tung bay, cả nước rực rỡ chào mừng Quốc khánh 2/9 — VietNamNet: https://vietnamnet.vn/co-do-sao-vang-tung-bay-ca-nuoc-ruc-ro-chao-mung-quoc-khanh-2-9-2317674.html
2. Phố phường Hà Nội rợp cờ đỏ sao vàng (Ba Đình, băng rôn "Độc lập - Tự do - Hạnh phúc", thiếu nhi cầm cờ) — VTC News: https://vtcnews.vn/pho-phuong-ha-noi-rop-sac-co-do-sao-vang-huong-ve-ngay-quoc-khanh-2-9-ar959745.html
3. Hà Nội "nhuộm" sắc đỏ sao vàng (Hồ Gươm, tháp Rùa, cầu Thê Húc, phố Hàng Mã "trái tim đỏ") — Phụ Nữ Mới: https://phunumoi.net.vn/ha-noi-nhuom-sac-do-sao-vang-chao-mung-quoc-khanh-2-9-d328781.html
4. Quy cách quốc kỳ: tỷ lệ 2/3, nền đỏ tươi, sao vàng 1 góc chỉ thẳng lên — Nhân Dân: https://nhandan.vn/co-do-sao-vang-bieu-tuong-thieng-lieng-dac-biet-cua-dan-toc-viet-nam-post712980.html ; Wikipedia: https://vi.wikipedia.org/wiki/Qu%E1%BB%91c_k%E1%BB%B3_Vi%E1%BB%87t_Nam
5. Tranh dân gian Đông Hồ (gà, "Lý ngư vọng nguyệt" = ý chí vươn lên; 4 màu tự nhiên: đen than tre, vàng hoa hòe, đỏ son, xanh chàm) — Bảo tàng Lịch sử VN: https://baotanglichsu.vn/vi/Articles/3096/19432/tim-hieu-ve-dong-tranh-dan-gian-djong-ho.html ; ArtNam: https://artnam.vn/y-nghia-tranh-dong-ho
6. Trống đồng Đông Sơn (sao 12–14 cánh tượng trưng mặt trời, chim lạc, hoa văn tam giác lồng nhau) — Wikipedia: https://vi.wikipedia.org/wiki/Tr%E1%BB%91ng_%C4%91%E1%BB%93ng_%C4%90%C3%B4ng_S%C6%A1n ; Hà Nội Mới: https://hanoimoi.vn/thong-diep-tu-nhung-hoa-van-dong-son-39484.html
7. Đèn lồng / vật phẩm trang trí 2/9 phố Hàng Mã — Đại Biểu Nhân Dân: https://daibieunhandan.vn/pho-hang-ma-ruc-ro-sac-co-do-sao-vang-chao-mung-quoc-khanh-2-9-10383549.html ; VOV: https://vov.vn/kinh-te/nhon-nhip-thi-truong-trang-tri-chao-mung-quoc-khanh-29-post1223434.vov
8. Hoa sen — biểu tượng thuần Việt trong concept trang trí 2/9 — Thế Giới Hoa Lụa: https://thegioihoaluadvn.com/https-thegioihoaluadvn-com-quoc-khanh-2-9

## 2. Chọn lọc biểu tượng hợp game arcade mobile

Tiêu chí chọn: hình khối đơn giản (rect/circle/polygon), nhận diện ngay là "2/9 VN", vẽ được bằng Phaser Graphics/canvas, không cần ảnh ngoài.

| Biểu tượng | Vẽ code? | Kết luận |
|---|---|---|
| Cờ đỏ sao vàng (đã có) | Dễ | Giữ; chuẩn hóa theo quy cách: sao 1 cánh chỉ thẳng lên, tâm giữa cờ (nguồn 4) |
| Pháo hoa (đã có) | Dễ | Giữ |
| Băng rôn "CHÀO MỪNG 2-9" | Dễ (dải lụa đỏ cong + text vàng) | **Thêm** — đúng không khí phố phường, nguồn 1, 2 |
| Silhouette Hà Nội (lăng Bác + tháp Rùa + cầu Long Biên) | Vừa (đa giác tĩnh, 1 màu) | **Thêm** — parallax nền, nguồn 3 |
| Đèn lồng đỏ | Dễ (ellipses lồng nhau + tua vàng) | **Thêm** — nguồn 7 |
| Hoa thược dược/cúc vàng rơi | Dễ (cánh = ellipse quanh tâm) | **Thêm** — thay hạt sao rơi đơn điệu |
| Trống đồng (sao 14 cánh, vành chim cách điệu) | Vừa (polygon sao + vòng tròn đồng tâm) | **Thêm** — nguồn 6; hợp làm hoạ tiết nút/đế |
| Giấy trống màu nổ | Vừa (rect/con trăng xoay bay) | Thêm nếu kịp — chất folk, nguồn 7 |
| Hoa sen | Vừa (cánh nhọn xếp tầng) | Phụ — dùng làm huy chương/điểm sinh tồn, nguồn 8 |
| Tranh Đông Hồ (gà, cá chép) | Khó (nét mập mạp đặc thù) | **Bỏ** — khó giữ đúng chất bằng code thuần, dễ thành méo mó |
| Diễu binh/diễn hành, khiêu võ dân gian, rối đèn | Khó (nhân vật động nhiều khớp) | **Bỏ** — ngoài phạm vi arcade 1-touch |
| Thiếu nhi vẫy cờ | Vừa (sprite đơn giản: đầu tròn + thân + cờ nhỏ) | Thêm mức 2 — ở màn hình menu/game over, nguồn 2 |

## 3. Palette màu lễ hội

Chuẩn 6 màu chính + 2 phụ. Tất cả hợp đỏ–vàng chủ đạo của lễ 2/9.

| Vai trò | Màu | Hex | Ghi chú |
|---|---|---|---|
| Đỏ cờ (chủ đạo, nền trời hoàng hôn, thân máy bay, băng rôn) | Đỏ tươi | `#DA251D` | Quy cách quốc kỳ: "nền đỏ tươi" (nguồn 4) |
| Vàng sao (sao, điểm số, viền chữ, pháo hoa) | Vàng tươi | `#FFFF00` | Dùng kèm vàng đậm `#FFC107` cho đổ bóng |
| Xanh hồ Gươm (bầu trời ban ngày, nền đế) | Xanh ngọc | `#1B7FA8` | Tham chiếu hồ Gươm (nguồn 3) |
| Cam hoàng hôn (gradient trời) | Cam đất | `#E8763A` | Phối cùng đỏ cho gradient trời chiều |
| Kem giấy dó (nền bảng điểm/popup) | Kem | `#F5E9D0` | Chất giấy dó của tranh dân gian (nguồn 5) |
| Đen than tre (viền, chữ phụ, silhouette Hà Nội) | Đen ấm | `#2B2118` | Than lá tre của tranh Đông Hồ (nguồn 5) |
| Phụ: đồng trống | Đồng cũ | `#8C6239` | Trống đồng Đông Sơn (nguồn 6) |
| Phụ: hồng thược dược | Hồng cam | `#F2668B` | Hoa rơi trang trí |

## 4. Yếu tố đề xuất thêm (5–7)

### 4.1 Background Hà Nội silhouette parallax — **Độ khó: VỪA**
Lớp nền dưới cùng, cuộn chậm hơn foreground: lăng Bác (khối 3 tầng vuông + mái), tháp Rùa (tháp đa giác nhọn), cầu Long Biên (dãy trụ thép tam giác lặp + dầm ngang), tháp Rùa mờ ở tầng xa. Tất cả 1 màu đen ấm `#2B2118` hoặc xanh đậm, chỉ cần polygon tĩnh — không chi tiết.
**Lý do:** tạo chiều sâu "thủ đô" ngay từ giây đầu; trẻ em VN nhận ra tháp Rùa/lăng Bác tức thì (nguồn 3).

### 4.2 Băng rôn "CHÀO MỪNG 2-9" treo lơ lửng — **Độ khó: DỄ**
Dải lụa đỏ `#DA251D` hơi cong (2 cung bezier), 2 đầu buộc nơ vàng, text vàng `#FFFF00` đậm. Treo trên cùng màn menu, đung đưa sin nhẹ. Có thể thêm dòng phụ "Độc lập - Tự do - Hạnh phúc" nhỏ hơn.
**Lý do:** đúng ngôn ngữ trang trí phố phường 2/9 thật (nguồn 1, 2); rẻ nhất — hiệu quả cao nhất.

### 4.3 Hoa thược dược/cúc vàng rơi thay khói/particle — **Độ khó: DỄ**
Particle cánh hoa: tâm tròn vàng đậm + 8 cánh ellipse (hồng cam/hồng/vàng), xoay + rơi lắc lư kiểu lá. Rải ở menu và khi ăn điểm.
**Lý do:** hoa thược dược/cúc vàng là hoa trang trí 2/9 kinh điển, thay thế hạt tròn vô cảm; vẫn là texture vẽ code thuần.

### 4.4 Đèn lồng đỏ bay lên khi combo cao — **Độ khó: DỄ**
Ellipse đỏ sẫm + gân dọc đỏ đậm + tua vàng dưới, glow vàng nhẹ, bay chéo lên + lắc lư. Spawn khi đạt ngưỡng combo (VD mỗi chuỗi 10).
**Lý do:** phản hồi thưởng thị giác rõ rệt; đèn lồng là vật phẩm 2/9 phố Hàng Mã (nguồn 7).

### 4.5 Trống đồng họa tiết ở nút bấm / đế điểm — **Độ khó: VỪA**
Mặt trống: polygon sao 14 cánh vàng đồng giữa + 2–3 vòng tròn đồng tâm + vành tam giác lồng nhau. Dùng làm viền nút PLAY, huy hiệu best score, hoặc đế chân màn.
**Lý do:** sao 14 cánh của trống đồng trùng ngôn ngữ "sao vàng" của game — mượn di sản mà không lệch tông (nguồn 6).

### 4.6 Giấy trống màu nổ khi bigstar chain — **Độ khó: VỪA**
Confetti hình chữ nhật + con trăng (S) nhiều màu (đỏ/vàng/xanh/ hồng), xoay 3D giả (scaleY dao động), bung toả khi ăn sao lớn/chuỗi.
**Lý do:** chất lễ hội dân gian (giấy trống ở nguồn 7), dễ vẽ code hơn pháo hoa ánh sáng, cảm giác "đám đông cổ vũ".

### 4.7 Thiếu nhi vẫy cờ dưới chân màn (menu/game over) — **Độ khó: VỪA**
2–3 em nhỏ sprite tối giản: đầu tròn + thân hình thang + tay giơ lá cờ đỏ sao vàng nhỏ, animation vẫy cờ (rotate tay). Đặt ở footer menu và màn kết quả.
**Lý do:** hình ảnh thiếu nhi cầm cờ là biểu tượng 2/9 quen thuộc nhất với gia đình (nguồn 2), nhân cách hóa game cho đối tượng trẻ.

## 5. Font chữ

Không cần font ngoài (giữ nhẹ cho GitHub Pages):
- **Tiêu đề/score:** system font đậm nhất có sẵn — stack: `'Arial Black', 'Arial Bold', Gadget, sans-serif` (hoặc `900` weight), hỗ trợ tốt dấu tiếng Việt trên iOS/Android.
- **Viền vàng kiểu huy hiệu:** Phaser `setStroke('#2B2118', 8)` viền đen than bên ngoài + shadow vàng `#FFC107` lệch 2–3px bên dưới — chữ nổi khối như biển hiệu lễ hội, tương phản cao với nền đỏ/trời.
- **Chữ phụ (băng rôn, hướng dẫn):** Arial 700, màu `#FFFF00` trên nền đỏ, hoặc `#2B2118` trên nền kem giấy dó.
- Tránh font script/serif đẹp nhưng không có sẵn trên mobile; nếu sau này muốn nâng cấp, chỉ cần thêm 1 font .woff2 đậm hỗ trợ tiếng Việt (VD Be Vietnam Pro Black) qua @font-face — không chặn mục tiêu hiện tại.

## 6. Ưu tiên 3 cái đáng làm trước 1/9

1. **Băng rôn "CHÀO MỪNG 2-9"** (dễ) — công khai chủ đề game ngay trên màn hình đầu tiên, chi phí code thấp nhất, tác động thẩm mỹ tức thì.
2. **Background Hà Nội silhouette parallax** (vừa) — thay nền phẳng bằng skyline lăng Bác + tháp Rùa + Long Biên: chiều sâu + bản sắc thủ đô, chỉ cần polygon tĩnh.
3. **Đèn lồng đỏ bay khi combo cao** (dễ) — cơ chế thưởng thị giác gắn với gameplay, giữ người chơi; đèn lồng + hoa rơi có thể gộp chung 1 hệ particle.

Còn lại (trống đồng, giấy trống, thiếu nhi vẫy cờ) làm theo đợt 2 nếu còn thời gian sau 1/9.

---
*Tài liệu nghiên cứu design — không kèm code game. Nguồn truy cập 25/8/2026.*
