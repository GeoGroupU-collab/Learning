# Giới hạn và hạn mức

Các con số dưới đây lấy theo tài liệu công khai của Google và GitHub tại thời điểm viết (tháng 10/2026). Google và GitHub có thể đổi, hãy kiểm tra lại trang chính thức khi cần. Quy mô dự án (40 đến 60 người) còn rất xa các giới hạn này.

## Google Apps Script (tài khoản Gmail thường)

| Giới hạn | Mức khoảng | Hệ thống tránh chạm tới thế nào |
|---|---|---|
| Thời gian chạy một lần gọi | 6 phút | Mỗi yêu cầu chỉ đọc vài tab Sheet và ghi vài dòng, thường dưới vài giây. Chốt tuần xử lý theo từng tuần, không quét cả lịch sử. |
| Tổng thời gian chạy của trigger mỗi ngày | 90 phút | Trigger chốt tuần chạy mỗi 15 phút và thoát ngay khi chưa có tuần nào cần chốt (vài trăm mili giây). Sao lưu chạy mỗi tuần một lần. |
| Số lần gọi `UrlFetch` mỗi ngày | 20.000 | Chỉ dùng để xác minh ID token của Google lúc đăng nhập. Kết quả được cache 50 phút, và sau đó web dùng mã phiên 30 ngày nên không gọi lại. |
| Số lần chạy đồng thời | khoảng 30 mỗi người dùng | Mở phòng thi: việc rút đề làm ngoài khóa, khóa chỉ giữ lúc ghi vài dòng. Nên nhắc lớp vào thi rải rác, không cùng một giây. |
| Giá trị `CacheService` | 100 KB mỗi khóa, lưu tối đa 6 giờ | Cache bảng xếp hạng (10 giây), cấu hình và lịch tuần (30 giây), phiên đăng nhập (6 giờ, có dự phòng trong Sheet). Các giá trị đều nhỏ hơn nhiều. |
| Số trigger mỗi script | 20 | Dùng 2 (chốt tuần, sao lưu). |
| Khóa `LockService` | chờ tối đa 20 giây | Mọi thao tác ghi quan trọng (bắt đầu thi, nộp bài, nộp câu hỏi, xin miễn, chốt nhóm) dùng khóa để không ghi trùng. Quá 20 giây thì báo "hệ thống đang bận". |
| Khởi động nguội | vài giây ở yêu cầu đầu tiên sau lúc không ai dùng | Web hiện ngay từ bản lưu trên máy rồi mới cập nhật. Không tránh hết được ở bản miễn phí. |

Cách hệ thống giảm tải: mỗi tab Sheet chỉ đọc một lần cho mỗi yêu cầu, các tab nhỏ ít đổi được nhớ 30 giây giữa các yêu cầu, trang chủ gom ba yêu cầu thành một.

## Google Sheets

- Tối đa **10 triệu ô** mỗi file. Một học kỳ với 40 người dùng chừng vài chục nghìn ô, nên còn rất xa. Cuối năm có thể lưu trữ và dọn các tab chạy (xem `HUONG-DAN-CHU.md`, Phần 8).
- Tab `CauHoi` và `LuotThi` lớn dần theo thời gian, đọc chậm dần khi tới hàng chục nghìn dòng. Đó là lý do nên lưu trữ cuối mỗi năm học.

## Google Drive (sao lưu)

- Mỗi bản sao lưu là một bản sao của cả Sheet. Hệ thống giữ 8 bản gần nhất và chuyển bản cũ hơn vào **thùng rác Drive**, nên Drive vẫn giữ chúng thêm một thời gian theo chính sách thùng rác của Google. Chỉ các file có tên bắt đầu bằng "Sao luu " bị dọn, các file khác trong thư mục không bị đụng.
- Dung lượng Drive miễn phí là 15 GB dùng chung cho Gmail và Drive. Mỗi bản sao lưu thường chỉ vài trăm KB đến vài MB.

## Google Cloud (đăng nhập)

- Ứng dụng OAuth chỉ xin quyền cơ bản (email, tên, ảnh) nên **không cần Google xét duyệt**, miễn là chuyển sang **In production**. Nếu để **Testing**, chỉ tối đa 100 email thử nghiệm đăng nhập được và phiên hết hạn sau 7 ngày.
- Nguồn JavaScript được phép phải khớp đúng địa chỉ trang web (`https://geogroupu-collab.github.io`). Đổi tên tài khoản GitHub hoặc dùng tên miền riêng thì phải sửa lại.

## GitHub Pages

- Kho phải **công khai** (bản miễn phí). Trang web là hosting tĩnh, giới hạn gợi ý khoảng 1 GB dung lượng và 100 GB băng thông mỗi tháng, đủ rộng cho quy mô này.
- Mỗi lần commit, GitHub Actions build và đưa lên trong 1 đến 3 phút.
- **Bài học chỉ được che bằng cổng đăng nhập ở trình duyệt.** Ai biết đường dẫn trực tiếp của một file bài học vẫn tải được file đó. Vì vậy tuyệt đối không để đáp án, quiz, đề thi trong thư mục bài học. Nếu sau này cần chặn thật sự, phương án nâng cấp là Cloudflare Pages kèm Cloudflare Access (miễn phí đến 50 người).

## Những thứ không có trong hệ thống này

- Không có chat trên web (các nhóm dùng Zalo, web chỉ lưu link nhóm).
- Không có thông báo đẩy hay email tự động.
- Không có thanh toán hay dịch vụ tính phí.
