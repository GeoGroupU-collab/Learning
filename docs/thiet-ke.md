# Hệ thiết kế Learning Group

Toàn bộ giao diện nằm trong `src/style.css`. Ý tưởng: **bản đồ thực địa**, hợp với các môn địa chất, khoáng vật, trắc địa của lớp. Giấy lạnh xám xanh, mực đậm, một màu nhấn xanh khoáng vật, nhãn và số dùng chữ đơn cách như ghi chú khảo sát. Thẻ phẳng, viền mảnh. Không gradient, không hiệu ứng kính, không đổ bóng, không chuyển động liên tục.

## Chữ
| Vai trò | Font | Dùng cho |
|---|---|---|
| Giao diện | Be Vietnam Pro 400, 600 | Mọi chữ thường, tiêu đề (thiết kế riêng cho tiếng Việt, dấu thanh gọn) |
| Số và nhãn | IBM Plex Mono 500 | Đồng hồ đếm ngược, điểm, level, nhãn mục viết hoa, tiêu đề bảng, huy hiệu |

Font được đóng gói cùng web (`@fontsource`), không gọi dịch vụ ngoài. Thang cỡ chữ: 0,7 / 0,84 / 0,94 / 1 / 1,12 / 1,3 / 1,65 / 1,9 rem.

## Màu (mỗi màu là một biến trong `:root`)
| Biến | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--nen` / `--mat` / `--mat-2` | #eceff0 / #fff / #f4f6f7 | #0e1418 / #151d23 / #1b252c | Nền trang, thẻ, nền phụ |
| `--chu`, `--chu-2`, `--chu-3` | #16202a, #46535e, #5b6a75 | #e7edf0, #b2c0c8, #8da0ac | Chữ chính, chữ phụ, chữ mờ |
| `--nhan` | #0b6e5a | #46c7a8 | Liên kết, mục đang chọn, nút chính |
| `--vang` | #7a4f00 | #e3b650 | **Chỉ** điểm và cấp bậc |
| `--loi`, `--tot` | #b3261e, #17703f | #ff8b80, #6fd59b | Lỗi, đúng |

Cả 26 cặp chữ và nền chính ở hai giao diện đều đạt tương phản tối thiểu **4,5:1** (đã tính bằng công thức WCAG).

**Màu môn học:** dữ liệu (Sheet hoặc `mon.json`) có thể ghi màu bất kỳ, nhưng giao diện chỉ lấy sắc độ (hue) rồi tô lại bằng độ bão hòa và độ sáng chuẩn của từng giao diện (`--mon-s`, `--mon-l`), nên các môn luôn hài hòa và đọc được cả sáng lẫn tối. Hàm: `src/mau.ts`.

## Khoảng cách và bo góc
Thang khoảng cách 4, 8, 12, 16, 24, 32 px (`--k1` đến `--k6`). Bo góc 4 px (nhãn), 6 px (nút, ô nhập), 10 px (thẻ). Nút và ô nhập cao tối thiểu 44 px cho ngón tay.

## Thành phần
| Thành phần | Lớp | Ghi chú |
|---|---|---|
| Thẻ | `.card` | Viền 1 px, không bóng. Thẻ trong thẻ tự đổi nền nhạt. |
| Hàng môn học | `a.card-mon` | Chấm màu, tên, mô tả, mũi tên. Không dùng dải màu bên cạnh thẻ. |
| Nút | `.nut` (chính), `.nut-phu`, `.nut-nguy`, `.nut.nho` | Chính: nền xanh. Phụ: viền. Nguy hiểm: viền đỏ. |
| Nhãn nhỏ | `.nhan`, `.nhan-vang`, `.nhan-loi`, `.nhan-xam` | Chữ đơn cách viết hoa, 11 px |
| Nhãn mục | `.nhan-muc` | Dòng nhỏ viết hoa phía trên tiêu đề |
| Tab | `.tabs`, `.tab`, `.tab-dang` | Gạch chân, cuộn ngang, tab đang chọn tự cuộn vào giữa |
| Bảng | `.bang` | Số căn theo chữ số bằng nhau, tiêu đề đơn cách |
| Đồng hồ | `.dem-nguoc` | Chữ đơn cách, số cố định bề rộng |
| Cấp bậc | `.the-cap` | Màu vàng thổ duy nhất của giao diện |
| Phòng thi | `.dap-an-nut`, `.chu-dap-an`, `.o-so` | Đáp án là hàng có ô chữ cái vuông, đã chọn thì viền và nền xanh |
| Khung chờ | `.khung-cho` | Tĩnh, không nhấp nháy |

## Bố cục
- **Điện thoại:** đầu trang (logo, Quản trị, ảnh đại diện) và thanh 5 mục ở dưới, mục đang chọn có gạch xanh phía trên.
- **Máy tính (từ 900 px):** thanh 5 mục chuyển lên đầu trang cạnh logo; trang chủ chia hai cột.
- **Đọc bài học:** toàn màn hình, chỉ còn thanh Quay lại.
- Nội dung rộng tối đa 720 px; nơi cần rộng hơn thì bảng cuộn ngang riêng.

## Biểu tượng
Bộ nét mảnh vẽ tay trong `src/icon.ts` (nhà, sách, lịch, nhóm, cúp, người, khiên, mũi tên...), màu theo chữ. Dấu hiệu thương hiệu là các đường đồng mức của bản đồ địa hình quanh một điểm mốc; nền đường đồng mức dùng ở màn hình đăng nhập.

## Giao diện sáng và tối
Mặc định theo thiết bị. Người dùng chọn cố định ở **Tài khoản, Giao diện** (lưu trong trình duyệt). Mọi màu đều là biến, có giá trị cho cả hai giao diện; không viết màu cố định trong thành phần.

## Khi thêm giao diện mới
1. Dùng biến màu và khoảng cách, không viết mã màu hay số px lẻ.
2. Số liệu, đồng hồ, nhãn mục dùng `--font-so`.
3. Màu vàng thổ chỉ dành cho điểm và cấp bậc; màu xanh nhấn chỉ cho thứ bấm được hoặc đang chọn.
4. Không thêm gradient, bóng đổ, hiệu ứng kính, biểu tượng ký tự (★ ✦ ▤), hay emoji. Dùng `icon()`.
5. Kiểm tra ở 390 px, ở máy tính, ở sáng và tối.
