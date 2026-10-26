# Learning Group

Web học tập cho CLB lớp: bài học, chia nhóm theo GPA, thi cuối tuần từ ngân hàng câu hỏi, xếp hạng nhóm và cá nhân (cấp bậc, danh hiệu), tạo đề, báo sai, tổng kết học kỳ. Dùng suốt 4 năm đại học, qua nhiều học kỳ.

- **Giao diện:** web tĩnh trên GitHub Pages (Vite và TypeScript, không dùng framework, bản build khoảng 100 KB, nén còn khoảng 34 KB).
- **Máy chủ:** Google Apps Script gắn một Google Sheet (cơ sở dữ liệu), triển khai thành Web app. Một điểm vào `doPost`, mọi hành động đều kiểm tra danh tính và vai trò ở máy chủ.
- **Đăng nhập:** Google Identity Services, máy chủ xác minh ID token một lần rồi cấp mã phiên 30 ngày (chỉ lưu bản băm).
- **Tài liệu cho người dùng:** [HUONG-DAN-CHU.md](HUONG-DAN-CHU.md) (chủ), [HUONG-DAN-THANH-VIEN.md](HUONG-DAN-THANH-VIEN.md) (cả lớp), [docs/gioi-han-va-quota.md](docs/gioi-han-va-quota.md), [docs/thong-bao-quyen-rieng-tu.md](docs/thong-bao-quyen-rieng-tu.md), [docs/mau-form-dang-ky.md](docs/mau-form-dang-ky.md).

## Cấu trúc

```
backend/src/        mã Apps Script, mỗi file một mảng việc
  schema.js           các tab Sheet và cấu hình mặc định
  logic.js            hàm thuần (chia nhóm, tính điểm, rút đề, xếp hạng, cấp bậc...), không gọi API Apps Script
  util.js, auth.js    đọc ghi Sheet có bộ nhớ theo yêu cầu, xác minh token, chặn cổng
  phien.js            phiên đăng nhập dài hạn
  api.js              doPost và bảng hành động
  su-kien.js, thi.js  lịch tuần, nộp câu hỏi, phòng thi, chốt tuần, xếp hạng nhóm
  diem.js             điểm cá nhân, tạo đề tự luyện, thưởng nhóm, danh hiệu
  ngan-hang.js        báo sai, xem lại, câu khó nhất, quản trị ngân hàng, xuất nhập
  de-thi.js           đề thi từ ngân hàng, đề sự kiện cố định, phát hành
  hoc-ky.js           kết thúc học kỳ, tổng kết, học kỳ mới, thêm môn
  bao-cao.js          bảng điểm, chấm lại tuần, nhật ký
  sao-luu.js          sao lưu hằng tuần vào Drive
  setup.js, form.js   khoiTao() và taoFormDangKy()
backend/test/       Vitest, gồm giả lập Apps Script chạy mã máy chủ thật
backend/dist/       Code.gs và appsscript.json sinh ra để dán vào Apps Script (không commit)
src/                giao diện (main.ts, views/, api.ts, auth.ts, prompt-ai.ts, huy-hieu.ts, bieu-do.ts, xuat-de.ts...)
tests/              Vitest cho phần giao diện thuần (prompt AI, huy hiệu, xuất đề)
public/bai-hoc/     bài học theo học kỳ và môn (manifest.json do script sinh)
scripts/            build backend, sinh manifest
.github/workflows/  build, test và đưa lên GitHub Pages
```

## Lệnh

```bash
npm install
npm run build:backend   # gom backend/src/*.js thành backend/dist/Code.gs
npm test                # Vitest (máy chủ qua giả lập Apps Script, logic thuần, giao diện thuần)
npm run dev:mock        # xem giao diện với dữ liệu giả, không cần Google (thêm ?tt=nop|cho|mo|dong, ?vai=member|assistant)
npm run build           # sinh manifest, kiểm tra kiểu, build web vào dist/
```

Chế độ dữ liệu giả chỉ bật bằng `npm run dev:mock`; bản build đưa lên không chứa mã giả lập (đã kiểm tra bản build không có `mockGoi`).

## Kiểm thử

- Máy chủ: `backend/test/gia-lap-appsscript.js` dựng `SpreadsheetApp`, `CacheService`, `LockService`, `UrlFetchApp`, `DriveApp`, `ScriptApp` tối thiểu rồi chạy đúng mã `backend/src`. Các test đi trọn vòng: đăng nhập và phiên, nộp câu hỏi, thi (bắt đầu idempotent, tự lưu, nộp, quá giờ), chốt tuần, thưởng và danh hiệu, báo sai, tạo đề, kết thúc và tạo học kỳ, chấm lại, sao lưu, đếm số lần đọc Sheet.
- Giao diện: kiểm tra thủ công ở độ rộng 390 px bằng trình duyệt trong ứng dụng với dữ liệu giả. **Chưa có Playwright** vì phải tải trình duyệt kèm theo (khá nặng); có thể thêm nếu cần.
- Chưa có kiểm thử tự động nào chạy với Google thật. Vòng thử cuối phải làm bằng tay với 3 tài khoản Google thử nghiệm (xem `HUONG-DAN-CHU.md`, Bước 23 và Phần 9).

## Quy ước

- Giao diện và tài liệu bằng tiếng Việt. Tên tab và cột của Sheet dùng tiếng Việt không dấu.
- Không ghi email thật, mật khẩu, token hay khóa bí mật vào kho mã. Giá trị riêng nằm trong Script Properties. Client ID và địa chỉ Web app là thông tin công khai theo thiết kế (`src/config.ts`).
- Văn bản người dùng luôn hiển thị bằng `textContent`, không chèn HTML thô. File in được thì escape HTML.
- `client_secret*.json` của Google Cloud không bao giờ được đưa vào kho (đã có trong `.gitignore`).
