# Hướng dẫn cho chủ (lớp trưởng) – Learning Group

Tài liệu này được viết thêm sau mỗi mốc. Hiện có **Phần 1 (mốc M0)**: tạo Google Sheet, dán mã, chạy khởi tạo, tạo Form đăng ký.

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
