# Learning Group

Web học tập cho CLB lớp: bài học, chia nhóm theo GPA, thi cuối tuần từ ngân hàng câu hỏi, xếp hạng nhóm.

- Giao diện: web tĩnh trên GitHub Pages (Vite + TypeScript), thêm ở mốc M1.
- Máy chủ: Google Apps Script gắn Google Sheet, mã nguồn ở `backend/src`.
- Yêu cầu đầy đủ: xem tài liệu yêu cầu gốc của chủ.

## Cấu trúc

```
backend/src/     mã Apps Script, mỗi file một mảng việc (schema, setup, form, sau này logic, auth...)
backend/dist/    Code.gs và appsscript.json sinh ra, dán vào Apps Script (không commit)
scripts/         script build
docs/            tài liệu
HUONG-DAN-CHU.md hướng dẫn tiếng Việt cho chủ
```

## Lệnh

```bash
npm install
npm run build:backend   # gom backend/src/*.js thành backend/dist/Code.gs
npm test                # Vitest
```

## Quy ước

- Giao diện và tài liệu bằng tiếng Việt; tên biến, hàm bằng tiếng Anh ở phần logic (các file schema/setup dùng tên tiếng Việt không dấu cho tab và cột của Sheet).
- Không ghi email thật, mật khẩu, token vào kho mã. Giá trị riêng nằm trong Script Properties hoặc chỗ có nhãn `ĐIỀN VÀO ĐÂY`.
