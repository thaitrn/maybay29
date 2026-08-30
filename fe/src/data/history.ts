export interface HistoryQuestion {
  id: number;
  level: 'easy' | 'medium' | 'hard';
  q: string;
  answers: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explain: string;
}

export const HISTORY_QUESTIONS: HistoryQuestion[] = [
  { id: 1, level: 'easy', q: 'Ai là người đọc bản Tuyên ngôn Độc lập ngày 2/9/1945?', answers: ['Vua Bảo Đại', 'Chủ tịch Hồ Chí Minh', 'Đại tướng Võ Nguyên Giáp', 'Ông Phạm Văn Đồng'], correct: 1, explain: 'Tại Quảng trường Ba Đình, Bác Hồ đọc Tuyên ngôn Độc lập khai sinh nước Việt Nam mới.' },
  { id: 2, level: 'easy', q: 'Ngày 2/9 là ngày lễ gì của Việt Nam?', answers: ['Quốc tế Lao động', 'Tết Trung thu', 'Quốc khánh', 'Ngày Nhà giáo Việt Nam'], correct: 2, explain: 'Nước Việt Nam Dân chủ Cộng hòa ra đời ngày 2/9/1945 nên 2/9 là ngày Quốc khánh.' },
  { id: 3, level: 'easy', q: 'Tuyên ngôn Độc lập được đọc tại quảng trường nào?', answers: ['Quảng trường Đông Kinh Nghĩa Thục', 'Quảng trường Ba Đình', 'Quảng trường 1/5', 'Quảng trường Lam Sơn'], correct: 1, explain: 'Quảng trường Ba Đình (Hà Nội) — nơi Bác Hồ đọc Tuyên ngôn, nay là nơi đặt Lăng Bác.' },
  { id: 4, level: 'easy', q: 'Ngày 2/9/1945, nước Việt Nam mới mang tên gì?', answers: ['Việt Nam Dân chủ Cộng hòa', 'Đại Việt', 'Đế quốc Việt Nam', 'Việt Nam Cộng hòa'], correct: 0, explain: 'Đây là tên nhà nước đầu tiên của Việt Nam độc lập, do Bác Hồ tuyên bố ngày 2/9/1945.' },
  { id: 5, level: 'easy', q: 'Ai đảo chính (lật đổ) chính quyền Pháp ở Việt Nam ngày 9/3/1945?', answers: ['Quân Mỹ', 'Quân Nhật', 'Quân Anh', 'Quân Trung Quốc'], correct: 1, explain: 'Đêm 9/3/1945, Nhật tấn công Pháp trên toàn Đông Dương, kết thúc ~80 năm đô hộ của Pháp.' },
  { id: 6, level: 'easy', q: 'Vua Bảo Đại đã làm gì ngày 30/8/1945?', answers: ['Tổ chức đám cưới', 'Sang Pháp du lịch', 'Thoái vị (không làm vua nữa)', 'Dời đô ra Hà Nội'], correct: 2, explain: 'Bảo Đại giao ấn kiếm cho chính quyền cách mạng, chấm dứt chế độ quân chủ gần 150 năm.' },
  { id: 7, level: 'medium', q: 'Hội nghị quyết định phát động Tổng khởi nghĩa (16–17/8/1945) họp ở đâu?', answers: ['Pác Bó (Cao Bằng)', 'Chiến khu Tân Trào (Tuyên Quang)', 'Phố Hàng Ngang (Hà Nội)', 'Cố đô Huế'], correct: 1, explain: 'Hội nghị toàn quốc tại Tân Trào ra "Lệnh Tổng khởi nghĩa", kêu gọi cả nước đứng lên giành chính quyền.' },
  { id: 8, level: 'medium', q: 'Ngày 19/8/1945, sự kiện lớn nào xảy ra tại Hà Nội?', answers: ['Nội chiến', 'Nhân dân Tổng khởi nghĩa giành chính quyền thắng lợi', 'Động đất', 'Lễ hội pháo hoa'], correct: 1, explain: 'Người Hà Nội dưới sự lãnh đạo của Việt Minh giành chính quyền, mở đầu Cách mạng Tháng Tám.' },
  { id: 9, level: 'medium', q: 'Từ ngày 28/8/1945, Bác Hồ soạn thảo Tuyên ngôn Độc lập tại đâu?', answers: ['Chiến khu Tân Trào', 'Cố đô Huế', 'Nhà số 48 Hàng Ngang, Hà Nội', 'Pác Bó'], correct: 2, explain: 'Từ 28/8/1945, Bác Hồ tập trung viết Tuyên ngôn Độc lập tại nhà 48 Hàng Ngang, Hà Nội.' },
  { id: 10, level: 'medium', q: 'Tổ chức nào lãnh đạo Cách mạng Tháng Tám giành chính quyền năm 1945?', answers: ['Việt Nam Quốc dân Đảng', 'Mặt trận Việt Minh', 'Đại Việt', 'Chính phủ Trần Trọng Kim'], correct: 1, explain: 'Việt Minh (Việt Nam Độc lập Đồng minh) do Hồ Chí Minh sáng lập, lãnh đạo nhân dân Tổng khởi nghĩa.' },
  { id: 11, level: 'medium', q: 'Trước 9/3/1945, nước Việt Nam bị ai đô hộ khoảng 80 năm?', answers: ['Thực dân Pháp', 'Đế quốc Anh', 'Đế quốc Mỹ', 'Bồ Đào Nha'], correct: 0, explain: 'Pháp xâm lược Việt Nam từ giữa thế kỷ 19, đến 9/3/1945 bị Nhật đảo chính lật đổ.' },
  { id: 12, level: 'medium', q: 'Chế độ quân chủ Việt Nam chấm dứt khi nào?', answers: ['9/3/1945', '19/8/1945', '30/8/1945, khi vua Bảo Đại thoái vị', '2/9/1945'], correct: 2, explain: 'Bảo Đại — vị vua cuối cùng — thoái vị ngày 30/8/1945, kết thúc gần 150 năm quân chủ.' },
  { id: 13, level: 'hard', q: 'Câu kết nổi tiếng của Tuyên ngôn Độc lập khẳng định điều gì?', answers: ['Việt Nam thuộc về Pháp', 'Toàn thể dân Việt Nam quyết đem tất cả tinh thần, lực lượng, tính mạng và của cải để giữ vững độc lập', 'Việt Nam là thuộc địa Nhật', 'Việt Nam xin gia nhập Liên Xô'], correct: 1, explain: '"Nước Việt Nam có quyền hưởng tự do và độc lập" — lời thề giữ độc lập bằng tất cả tính mạng và của cải.' },
  { id: 14, level: 'hard', q: 'Bác Hồ cảnh báo sau lễ Độc lập: "Chúng ta sẽ phải trải qua nhiều khốn khó và đau khổ hơn nhiều". Câu này muốn nói gì?', answers: ['Giữ độc lập còn khó "gấp ngàn lần hơn" giành độc lập', 'Mọi chuyện sẽ rất dễ dàng', 'Không còn gì phải lo', 'Nên trả độc lập cho Pháp'], correct: 0, explain: 'Giành độc lập mới là bước đầu; giữ độc lập đòi hỏi cả dân tộc đoàn kết, hy sinh nhiều hơn nữa.' },
  { id: 15, level: 'hard', q: 'Sắp xếp đúng thứ tự 4 mốc: (1) Nhật đảo chính Pháp, (2) Tổng khởi nghĩa Hà Nội, (3) Bảo Đại thoái vị, (4) Bác Hồ đọc Tuyên ngôn Độc lập?', answers: ['2-1-3-4', '1-2-3-4', '4-3-2-1', '1-3-2-4'], correct: 1, explain: 'Đúng theo dòng thời gian: 9/3/1945 → 19/8/1945 → 30/8/1945 → 2/9/1945.' },
  { id: 16, level: 'hard', q: 'Bản Tuyên ngôn Độc lập của Hồ Chí Minh mở đầu bằng trích dẫn từ văn kiện nào?', answers: ['Tuyên ngôn Độc lập Mỹ 1776 và Tuyên ngôn Nhân quyền Pháp 1791', 'Bình Ngô đại cáo của Nguyễn Trãi', 'Nam quốc sơn hà', 'Hịch tướng sĩ'], correct: 0, explain: 'Bác trích dẫn Tuyên ngôn Mỹ (1776) và Tuyên ngôn Nhân quyền Pháp (1791) để khẳng định quyền độc lập của Việt Nam.' },
];

const LS_KEY = 'mb29.history.asked';

/** Chọn 1 câu ngẫu nhiên, không lặp trong 5 ván gần nhất (lưu localStorage). */
export function pickHistoryQuestion(): HistoryQuestion {
  let asked: number[] = [];
  try { asked = JSON.parse(localStorage.getItem(LS_KEY) || '[]') as number[]; } catch { asked = []; }
  const recent = asked.slice(-5);
  let pool = HISTORY_QUESTIONS.filter(q => !recent.includes(q.id));
  if (pool.length === 0) pool = HISTORY_QUESTIONS;
  const q = pool[Math.floor(Math.random() * pool.length)];
  asked.push(q.id);
  try { localStorage.setItem(LS_KEY, JSON.stringify(asked.slice(-20))); } catch { /* ignore */ }
  return q;
}
