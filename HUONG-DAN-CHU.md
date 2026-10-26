# Hướng dẫn cho chủ (lớp trưởng) – Learning Group

Tài liệu này theo từng mốc. Làm lần lượt từ Phần 1; mỗi bước có dòng "Làm đúng khi thấy".

| Phần | Nội dung | Mốc |
|---|---|---|
| 1 | Tạo Sheet, dán mã, chạy `khoiTao`, tạo Form đăng ký | M0 |
| 2 | Đăng nhập Google, đưa web lên GitHub Pages | M1 |
| 3 | Lịch tuần, nộp câu hỏi, xin miễn | M2 |
| 4 | Phòng thi, chốt tuần, xếp hạng, nhớ đăng nhập, vòng thử 3 tài khoản | M3 |
| 5 | Điểm cá nhân, cấp bậc, báo sai, xem lại, quản lý ngân hàng | M4 |
| 6 | Danh sách chương, web mượt hơn | M4 |
| 7 | Nhờ AI soạn câu hỏi, tạo đề thi, huy hiệu | M5 |
| 8 | Học kỳ, tổng kết, sao lưu, nhật ký, bảng điểm, chấm lại, lưu trữ năm học | M6 |
| 9 | Danh sách kiểm tra cuối cùng trước khi chạy thật | M6 |

Quy tắc an toàn quan trọng nhất: **Google Sheet này tuyệt đối không chia sẻ cho thành viên**, vì trong đó có GPA, email và đáp án.

---

## Phần 1. Tạo Sheet, dán mã, tạo Form đăng ký

### Bước 1. Đăng nhập tài khoản Google riêng của dự án

1. Mở Chrome, vào https://accounts.google.com và đăng nhập tài khoản dùng cho dự án.
2. Kiểm tra địa chỉ email: nhìn kỹ đuôi `@gmail.com` (đủ chữ `l`). Nếu bạn đã tạo tài khoản đuôi `@gmai.com` thì đó không phải địa chỉ Gmail hợp lệ, hãy cho mình biết email chính xác.

Làm đúng khi thấy: góc phải trên cùng hiện chữ cái đầu tên tài khoản dự án.

### Bước 2. Tạo Google Sheet

1. Vào https://sheets.google.com và bấm **Trống** (dấu cộng).
2. Bấm vào chữ "Bảng tính không có tiêu đề" ở góc trái trên, đổi tên thành `Learning Group - Dữ liệu`.

Làm đúng khi thấy: tiêu đề mới hiện ở góc trái trên và có một tab tên "Trang tính1" ở dưới.

### Bước 3. Mở trình soạn Apps Script

1. Trong Sheet, bấm menu **Tiện ích mở rộng**, rồi chọn **Apps Script**.
2. Một tab mới mở ra, có file tên `Code.gs` với đoạn `function myFunction() {}`.

Làm đúng khi thấy: giao diện nền sáng có danh sách file bên trái và chữ `Code.gs`.

### Bước 4. Dán mã

1. Mở file `backend/dist/Code.gs` trong thư mục dự án (máy mình đã tạo sẵn; nếu chưa thấy, báo lại).
2. Bấm vào trong file, nhấn **Ctrl+A** rồi **Ctrl+C**.
3. Quay lại tab Apps Script, bấm vào khung mã của `Code.gs`, nhấn **Ctrl+A** rồi **Ctrl+V** để thay toàn bộ nội dung cũ.
4. Bấm biểu tượng **Cài đặt dự án** (hình bánh răng, cột trái), tích ô **Hiển thị tệp kê khai "appsscript.json" trong trình chỉnh sửa**.
5. Quay lại **Trình chỉnh sửa** (hình `<>`), bấm file `appsscript.json` mới hiện ra, mở file `backend/dist/appsscript.json` của dự án, copy toàn bộ rồi dán đè vào đó.
6. Bấm biểu tượng đĩa mềm hoặc **Ctrl+S** để lưu.

Làm đúng khi thấy: không có dấu gạch đỏ báo lỗi, và cạnh tên dự án không còn chấm báo "chưa lưu".

### Bước 5. Điền email của chủ vào Script Properties

1. Trong Apps Script, bấm **Cài đặt dự án** (bánh răng).
2. Kéo xuống **Thuộc tính tập lệnh**, bấm **Thêm thuộc tính tập lệnh**.
3. Ô Thuộc tính gõ `OWNER_EMAIL`, ô Giá trị gõ email Google của bạn (tài khoản dự án, viết thường).
4. Bấm **Lưu thuộc tính tập lệnh**.

Làm đúng khi thấy: bảng có đúng một dòng `OWNER_EMAIL` với email của bạn.

### Bước 6. Chạy `khoiTao()`

1. Quay lại **Trình chỉnh sửa**. Ở thanh trên cùng, ô chọn hàm chọn `khoiTao`.
2. Bấm **Chạy**.
3. Lần đầu, Google hỏi cấp quyền: bấm **Xem lại quyền**, chọn tài khoản của bạn. Nếu hiện "Google chưa xác minh ứng dụng này", bấm **Nâng cao**, rồi **Đi tới ... (không an toàn)**, rồi **Cho phép**. Đây là mã của chính bạn nên an toàn.
4. Đợi vài giây, nhìn khung **Nhật ký thực thi** bên dưới.

Làm đúng khi thấy: nhật ký có các dòng "Đã tạo tab ...", "Đã thêm 5 môn mẫu ...", "Đã thêm chủ vào ThanhVien", và cuối cùng là "Thực thi đã hoàn tất".

Quay lại Google Sheet để kiểm tra: phải có đủ các tab `CauHinh`, `HocKy`, `Mon`, `ThanhVien`, `Nhom`, `NhomThanhVien`, `Tuan`, `CauHoi`, `BaoSai`, `Mien`, `LuotThi`, `KetQuaTuan`, `DeThi`, `NhatKy`. Tab `ThanhVien` có một dòng là email của bạn với vai trò `owner`.

Chạy lại `khoiTao()` bao nhiêu lần cũng không mất dữ liệu.

### Bước 7. Tạo Google Form đăng ký

1. Trong Apps Script, chọn hàm `taoFormDangKy` ở ô chọn hàm rồi bấm **Chạy**.
2. Lần đầu Google hỏi thêm quyền cho Google Form: làm như Bước 6, mục 3.
3. Xem **Nhật ký thực thi**, sẽ có hai dòng:
   - `Link gửi cho lớp: https://docs.google.com/forms/...` – link gửi cho cả lớp.
   - `Link chỉnh sửa: ...` – chỉ bạn dùng.
4. Mở **Link chỉnh sửa**, vào tab **Cài đặt** và kiểm tra theo `docs/mau-form-dang-ky.md`: thu thập email **Đã xác minh**, **Giới hạn ở 1 phản hồi**. Nếu nhật ký có dòng "Không đặt được ... bằng mã" thì bật tay mục đó.
5. Vào tab **Phản hồi**, kiểm tra Form đã liên kết với Sheet. Quay lại Sheet, phải có tab tên `DangKy`.

Làm đúng khi thấy: mở link gửi cho lớp ra thấy Form có 3 câu (Họ và tên, GPA hiện tại, Xác nhận), và Sheet có tab `DangKy`.

### Bước 8. Thử Form bằng một câu trả lời

1. Mở link gửi cho lớp, tự điền thử và gửi.
2. Vào Sheet, tab `DangKy` phải có thêm một dòng.
3. Xóa dòng thử đó đi (chọn dòng, chuột phải, **Xóa hàng**).

Làm đúng khi thấy: dòng thử hiện trong `DangKy` đủ email, họ tên, GPA.

### Bước 9. Mở và đóng Form đúng lịch

- **Thứ Tư 28/10**: gửi link gửi cho lớp khi thuyết trình.
- **Thứ Năm 5/11**: đóng Form. Cách đóng: mở Form chỉnh sửa, tab **Phản hồi**, tắt công tắc **Chấp nhận phản hồi**. Hoặc trong Apps Script chạy hàm `dongForm`.
- Nếu muốn khóa Form đến lúc thuyết trình, chạy `dongForm` ngay bây giờ rồi chạy `moForm` sáng 28/10.

### Bước 10. Sửa dữ liệu mẫu (không gấp)

- Tab `Mon`, cột `danhSachChuong`: sau này điền danh sách chương mỗi môn dạng JSON, ví dụ `[{"ma":"c1","ten":"Chương 1"}]`. Mình sẽ có nút trong trang quản trị để việc này dễ hơn.
- Tab `CauHinh`: các số như số câu, thời gian, ngưỡng báo sai. Sửa trực tiếp ở cột `giaTri`.
- Tab `HocKy`: điền ngày bắt đầu và kết thúc học kỳ.

---

Phần 1 xong khi bạn có link Form và tab `DangKy`.

---

## Phần 2. Đăng nhập Google, đưa web lên GitHub Pages (mốc M1)

Thứ tự bắt buộc: làm Bước 11 và 12 (lấy Client ID và địa chỉ Web app) trước, rồi mới điền vào web ở Bước 13.

### Bước 11. Tạo Client ID đăng nhập Google

1. Vào https://console.cloud.google.com, đăng nhập tài khoản dự án.
2. Bấm chọn dự án ở thanh trên cùng, bấm **Dự án mới**, đặt tên `Learning Group`, bấm **Tạo**, rồi chọn dự án vừa tạo.
3. Menu trái, chọn **API và dịch vụ**, rồi **Màn hình đồng ý OAuth** (hoặc "Google Auth Platform"). Bấm **Bắt đầu**.
4. Tên ứng dụng: `Learning Group`. Email hỗ trợ: email dự án. Đối tượng: **Bên ngoài** (External). Email liên hệ: email dự án. Đồng ý điều khoản, bấm **Tạo**.
5. Vào mục **Đối tượng** (Audience), bấm **Xuất bản ứng dụng** để chuyển sang **Đang hoạt động / In production**. Nếu để "Testing", chỉ 100 email thử nghiệm đăng nhập được và phiên hết hạn sau 7 ngày. Web chỉ xin quyền email, tên, ảnh nên không cần Google xét duyệt.
6. Vào **Ứng dụng khách** (Clients) hoặc **Thông tin xác thực** (Credentials), bấm **Tạo ứng dụng khách OAuth** (Create OAuth client ID).
7. Loại ứng dụng: **Ứng dụng web**. Tên: `Learning Group web`.
8. Ở **Nguồn gốc JavaScript được ủy quyền** (Authorized JavaScript origins), bấm **Thêm URI** và dán đúng dòng này (không có dấu `/` ở cuối, không có `/Learning`):
   `https://geogroupu-collab.github.io`
9. Không điền gì vào "URI chuyển hướng". Bấm **Tạo**.
10. Copy **Client ID** (dạng `1234-abcd.apps.googleusercontent.com`) và lưu vào Notepad. Client ID không phải bí mật. **Không** copy "Client secret", web không cần.

Làm đúng khi thấy: bạn có một dòng Client ID kết thúc bằng `.apps.googleusercontent.com`, và màn hình đồng ý OAuth ghi "In production" hoặc "Đang hoạt động".

### Bước 12. Cập nhật mã Apps Script và triển khai Web app

1. Mở lại Apps Script của Sheet (Sheet, **Tiện ích mở rộng**, **Apps Script**).
2. Dán lại toàn bộ `backend/dist/Code.gs` mới (làm như Phần 1, Bước 4, mục 1 đến 3), rồi **Ctrl+S**. File `appsscript.json` giữ nguyên nếu đã dán rồi.
3. **Cài đặt dự án**, **Thuộc tính tập lệnh**, thêm thuộc tính: tên `GOOGLE_CLIENT_ID`, giá trị là Client ID vừa copy. Lưu.
4. Chạy hàm `khoiTao` một lần nữa (an toàn, không mất dữ liệu).
5. Bấm **Triển khai** (góc phải trên), **Tùy chọn triển khai mới**. Bấm bánh răng cạnh "Chọn loại", chọn **Ứng dụng web**.
6. Mô tả: `v1`. **Thực thi dưới dạng**: **Tôi** (email của bạn). **Người có quyền truy cập**: **Bất kỳ ai**. Bấm **Triển khai**, cấp quyền nếu được hỏi.
7. Copy **URL ứng dụng web** (kết thúc bằng `/exec`) vào Notepad.
8. Dán URL đó vào thanh địa chỉ Chrome.

Làm đúng khi thấy: trang hiện chữ `{"ok":true,"data":"Learning Group API đang chạy."}`.

**Mỗi lần sau này sửa mã Apps Script** (khi mình đưa bản mới): dán `Code.gs` mới, lưu, rồi **Triển khai**, **Quản lý triển khai**, bấm biểu tượng cây bút, ở "Phiên bản" chọn **Phiên bản mới**, bấm **Triển khai**. Làm vậy địa chỉ `/exec` không đổi. Nếu bạn tạo "Triển khai mới" thì địa chỉ sẽ đổi và web ngừng chạy cho đến khi sửa lại `API_URL`.

### Bước 13. Điền hai giá trị vào web

Mở file `src/config.ts`. Có hai dòng `ĐIỀN VÀO ĐÂY`:

- `GOOGLE_CLIENT_ID`: dán Client ID (Bước 11).
- `API_URL`: dán URL `/exec` (Bước 12).

Giữ nguyên dấu nháy đơn quanh giá trị. Lưu file.

### Bước 14. Đưa mã lên GitHub

Kho đã tạo: https://github.com/GeoGroupU-collab/Learning

Cách dễ nhất cho người không quen dòng lệnh là GitHub Desktop:

1. Tải GitHub Desktop từ https://desktop.github.com, cài đặt và đăng nhập tài khoản GitHub của dự án.
2. **File**, **Add local repository**, chọn thư mục `D:\projects\Web CLB`. Nếu nó báo "không phải kho git", bấm **create a repository here**.
3. Ở khung dưới trái, ô Summary gõ `Bản đầu tiên`, bấm **Commit to main**.
4. Bấm **Publish repository** hoặc **Push origin**. Nếu hỏi, chọn kho có sẵn `GeoGroupU-collab/Learning`. Nếu báo kho đã có nội dung khác, báo lại cho mình, đừng bấm Force.
5. Trên GitHub, vào kho, **Settings**, **Pages**. Ở **Source** chọn **GitHub Actions**.
6. Vào tab **Actions**, chờ lần chạy "Build và đưa lên GitHub Pages" có dấu tick xanh (1 đến 3 phút).

Làm đúng khi thấy: mở https://geogroupu-collab.github.io/Learning/ hiện màn hình đăng nhập "Learning Group" với nút Google.

Trước khi đẩy lên, kiểm tra thư mục không có file nào chứa mật khẩu hay khóa bí mật. Kho này chỉ chứa Client ID và URL Web app, cả hai đều công khai theo thiết kế.

### Bước 15. Thử vòng đầu tiên

1. Mở trang web, bấm **Đăng nhập bằng Google** bằng tài khoản dự án. Phải vào được trang chủ và thấy nút **Quản trị**.
2. Thử đăng nhập bằng một tài khoản Google khác chưa có trong `ThanhVien`: phải thấy "Email này chưa được duyệt, liên hệ lớp trưởng."
3. Đăng nhập lại tài khoản dự án, vào **Quản trị**, **Chia nhóm**. Sau khi Form đóng (5/11) làm theo thứ tự: **Nhập đăng ký**, **Xem trước chia nhóm**, chuyển người nếu cần, **Chốt**.
4. Vào tab **Nhóm** để xem nhóm của mình, dán thử link nhóm Zalo.
5. Mở bằng điện thoại. Nếu mở link từ Zalo hay Messenger, web sẽ hiện cảnh báo "Hãy mở bằng Chrome hoặc Safari" kèm nút sao chép link.

Nếu đăng nhập báo lỗi, hãy chụp màn hình và gửi cho mình. Hai nguyên nhân hay gặp: nguồn JavaScript trong Bước 11 gõ sai (thừa dấu `/` hoặc có `/Learning`), hoặc màn hình đồng ý OAuth chưa chuyển sang "In production".

### Cách thêm hoặc cập nhật bài học

1. Mở kho trên GitHub, vào đúng thư mục `public/bai-hoc/hk1-2026-2027/<môn>/` (ví dụ `dia-chat-kien-truc`).
2. Bấm **Add file**, **Upload files**, thả file HTML vào. Cùng tên thì ghi đè, đó là cách cập nhật.
3. Bấm **Commit changes**. Đợi 1 đến 2 phút để Actions chạy xong, rồi nhấn **Ctrl+F5** trên web để thấy bản mới. Bài mới hoặc mới sửa có nhãn "Mới cập nhật" trong 7 ngày.
4. **Không bao giờ** đưa file quiz hay đề ôn vào thư mục này. GitHub Pages là hosting tĩnh: ai biết đường dẫn trực tiếp của file vẫn tải được, dù web có màn hình đăng nhập.
5. Tên môn, màu và chương nằm trong file `mon.json` của từng thư mục môn.

Bài học hiện có: Địa chất kiến trúc, Khoáng vật thạch học, Trắc địa công trình, Triết học Mác-Lênin. **Khoa học dữ liệu chưa có bài học** (mình chỉ thấy file ôn thi, đó là quiz nên không đăng). Khi bạn có file bài học, upload vào `khoa-hoc-du-lieu`.

---

## Phần 3. Lịch tuần, nộp câu hỏi, xin miễn (mốc M2)

Phần này có thêm tab `NhapCauHoi` trong Sheet và nhiều hành động mới ở máy chủ, nên **phải cập nhật Apps Script** trước khi dùng.

### Bước 16. Cập nhật Apps Script

1. Mở Apps Script của Sheet. Mở file `backend/dist/Code.gs` mới, **Ctrl+A**, **Ctrl+C**.
2. Dán đè toàn bộ vào `Code.gs` trong Apps Script, **Ctrl+S**.
3. Chọn hàm `khoiTao`, bấm **Chạy**. Hàm này an toàn, chỉ thêm tab `NhapCauHoi` còn thiếu.
4. **Triển khai**, **Quản lý triển khai**, bấm biểu tượng cây bút, ở "Phiên bản" chọn **Phiên bản mới**, bấm **Triển khai**. Không chọn "Triển khai mới" vì địa chỉ `/exec` sẽ đổi.

Làm đúng khi thấy: Sheet có thêm tab `NhapCauHoi`, và trong Apps Script nhật ký ghi "Đã tạo tab NhapCauHoi".

### Bước 17. Đưa bản web mới lên

Trong GitHub Desktop: ô Summary gõ `Thêm sự kiện và nộp câu hỏi`, bấm **Commit to main**, rồi **Push origin**. Vào tab **Actions** của kho chờ dấu tick xanh, rồi nhấn **Ctrl+F5** trên web.

### Bước 18. Tạo lịch các tuần

1. Đăng nhập web bằng tài khoản chủ, vào **Quản trị**, tab **Tuần**.
2. **Ngày Thứ Bảy của sự kiện đầu tiên**: `07/11/2026`. **Số tuần**: `5`. Bấm **Tạo lịch**.
3. Mỗi tuần có thể bấm mở để sửa giờ (ví dụ lùi hạn nộp), rồi bấm **Lưu giờ**.

Làm đúng khi thấy: hiện 5 tuần, tuần 1 mở cửa Thứ Bảy 07/11. Mặc định: hạn nộp 23:59 Thứ Sáu, mở cửa 00:00 Thứ Bảy, đóng cửa 23:59 Chủ nhật.

Lịch 5 tuần tương ứng các ngày 7-8/11, 14-15/11, 21-22/11, 28-29/11 và 5-6/12.

### Bước 19. (Tùy chọn) Điền danh sách chương mỗi môn

Mở tab `Mon` trong Sheet, cột `danhSachChuong`, điền dạng:

`[{"ma":"c1","ten":"Chương 1: Mở đầu"},{"ma":"c2","ten":"Chương 2: ..."}]`

Môn nào có chương thì thành viên chọn chương trong danh sách. Môn để `[]` thì thành viên tự gõ chương hoặc chủ đề.

### Bước 20. Thử vòng nộp câu hỏi

1. Vào **Quản trị**, **Thành viên**, mở **Thêm người đăng ký muộn**, thêm một email Google thử nghiệm của bạn (tài khoản thứ hai).
2. Đăng nhập web bằng tài khoản thử đó. Vào **Sự kiện**: phải thấy đếm ngược đến hạn nộp và "Đã nộp 0/15 câu".
3. Bấm **Nộp câu hỏi**, chọn 3 môn, điền thử 5 câu mỗi môn. Thoát ra rồi vào lại, bản nháp phải còn.
4. Bấm **Nộp tất cả**. Làm đúng khi thấy "Đã nộp đủ 15 câu. Bạn được vào phòng thi."
5. Thử nộp lại một câu trùng nội dung với câu đã có: phải bị báo trùng.
6. Thử với tài khoản khác (chưa nộp): bấm **Xin miễn tuần này**, rồi **Hủy xin miễn**.
7. Xong thử nghiệm, vào Sheet xóa các dòng thử trong tab `CauHoi`, `Mien`, `NhapCauHoi`, và xóa dòng tài khoản thử trong `ThanhVien`.

### Quy tắc đang áp dụng
- Mỗi người nộp đúng 3 môn × 5 câu. Mỗi câu cần nội dung, 4 đáp án khác nhau, đáp án đúng và trang hoặc slide nguồn. Giải thích không bắt buộc.
- Câu không được trùng nội dung với câu khác trong ngân hàng của học kỳ (so sánh không phân biệt hoa thường, bỏ dấu câu).
- Sửa câu đã nộp bằng cách vào lại **Nộp câu hỏi** và nộp lại, đến hết hạn.
- Được xin miễn tối đa 1 tuần trong học kỳ, trước hạn nộp, và chỉ khi chưa nộp câu hỏi.
- Phòng thi (làm bài, chấm điểm) chưa có, sẽ làm ở mốc M3.

---

## Phần 4. Phòng thi, chốt tuần, xếp hạng, nhớ đăng nhập (mốc M3)

Bản này có thêm tab `PhienDangNhap`, hành động thi và chấm ở máy chủ, và **trigger tự chốt tuần**. Phải cập nhật Apps Script và đặt trigger.

### Bước 21. Cập nhật Apps Script và đặt trigger

1. Mở `backend/dist/Code.gs` mới, **Ctrl+A**, **Ctrl+C**. Dán đè vào `Code.gs` trong Apps Script, **Ctrl+S**.
2. Chọn hàm `khoiTao`, bấm **Chạy** (thêm tab `PhienDangNhap`).
3. Chọn hàm `datTrigger`, bấm **Chạy**. Google có thể hỏi thêm quyền "quản lý trigger": cho phép.
4. **Triển khai**, **Quản lý triển khai**, cây bút, **Phiên bản mới**, **Triển khai**.

Làm đúng khi thấy: nhật ký ghi "Đã đặt trigger chotTuanTuDong chạy mỗi 15 phút". Vào biểu tượng đồng hồ (**Trình kích hoạt**) ở menu trái thấy một dòng `chotTuanTuDong`, kiểu "Theo thời gian".

### Bước 22. Đưa bản web mới lên

GitHub Desktop: Summary `Thêm phòng thi và xếp hạng`, **Commit to main**, **Push origin**. Chờ Actions tick xanh, rồi **Ctrl+F5**.

### Nhớ đăng nhập

Từ bản này, sau khi đăng nhập Google một lần, trình duyệt giữ **mã phiên 30 ngày** và các lần sau vào thẳng, không phải đăng nhập lại.
- Mã phiên lưu trong trình duyệt của từng người. Ở máy dùng chung, hãy bấm **Tài khoản**, **Đăng xuất**.
- Người bị gỡ khỏi lớp mất quyền ngay ở lần gọi kế tiếp, dù còn phiên.
- Muốn ép mọi người đăng nhập lại: xóa toàn bộ các dòng dưới tiêu đề trong tab `PhienDangNhap` của Sheet.
- Sheet chỉ lưu bản băm của mã phiên, không lưu mã gốc.

### Bước 23. Vòng thử trọn vẹn với 3 tài khoản thử nghiệm

Chuẩn bị: 3 tài khoản Google thử (ví dụ `thu1`, `thu2`, `thu3`) và tài khoản chủ. Vì mỗi người thi rút đề từ câu của người khác, cần ít nhất vài người nộp câu hỏi để có đủ câu. Với dữ liệu thử, đề có thể ngắn hơn 40 câu (máy chủ tự giảm và ghi vào tab `NhatKy` dòng `canhBaoRutDe`). Đó là bình thường khi thử.

1. Chủ: **Quản trị**, **Thành viên**, thêm 3 email thử.
2. Chủ: **Quản trị**, **Chia nhóm**, **Xem trước**, **Chốt** (hoặc chuyển người vào nhóm).
3. Chủ: **Quản trị**, **Tuần**. Để thử ngay, sửa tuần 1 cho khung giờ hiện tại: hạn nộp 5 phút nữa không hợp lý, hãy đặt **hạn nộp = hôm nay lúc vừa qua**, **mở cửa = hôm nay lúc vừa qua + 1 phút**, **đóng cửa = một giờ sau**. Bấm **Lưu giờ**.
   Lưu ý: để thử nộp câu hỏi trước, đặt hạn nộp ở tương lai, nộp xong rồi sửa lại giờ cho mở cửa.
4. Mỗi tài khoản thử: **Sự kiện**, **Nộp câu hỏi**, nộp 15 câu. Làm đúng khi thấy "Đã nộp đủ 15 câu".
5. Sửa giờ tuần 1 để phòng thi đang mở.
6. `thu1`: **Vào phòng thi**, chọn 2 môn, **Bắt đầu thi**. Trả lời vài câu, đợi 30 giây (hiện "Đã tự lưu"), tắt tab, mở lại web và vào **Sự kiện**, **Tiếp tục làm bài**. Các câu đã chọn phải còn nguyên và đồng hồ vẫn chạy.
7. `thu1`: **Nộp bài**. Làm đúng khi thấy điểm và "Đúng x/y câu". Vào lại **Vào phòng thi** thì chỉ thấy kết quả, không thi lại được.
8. `thu2`: thi và để hết giờ (hoặc bỏ dở). `thu3`: không thi.
9. Mở **Nhóm** bằng tài khoản `thu1`: thấy trạng thái từng người (Đã thi, Đang thi, Chưa nộp câu hỏi...) và điểm nhóm. Mở **Xếp hạng**: thấy bảng nhóm "Tạm tính".
10. Chốt tuần: sửa giờ **đóng cửa** về quá khứ rồi đợi tối đa 15 phút (hoặc trong Apps Script chạy hàm `chotTuanTuDong`). Làm đúng khi tab `KetQuaTuan` có dòng điểm từng nhóm, tab `Tuan` cột `trangThai` là `da_chot`, và trang **Xếp hạng** hiện "Nhóm vinh danh".
11. Dọn dữ liệu thử: xóa các dòng thử trong `CauHoi`, `LuotThi`, `KetQuaTuan`, `Mien`, `NhapCauHoi`, `PhienDangNhap`, `NhatKy`, các email thử trong `ThanhVien`, `NhomThanhVien`, và đặt lại giờ tuần 1 đúng lịch thật (dùng **Tuần**, **Tạo lịch** để tạo lại).

### Cách tính điểm đang áp dụng
- Mỗi người thi 2 môn tự chọn, mỗi môn 20 câu (40 câu), 40 phút. Điểm quy về thang 100.
- Đề rút ngẫu nhiên từ ngân hàng của tuần đó, loại câu của chính người thi. Thiếu câu thì lấy từ tuần khác cùng môn, rồi từ môn khác, vẫn thiếu thì đề ngắn hơn và ghi vào `NhatKy`.
- Điểm nhóm = tổng điểm các thành viên chia cho số thành viên đang hoạt động trừ người được miễn. Người không thi tính 0 điểm nhưng vẫn nằm trong mẫu số.
- Cùng điểm: nhóm có tỉ lệ thành viên đã thi cao hơn đứng trên; vẫn bằng: nhóm có thời gian làm bài bình quân ngắn hơn đứng trên.
- Bắt đầu thi trước giờ đóng cửa thì được làm hết 40 phút. Bài quá hạn được chấm theo bản tự lưu cuối cùng.
- Xem lại đáp án sau khi đóng cửa, báo sai câu hỏi và câu khó nhất sẽ làm ở mốc M4.

### Giới hạn cần biết
- Phòng thi chưa có nút **Báo sai câu hỏi** (mốc M4). Nếu có câu sai trong tuần đầu, chủ sửa trực tiếp trong tab `CauHoi` hoặc đổi cột `trangThai` thành `suspended`.
- Nếu nhiều người cùng bấm **Bắt đầu thi** đúng lúc mở cửa, mỗi người có thể chờ vài giây. Nên nhắc lớp vào thi rải rác, không cùng một giây.

---

## Phần 5. Điểm cá nhân và cấp bậc, báo sai, xem lại, quản lý ngân hàng (mốc M4)

Bản này thêm 3 tab mới trong Sheet (`Diem`, `DeTuTao`, `DanhHieu`) và nhiều khóa trong `CauHinh`. Phải cập nhật Apps Script.

### Bước 24. Cập nhật Apps Script và web

1. Mở `backend/dist/Code.gs` mới, **Ctrl+A**, **Ctrl+C**. Dán đè vào `Code.gs` trong Apps Script, **Ctrl+S**.
2. Chạy hàm `khoiTao` (thêm tab `Diem`, `DeTuTao`, `DanhHieu` và các khóa cấu hình mới). Không cần chạy `datTrigger` lại.
3. **Triển khai**, **Quản lý triển khai**, cây bút, **Phiên bản mới**, **Triển khai**.
4. GitHub Desktop: Summary `Thêm điểm cấp bậc, xem lại, ngân hàng`, **Commit to main**, **Push origin**, chờ Actions tick xanh, rồi **Ctrl+F5**.

Làm đúng khi thấy: trang chủ có thẻ **Cấp của tôi** (Võ Sĩ, Lv 1) và thẻ **Tự tạo đề luyện tập**.

### Cách tính điểm cá nhân

- **Tạo đề thi (ngoài sự kiện):** mục **Tự tạo đề luyện tập** (từ trang chủ). Chọn một **môn**, chọn một hoặc nhiều **chương** (không chọn chương nào là lấy tất cả), rồi bấm **Tạo đề**. Đề gồm **30 câu** rút ngẫu nhiên từ ngân hàng (không có câu của chính mình, ưu tiên câu chưa gặp). Làm xong xem đáp án và giải thích. Mỗi đề làm xong **+20 điểm**, tối đa **120 điểm mỗi tuần** (tuần tính từ Thứ Hai đến Chủ nhật). Đề hợp lệ là trả lời ít nhất một nửa số câu. Nếu số câu phù hợp ít hơn 30 thì đề ngắn hơn, tối thiểu 10 câu; ít hơn 10 câu thì không tạo được và web báo chọn thêm chương. Đề đang làm dở có thể **Làm tiếp** hoặc **Bỏ đề này** để tạo đề khác.
- **Thưởng nhóm cuối tuần:** khi tuần được chốt, thành viên **đã thi** của nhóm hạng 1 được **+50**, hạng 2 được **+30**, các nhóm còn lại **+10**. Người vắng hoặc được miễn không được thưởng.
- **Danh hiệu cá nhân của tuần:** người có điểm thi cao nhất tuần nhận danh hiệu **Thiên Kiêu Tuần N** (bằng điểm thì ai làm nhanh hơn; bằng cả hai thì cùng nhận), hiện ở mục **Xếp hạng**, tab **Cá nhân**.
- **Level:** cứ **100 điểm** lên 1 level, bắt đầu từ Lv 1. **Cấp lớn** đổi theo level:

| Cấp lớn | Level |
|---|---|
| Võ Sĩ | 1 đến 5 |
| Võ Sư | 6 đến 10 |
| Đại Võ Sư | 11 đến 15 |
| Tông Sư | 16 đến 20 |
| Đại Tông Sư | 21 đến 25 |
| Võ Vương | 26 đến 35 |
| Võ Hoàng | 36 đến 45 |
| Võ Đế | 46 đến 55 |
| Võ Thánh | 56 đến 70 |
| Võ Thần | 71 đến 90 |
| Thiên Tôn | 91 đến 120 |
| Đạo Tổ | từ 121 |

Muốn đổi các con số (điểm mỗi lượt, trần tuần, điểm mỗi level, điểm thưởng nhóm) hãy sửa trong tab `CauHinh`: `diemMoiDeTuTao`, `diemToiDaDeTuTaoTuan`, `diemMoiLevel`, `diemThuongNhom` (dạng `50,30,10`), `soCauDeTuTao`, `soCauToiThieuDeTuTao`. Muốn đổi tên cấp lớn hoặc khoảng level, nhờ mình sửa (nằm trong `backend/src/logic.js`).

### Báo sai, tạm loại, xóa câu hỏi

- Trong phòng thi, màn hình xem lại và luyện tập, mỗi câu có nút **Báo sai** (chỉ báo được câu đã gặp trong đề của mình, mỗi người một lần mỗi câu, tối đa 30 lần mỗi giờ).
- **2 người khác nhau** báo thì câu bị **tạm loại** (không rút cho đề mới nữa). **5 người** báo thì câu bị **xóa** (cũng không rút nữa). Các lượt thi đã nộp **giữ nguyên điểm**.
- Chủ khôi phục một câu thì các báo sai cũ của câu đó bị xóa để đếm lại từ đầu.
- Chưa có nút "Chấm lại tuần" (loại câu sai khỏi mẫu số); nếu cần, báo mình làm ở mốc sau.

### Xem lại bài và câu khó nhất

Sau khi một tuần đóng cửa: **Sự kiện**, **Xem lại bài và câu khó nhất**. Thấy toàn bộ câu mình được giao, đáp án mình chọn, đáp án đúng, giải thích, chương, trang nguồn, cùng **5 câu cả lớp sai nhiều nhất** (chỉ xét câu có ít nhất 3 lượt làm). Tắt phần câu khó bằng cách đặt `hienCauKhoNhat` thành `FALSE` trong `CauHinh`.

### Bước 25. Quản lý ngân hàng câu hỏi

**Quản trị**, tab **Câu hỏi** (chủ và trợ lý đều thấy):
- Lọc theo tuần, môn, trạng thái, tác giả, từ khóa, hoặc chỉ câu bị báo sai. Câu bị báo sai nhiều hiện lên đầu.
- Trợ lý được **Tạm loại** và **Khôi phục**. Chủ có thêm **Sửa** và **Xóa**.

**Xuất và nhập bản rà soát (chủ):**
1. Mở **Xuất và nhập ngân hàng**, bấm **Xuất CSV** hoặc **Xuất JSON** (kèm trang nguồn).
2. Đưa file cho Claude Code cùng PDF bài giảng để đối chiếu và sửa.
3. Chọn lại file đã sửa ở ô **Nhập bản đã sửa**. Hệ thống khớp theo `id` và cho **xem trước** từng thay đổi, danh sách câu lỗi (sẽ bị bỏ qua) và các id không có trong ngân hàng.
4. Bấm **Áp dụng**. Chỉ sửa được: nội dung, 4 đáp án, đáp án đúng, giải thích, trang nguồn, chương, trạng thái. Không đổi được `id` hay tác giả.

Làm đúng khi thấy: sau khi áp dụng, tab `NhatKy` có dòng `nhapNganHang`.

### Bước 26. Thử nhanh

1. Tài khoản thử: vào **Tự tạo đề luyện tập**, chọn môn và chương, làm một đề. Làm đúng khi thấy "+20 điểm cấp bậc" và thẻ cấp có 20 điểm.
2. Làm tiếp tới đề thứ 7 trong cùng tuần: đề thứ 7 không được cộng thêm (đạt trần 120).
3. Sau khi chốt tuần thử (`chotTuanTuDong`): kiểm tra tab `Diem` có dòng thưởng nhóm, tab `DanhHieu` có dòng danh hiệu, mục **Xếp hạng**, tab **Cá nhân** hiện đủ.
4. Dọn dữ liệu thử trong `Diem`, `DeTuTao`, `DanhHieu`, `BaoSai`, `LuotThi`, `KetQuaTuan`.

### Lưu ý
- Bảng xếp hạng cá nhân hiện **họ tên, cấp bậc, điểm** của mọi thành viên cho cả lớp xem. Thông báo quyền riêng tư đã được cập nhật.
- Tạo đề làm lộ đáp án của các câu đó cho người làm, đúng với thiết kế (xem đáp án sau khi nộp).
- Tuần tính điểm đề tự tạo là Thứ Hai đến Chủ nhật nên có thể lệch với tuần sự kiện (Thứ Bảy, Chủ nhật).

---

## Phần 6. Danh sách chương và web mượt hơn

### Bước 27. Nhập danh sách chương cho từng môn (làm trước khi cả lớp nộp câu hỏi)

Tạo đề chọn theo chương nên cần danh sách chương thống nhất. Lúc nộp câu hỏi, khi môn **đã có danh sách chương**, thành viên bắt buộc chọn chương trong danh sách; khi chưa có thì phải tự gõ (dễ lệch cách ghi).

1. **Quản trị**, tab **Chương**.
2. Với mỗi môn, nhập mỗi dòng một chương, ví dụ:
   `Chương 1: Mở đầu`
   `Chương 2: Thống kê`
3. Bấm **Lưu danh sách chương**.

Làm đúng khi thấy: tiêu đề môn hiện "N chương". Từ giờ ở **Nộp câu hỏi** và **Tự tạo đề luyện tập** có ô chọn chương của môn đó.

- Đổi thứ tự hoặc thêm chương: sửa danh sách rồi lưu. Giữ nguyên **tên** một chương thì giữ nguyên mã, các câu đã nộp vẫn khớp.
- Đổi **tên** một chương sẽ tạo mã mới, các câu cũ thuộc chương đó trở thành "chưa thuộc chương chuẩn".
- Nếu trước đó thành viên đã tự gõ chương, mục **Câu hỏi chưa thuộc chương chuẩn** liệt kê các cách ghi cũ, mỗi dòng có nút **Chuyển** để gộp vào chương chuẩn.

### Bước 28. Cập nhật Apps Script và web

1. Dán `backend/dist/Code.gs` mới, chạy `khoiTao` (thêm tab `DeTuTao` và các khóa cấu hình mới), triển khai **Phiên bản mới**.
2. Commit và push bản web bằng GitHub Desktop, chờ Actions tick xanh, **Ctrl+F5**.

### Web đã được làm mượt hơn như thế nào

Cảm giác "đang tải lâu" chủ yếu do mỗi lần bấm là một yêu cầu tới Google Apps Script, và mỗi yêu cầu phải đọc nhiều tab Sheet. Bản này giảm cả số yêu cầu lẫn lượng đọc:
- **Hiện ngay, cập nhật sau:** từ lần mở thứ hai, trang chủ, Sự kiện, Nhóm, Xếp hạng, Tạo đề hiện ngay từ bản lưu trên máy bạn, rồi tự cập nhật khi dữ liệu mới về. Chỉ các màn hình xem được lưu, không bao giờ lưu nội dung đề thi hay câu hỏi. Đăng xuất là xóa sạch.
- **Một yêu cầu cho trang chủ** thay vì ba.
- **Máy chủ đọc mỗi tab Sheet nhiều nhất một lần mỗi yêu cầu** và nhớ thêm 30 giây các tab nhỏ (cấu hình, học kỳ, môn, lịch tuần). Sửa tay trong Sheet các tab này sẽ có hiệu lực sau tối đa 30 giây; sửa qua trang Quản trị có hiệu lực ngay.
- **Ghi dữ liệu nhanh hơn:** mỗi dòng sửa bằng một lệnh thay vì từng ô.
- **Khung chờ** thay cho chữ "Đang tải..." và nối sẵn tới máy chủ Google khi mở trang.

Giới hạn còn lại: Apps Script thỉnh thoảng bị **"khởi động nguội"** (vài giây ở yêu cầu đầu tiên sau lúc không ai dùng). Đây là đặc điểm của Google, miễn phí thì không tránh hết được. Nhờ bản lưu trên máy, người dùng vẫn thấy giao diện ngay trong lúc chờ.

---

## Phần 7. Nhờ AI soạn câu hỏi, tạo đề thi, huy hiệu và biểu đồ (mốc M5)

### Bước 29. Cập nhật Apps Script và web

1. Dán `backend/dist/Code.gs` mới, chạy `khoiTao` (thêm cột `idDe` vào tab `Tuan` và `DeTuTao`), triển khai **Phiên bản mới**.
2. Commit và push bản web bằng GitHub Desktop, chờ Actions tick xanh, **Ctrl+F5**.

### Nhờ AI soạn câu hỏi (dành cho cả lớp, hướng dẫn gửi lớp được)

Trong **Sự kiện**, **Nộp câu hỏi** có mục **Dùng AI soạn câu hỏi**:

1. Chọn các môn bạn sẽ nộp ở Bước 1.
2. Bấm **Tải file prompt mẫu (.md)**. File có sẵn hướng dẫn, quy tắc soạn câu, danh sách chương của từng môn và **mẫu 5 câu cho mỗi môn đã chọn**.
3. Mở AI bất kỳ (ChatGPT, Claude, Gemini...), **bỏ file .md này vào**.
4. **Đưa thêm tài liệu tham khảo** (PDF, slide, giáo trình) của đúng môn và chương.
5. **Nói rõ môn và chương**, ví dụ: "Soạn câu hỏi theo file mẫu cho môn Khoa học dữ liệu, chương 2: Thống kê, chỉ dựa trên tài liệu đính kèm".
6. Sao chép toàn bộ câu trả lời của AI, quay lại web, dán vào ô **Dán câu hỏi từ AI**, bấm **Nhập vào form**. Web tự điền nội dung, 4 đáp án, đáp án đúng, trang nguồn, giải thích và chọn đúng chương.
7. Web báo các chỗ thiếu hoặc chương không khớp. **Kiểm tra từng câu với tài liệu gốc**, sửa nếu cần, rồi bấm **Nộp tất cả**.

Lưu ý: AI có thể nhầm hoặc bịa, người nộp chịu trách nhiệm về câu mình nộp. Máy chủ vẫn kiểm tra lại (đủ 5 câu mỗi môn, 4 đáp án khác nhau, không trùng câu đã có). Nếu môn đã có danh sách chương (**Quản trị**, **Chương**), AI được cho biết tên chương đúng để ghi.

### Tạo đề sự kiện từ ngân hàng (chủ)

**Quản trị**, tab **Đề sự kiện**:

1. **Chọn môn, số câu, chương:** tích môn muốn lấy, nhập số câu, và (nếu muốn) mở "Chỉ lấy một số chương".
2. **Bộ lọc:** chỉ lấy câu của một số tuần, loại trừ tác giả (nhập email), và **Tránh câu đã dùng trong các đề trước**. Chỉ lấy câu đang dùng.
3. Bấm **Rút ngẫu nhiên**. Xem từng câu, bấm **Thay câu khác** (cùng môn, cùng chương), **Bỏ**, hoặc dùng **Thêm câu thủ công từ ngân hàng**. Nếu ngân hàng không đủ câu, web báo rõ môn nào thiếu bao nhiêu.
4. Đặt **Tên đề**, bấm **Lưu nháp** hoặc **Lưu và phát hành cho thành viên**.

Với mỗi đề đã lưu bạn có:
- **In đề** và **In đáp án:** mở trang in, chọn "Lưu dưới dạng PDF" trong hộp thoại in. Bản đáp án riêng, có giải thích, chương và trang nguồn.
- **Tải đề .html**, **Tải đáp án .html**, **JSON**, **CSV**.
- **Phát hành cho thành viên:** hiện trong mục **Tự tạo đề luyện tập** của thành viên với tên "Đề do lớp trưởng phát hành". Mỗi người làm lần đầu được **+20 điểm** (tính vào trần 120 điểm mỗi tuần), các lần sau làm lại không cộng. **Gỡ phát hành** để ẩn.
- **Gán làm đề sự kiện:** chọn tuần rồi bấm **Gán làm đề sự kiện**. Phòng thi tuần đó dùng đúng đề này, cả lớp cùng bộ câu (thứ tự câu và đáp án mỗi người khác nhau), không cần chọn môn. Dùng cho tuần chung kết. Chỉ gán được **trước giờ mở cửa** của tuần đó.
- Thời gian làm bài của tuần đề cố định: **Quản trị**, **Tuần**, mục **Thời gian làm bài (phút)**.

Lưu ý quan trọng cho đề sự kiện cố định:
- Đề cố định **không loại câu do chính người thi nộp**. Nếu muốn tránh, dùng bộ lọc **Loại trừ tác giả** khi dựng đề.
- Đề đang gán cho tuần đã mở cửa thì không sửa danh sách câu được. Câu bị xóa khỏi ngân hàng sau khi gán sẽ bị bỏ khỏi đề.

### Huy hiệu và lịch sử điểm nhóm

Mục **Xếp hạng**, tab **Nhóm**:
- **Lịch sử điểm nhóm theo tuần:** biểu đồ đường, nhóm của bạn vẽ đậm.
- **Huy hiệu:** **Đủ quân** (mọi thành viên tính trong mẫu số cùng thi trong tuần, cộng dồn số tuần) và **Hạng nhất liên tiếp** (đứng hạng 1 từ 2 tuần liền nhau trở lên, tính đến tuần gần nhất). Mục **Nhóm** cũng hiện huy hiệu của nhóm bạn.
- Giải **nhóm tiến bộ nhất** đang **tắt** theo yêu cầu của bạn (khóa `giaiTienBo` trong `CauHinh`).

---

## Phần 8. Học kỳ, tổng kết, sao lưu, nhật ký, bảng điểm, lưu trữ (mốc M6)

### Bước 30. Cập nhật Apps Script và đặt trigger sao lưu

1. Dán `backend/dist/Code.gs` mới vào Apps Script, **Ctrl+S**.
2. Chạy `khoiTao` (thêm tab `TongKet`).
3. Chạy lại `datTrigger`. Lần này nó đặt **hai** trigger: `chotTuanTuDong` (mỗi 15 phút) và `saoLuuHangTuan` (Chủ nhật 3 giờ sáng). Google sẽ hỏi quyền truy cập Drive: cho phép.
4. **Triển khai**, **Quản lý triển khai**, cây bút, **Phiên bản mới**, **Triển khai**.
5. Commit và push bản web bằng GitHub Desktop, chờ Actions tick xanh, **Ctrl+F5**.

Làm đúng khi thấy: trong Apps Script, biểu tượng đồng hồ (**Trình kích hoạt**) có hai dòng: `chotTuanTuDong` và `saoLuuHangTuan`.

### Bước 31. Thử sao lưu

**Quản trị**, tab **Sao lưu**, bấm **Sao lưu ngay**. Làm đúng khi thấy một dòng "Sao luu 2026-.. ...." trong danh sách, và bấm **Mở thư mục sao lưu trong Drive** thấy thư mục "Learning Group - Sao luu" có file đó. Hệ thống giữ 8 bản gần nhất, bản cũ hơn vào thùng rác Drive.

**Khôi phục từ bản sao lưu:** mở bản sao lưu trong Drive (đó là một Google Sheet đầy đủ, có cả mã Apps Script). Muốn quay lại bản đó: dùng bản sao lưu làm Sheet chính (Apps Script đi kèm), triển khai lại Web app và cập nhật `API_URL` trong `src/config.ts`; hoặc chép riêng các tab cần thiết sang Sheet hiện tại.

### Bước 32. Bảng điểm, nhật ký

- **Quản trị**, **Điểm** (chủ và trợ lý đều xem): điểm thi từng người theo tuần, điểm trung bình, nhóm, cấp bậc, kèm điểm nhóm các tuần đã chốt. **Xuất CSV (báo cáo cho thầy)**: mở bằng Excel được, tiếng Việt đúng dấu. Không có GPA.
- **Nhật ký** (chủ và trợ lý): mọi thao tác quản trị (nhập đăng ký, chia nhóm, sửa câu hỏi, chấm lại, kết thúc học kỳ, sao lưu...), mới nhất ở trên, lọc theo hành động, người làm, từ khóa.

### Chấm lại tuần

Khi một câu bị báo sai là sai thật (bị tạm loại hoặc xóa), vào **Quản trị**, **Điểm**, mục **Chấm lại tuần**, chọn tuần rồi bấm **Chấm lại**. Hệ thống:
- Loại các câu không còn "đang dùng" khỏi tử số và mẫu số của mọi bài trong tuần đó.
- Tính lại điểm cá nhân, điểm nhóm, hạng, thưởng nhóm (50, 30, 10) và danh hiệu của tuần.
- Không đổi điểm tạo đề tự luyện. Chạy lại nhiều lần vẫn an toàn (lần sau không đổi thêm).
Chỉ chấm lại được tuần **đã chốt**. Nên chấm lại một lần sau khi đã xử lý xong các câu báo sai của tuần đó.

### Thêm môn mới

**Quản trị**, **Học kỳ**, **Thêm môn mới vào học kỳ đang mở**: nhập mã môn (chữ thường không dấu, ví dụ `giai-tich-1`), tên, màu. Web hiển thị đường dẫn và nội dung file `mon.json`: tạo file đó trong `public/bai-hoc/<học kỳ>/<môn>/` trên GitHub rồi upload bài học .html vào cùng thư mục. Danh sách chương nhập ở tab **Chương**.

### Bước 33. Cuối học kỳ

1. **Sao lưu ngay** (tab Sao lưu).
2. Đợi mọi người thi xong tuần cuối. Nếu có câu bị báo sai, xử lý rồi **Chấm lại tuần** cho các tuần cần thiết.
3. **Quản trị**, **Học kỳ**, **Kết thúc học kỳ này**. Hệ thống: chốt các tuần đã diễn ra, hủy các tuần chưa diễn ra, tính tổng kết (nhóm vô địch, thống kê tham gia theo tuần, cá nhân điểm cao nhất, cấp bậc cao nhất, danh hiệu) rồi đóng học kỳ. Nếu còn người đang làm bài, hệ thống báo tuần nào và không đóng; thử lại sau.
4. Mở **Tổng kết các học kỳ đã kết thúc**: **In hoặc lưu PDF** để báo cáo thầy, **Tải JSON** để lưu. Tổng kết cũng được lưu trong tab `TongKet`.
5. **Tạo học kỳ mới** (cùng tab). Chọn có sao chép môn và chương của học kỳ trước hay không, và có giữ nhóm cũ hay không.
   - **Điểm cấp bậc, danh hiệu, thành viên được giữ xuyên suốt các học kỳ.** Ngân hàng câu hỏi, lịch tuần và bảng xếp hạng nhóm bắt đầu trống.
   - Nếu chia lại nhóm bằng GPA mới: trong Sheet, đổi tên tab `DangKy` thành `DangKy HK1` (để lưu), vào Apps Script, **Cài đặt dự án**, **Thuộc tính tập lệnh**, xóa thuộc tính `FORM_ID`, chạy `taoFormDangKy` để tạo Form mới và tab `DangKy` mới. Gửi link Form mới cho lớp, đóng Form trước sự kiện đầu 2 ngày rồi làm **Nhập đăng ký** và **Chia nhóm** như Phần 4.
   - Tạo lịch tuần mới ở tab **Tuần**; điền danh sách chương ở tab **Chương**; upload bài học vào thư mục `public/bai-hoc/<mã học kỳ mới>/`.

### Bước 34. Lưu trữ cuối năm học (không bắt buộc)

Sheet càng nhiều dòng thì web càng chậm một chút. Cuối mỗi năm học:

1. Trong Google Sheet: **Tệp**, **Tạo bản sao**, đặt tên `Learning Group - Năm học 2026-2027 (lưu trữ)`. Bản này chỉ để xem lại, đừng nối vào web.
2. Trong Sheet đang chạy, xóa **các dòng dữ liệu** (giữ nguyên dòng tiêu đề trên cùng) của các tab của học kỳ cũ: `CauHoi`, `NhapCauHoi`, `LuotThi`, `DeTuTao`, `BaoSai`, `Mien`, `KetQuaTuan`, `Tuan`, `Nhom`, `NhomThanhVien`, `NhatKy`, `PhienDangNhap` (xóa tab này chỉ buộc mọi người đăng nhập lại).
3. **Tuyệt đối không xóa** dòng trong các tab: `ThanhVien`, `Diem` (điểm cấp bậc 4 năm), `DanhHieu`, `TongKet`, `HocKy`, `Mon`, `CauHinh`, `DeThi`. Các tab này nhỏ và cần cho cấp bậc, lịch sử và tổng kết.
4. Chỉ làm bước 2 sau khi đã kết thúc học kỳ và có bản sao ở bước 1.

### Thêm thành viên ở các năm sau

Sinh viên chuyển lớp hoặc thêm người: **Quản trị**, **Thành viên**, **Thêm người đăng ký muộn**, rồi **Chia nhóm** (hoặc chuyển nhóm tại mục Nhóm hiện tại). Không cần đụng đến mã.

### Quyền trợ lý

Cấp bằng **Làm trợ lý** ở tab Thành viên. Trợ lý xem được điểm mọi người, bảng điểm, nhật ký, ngân hàng câu hỏi (duyệt, tạm loại, khôi phục), danh sách sao lưu. Trợ lý **không** gỡ người, không đổi cấu hình, không xóa hay sửa câu hỏi, không xem GPA, không kết thúc học kỳ.

---

## Phần 9. Danh sách kiểm tra cuối cùng trước khi chạy thật

Đánh dấu từng mục khi đã làm. Mục nào chưa chắc thì quay lại bước tương ứng.

**Tài khoản và triển khai**
- [ ] Đăng nhập tài khoản dự án; Google Cloud: ứng dụng OAuth ở trạng thái **In production**, nguồn JavaScript đúng `https://geogroupu-collab.github.io` (Phần 2).
- [ ] Mở link Web app `/exec` thấy `{"ok":true,...}` (Bước 12).
- [ ] Trang web mở được, đăng nhập được, tài khoản chưa đăng ký bị chặn đúng (Bước 15).
- [ ] `client_secret*.json` không nằm trong kho GitHub (kiểm tra trên GitHub không thấy file này).
- [ ] Sheet **không chia sẻ** cho thành viên (nút Chia sẻ chỉ có tài khoản dự án).

**Sheet và trigger**
- [ ] Đã dán `Code.gs` bản mới nhất và triển khai **Phiên bản mới** sau mỗi lần cập nhật.
- [ ] Đã chạy `khoiTao`; đủ tab (kể cả `DeTuTao`, `Diem`, `DanhHieu`, `TongKet`, `PhienDangNhap`, `NhapCauHoi`).
- [ ] Đã chạy `datTrigger`; thấy hai trigger `chotTuanTuDong` và `saoLuuHangTuan`.
- [ ] Sao lưu thử thành công, thấy file trong Drive (Bước 31).
- [ ] `OWNER_EMAIL` và `GOOGLE_CLIENT_ID` đã đặt trong Script Properties.

**Dữ liệu học kỳ**
- [ ] Tab `HocKy` có học kỳ ở trạng thái `mo`; tab `Mon` đúng 5 môn.
- [ ] Danh sách chương đã nhập cho từng môn (tab Chương).
- [ ] Lịch tuần đã tạo đúng ngày (7-8/11, 14-15/11, 21-22/11, 28-29/11, 5-6/12), giờ hạn nộp 23:59 Thứ Sáu.
- [ ] Form đăng ký đã gửi cho lớp, đóng đúng hạn 5/11; đã nhập đăng ký, chia nhóm và **Chốt**.
- [ ] Bài học đã upload; **không** có file quiz hoặc đề ôn trong `public/bai-hoc`.
- [ ] Chủ đã thử trên điện thoại thật (Chrome và Safari), và mở link trong Zalo thấy cảnh báo.

**Vòng thử cuối với 3 tài khoản Google thử nghiệm** (làm Bước 20, 23 và 26 rồi dọn dữ liệu thử)
- [ ] Đăng ký, nộp 15 câu, xin miễn và hủy xin miễn.
- [ ] Thi: bắt đầu, tắt trang, mở lại làm tiếp, nộp; không thi được lần hai.
- [ ] Chốt tuần (hàm `chotTuanTuDong`): điểm nhóm đúng cách tính, thưởng nhóm, danh hiệu.
- [ ] Xem lại bài sau khi đóng cửa, câu khó nhất, báo sai (2 người thì tạm loại).
- [ ] Tự tạo đề luyện tập (chọn môn, chương), được +20, đạt trần 120 thì không cộng thêm.
- [ ] Dùng AI soạn câu hỏi: tải file mẫu, dán kết quả vào form.
- [ ] Xóa dữ liệu thử trong Sheet (các dòng thử trong `CauHoi`, `LuotThi`, `DeTuTao`, `Diem`, `DanhHieu`, `KetQuaTuan`, `Mien`, `BaoSai`, `NhapCauHoi`, `NhatKy`, `PhienDangNhap`, và các email thử trong `ThanhVien`, `NhomThanhVien`), rồi **Tạo lịch** lại để giờ các tuần đúng lịch thật.

**Trước sự kiện đầu tiên (7/11)**
- [ ] Nhắc cả lớp: dùng Chrome hoặc Safari, nộp câu hỏi trước Thứ Sáu 23:59, vào thi rải rác không cùng một giây. Gửi `HUONG-DAN-THANH-VIEN.md`.
- [ ] Sao lưu ngay trước giờ mở cửa.
- [ ] Nếu M3 chưa chạy ổn trước 7/11: dời sự kiện đầu một tuần (Quản trị, Tuần, sửa giờ) thay vì cắt giảm.

**Chuẩn bị tuần chung kết (trước 13/12)**
- [ ] Dựng đề cố định ở tab **Đề sự kiện** (loại trừ tác giả nếu cần), in đề và đáp án để kiểm tra, **Gán làm đề sự kiện** cho tuần chung kết trước giờ mở cửa, chỉnh thời gian làm bài ở tab Tuần.

---

## Phụ lục. Cập nhật tăng tốc và sửa tên tài khoản

**Làm gì:** dán `backend/dist/Code.gs` mới vào Apps Script, **Ctrl+S**, **Triển khai**, **Quản lý triển khai**, cây bút, **Phiên bản mới**, **Triển khai** (không cần chạy `khoiTao` hay `datTrigger` lại). Sau đó commit và push bản web, chờ Actions tick xanh, **Ctrl+F5**.

**Có gì mới:**
- **Tên hiển thị:** ở **Tài khoản** mỗi người tự sửa được tên của mình (2 đến 60 ký tự). Dùng khi tên trong Form viết sai, hoặc khi bạn đã **Gỡ kèm xóa dữ liệu** rồi **Mở lại** người đó (tên bị đặt thành "(đã xóa)"). Trong lúc chưa đặt lại tên, web hiện phần đầu của email thay cho "(đã xóa)".
- **Gỡ kèm xóa dữ liệu** không còn lỗi khi chưa có tab `DangKy`.
- **Nhanh hơn:**
  - Mã dành cho trang Quản trị chỉ tải khi quản trị viên mở trang đó. Thành viên tải ít hơn khoảng một phần ba.
  - Trang chủ không còn đọc lại tab `CauHoi` (tab lớn nhất) ở mỗi lần mở; số câu đã nộp được nhớ 2 phút và tự cập nhật ngay khi có người nộp hay sửa câu hỏi.
  - Màn hình đăng nhập "đánh thức" Apps Script ngay khi mở, nên lúc bấm vào đỡ chờ vài giây khởi động nguội.
  - Sau khi vào trang chủ, web tải trước Xếp hạng và Nhóm (một lần mỗi phiên) nên bấm sang là hiện ngay.

---

## Phụ lục 2. Duyệt câu hỏi trước khi vào ngân hàng

**Làm gì (một lần):** dán `backend/dist/Code.gs` mới vào Apps Script, **Ctrl+S**, **Triển khai**, **Quản lý triển khai**, cây bút, **Phiên bản mới**, **Triển khai**. Sau đó commit và push bản web, chờ Actions tick xanh, **Ctrl+F5**. **Chạy `khoiTao` một lần** (chọn hàm `khoiTao` ở thanh trên, bấm **Chạy**; không mất dữ liệu) để thêm cột `ghiChuDuyet` vào tab `CauHoi` và dòng cấu hình `duyetCauHoiTruoc`. Làm bước này trước khi duyệt câu đầu tiên, nếu không lý do từ chối sẽ không được lưu.

**Từ giờ câu hỏi chạy thế nào:**
1. Thành viên nộp câu, câu ở trạng thái **Chờ duyệt**. Việc nộp vẫn tính đủ để mở khóa phòng thi, nhưng câu chưa được rút vào đề nào (đề sự kiện, đề tự tạo).
2. Nút **Quản trị** hiện số đỏ là số câu đang chờ duyệt.
3. Bạn hoặc trợ lý vào **Quản trị, Câu hỏi**. Khung **Duyệt câu hỏi** ở trên cùng cho phép:
   - **Chỉ xem câu chờ duyệt**, rồi bấm **Duyệt** hoặc **Từ chối** từng câu (từ chối thì nhập lý do, người nộp sẽ thấy lý do ở **Câu hỏi của tôi**).
   - **Duyệt cả bộ lọc hiện tại**: lọc theo tuần, môn hoặc người nộp rồi duyệt cả loạt.
4. Câu bị từ chối không vào đề. Câu được duyệt chuyển sang **Đang dùng**.

**Làm đợt rà soát bằng AI (chỉ chủ):**
1. Trong khung **Duyệt câu hỏi**, mở **Rà soát cả đợt bằng AI**, giữ tick **Kèm các câu đã duyệt để so trùng**, bấm **Xuất đợt chờ duyệt**. Máy tải về hai tệp: `cho-duyet-<ngày>.md` (để đọc) và `cho-duyet-<ngày>.json` (đầy đủ dữ liệu). Tên người nộp chỉ hiện là T01, T02, không lộ email. Mỗi câu có gợi ý "nghi trùng" nếu giống câu khác từ 70%.
2. Đưa tệp `.md` cho AI (hoặc cho tôi đọc trong Claude Code), nhờ phân loại: câu nào **trùng**, câu nào **dở**, câu nào **hay**. Yêu cầu AI trả lại một mảng JSON theo mẫu ở đầu tệp `.md`: mỗi câu có `id`, `quyetDinh` (`duyet` hoặc `tu_choi`, để trống nếu chưa quyết), `ghiChuDuyet` (lý do), và các trường đã sửa nếu có.
3. Lưu kết quả thành tệp `.json`, vào **Xuất và nhập ngân hàng**, chọn tệp ở ô **Nhập bản đã sửa**. Web cho **xem trước** (có dòng "sẽ duyệt X câu, từ chối Y câu"), bạn đọc rồi bấm **Áp dụng**.
4. Muốn lưu lại cả đợt để sau tra cứu (câu nào trùng, dở, hay): đặt tệp `.md`, `.json` đã xuất và tệp kết quả vào thư mục `ngan-hang-luu-tru/` trong dự án. Thư mục này **không bao giờ được đẩy lên GitHub** (đã chặn trong `.gitignore`).
5. Khi đã lưu xong, bấm **Dọn câu bị từ chối** để xóa hẳn các câu bị từ chối khỏi Sheet cho nhẹ. Nút này **chỉ xóa câu đang ở trạng thái Bị từ chối**, không đụng tới câu đã duyệt hay câu chờ duyệt.

**Lưu ý quan trọng:**
- **Đừng đẩy ngân hàng câu hỏi hoặc đáp án lên GitHub của dự án.** Kho này công khai, ai cũng đọc được đáp án trước giờ thi. Muốn lưu lịch sử trên GitHub, tạo một kho **riêng tư** khác và đẩy lên đó.
- **Phải duyệt trước tối Thứ Sáu.** Đề chỉ rút câu đã duyệt. Nếu chưa duyệt kịp, đề thiếu câu (hệ thống lấy bù từ tuần khác hoặc làm đề ngắn hơn).
- Câu **đã duyệt vẫn nằm trong Sheet**, vì đề thi và bảng điểm cần chúng. Chỉ câu bị từ chối mới bị dọn đi.
- Muốn tắt hẳn bước duyệt (câu nộp vào ngân hàng ngay): ở tab `CauHinh` đặt `duyetCauHoiTruoc` thành `FALSE`.
