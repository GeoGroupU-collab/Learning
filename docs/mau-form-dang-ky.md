# Mẫu Google Form đăng ký

Hàm `taoFormDangKy()` trong Apps Script tự tạo Form theo đúng mẫu dưới đây, nên thường bạn không cần làm tay. Tài liệu này để đối chiếu hoặc tự tạo nếu hàm báo lỗi.

## Tên Form

Đăng ký tham gia Learning Group

## Mô tả (dán vào đầu Form)

Dùng nội dung ở `docs/thong-bao-quyen-rieng-tu.md` (bản tóm tắt: thu gì, ai xem, xóa thế nào).

## Câu hỏi

| # | Tiêu đề | Loại | Bắt buộc |
|---|---|---|---|
| 1 | Họ và tên | Trả lời ngắn | Có |
| 2 | GPA hiện tại | Trả lời ngắn, kiểm tra "Số" trong khoảng 0 đến 10 | Có |
| 3 | Xác nhận | Hộp kiểm một lựa chọn: "Tôi đã đọc thông báo quyền riêng tư ở đầu Form và đồng ý để lớp trưởng dùng GPA vào việc chia nhóm" | Có |

Email lấy từ phần cài đặt thu thập email, không cần câu hỏi riêng.

## Cài đặt phải bật (tab Cài đặt của Form)

1. Thu thập email: chọn **Đã xác minh**.
2. **Giới hạn ở 1 phản hồi** mỗi người.
3. **Cho phép chỉnh sửa phản hồi**: tắt.
4. Tab **Phản hồi**: liên kết với Google Sheet của dự án; tab câu trả lời phải tên là `DangKy`.

## Lịch mở đóng (học kỳ này)

- Mở: Thứ Tư 28/10.
- Đóng: Thứ Năm 5/11. Bật tắt bằng công tắc "Chấp nhận phản hồi" trong tab Phản hồi, hoặc chạy hàm `moForm` / `dongForm`.
