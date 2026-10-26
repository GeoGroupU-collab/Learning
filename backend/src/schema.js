// Cấu trúc các tab của Google Sheet và cấu hình mặc định.
// File này không gọi API của Apps Script nên test được bằng Vitest.

var TABS = [
  { name: 'CauHinh', headers: ['khoa', 'giaTri', 'moTa'] },
  { name: 'HocKy', headers: ['maHocKy', 'tenHocKy', 'batDau', 'ketThuc', 'trangThai'] },
  { name: 'Mon', headers: ['maHocKy', 'maMon', 'tenMon', 'mau', 'danhSachChuong'] },
  { name: 'ThanhVien', headers: ['email', 'hoTen', 'vaiTro', 'trangThai', 'ngayThamGia', 'ghiChu'] },
  // DangKy do Google Form tạo (xem form.js), chứa GPA nên chỉ chủ được xem.
  { name: 'Nhom', headers: ['maHocKy', 'maNhom', 'tenNhom', 'linkZalo'] },
  { name: 'NhomThanhVien', headers: ['maHocKy', 'maNhom', 'email'] },
  {
    name: 'Tuan',
    headers: [
      'maHocKy', 'soTuan', 'hanNopCauHoi', 'moCua', 'dongCua',
      'soMonThi', 'soCauMoiMonThi', 'thoiGianPhut', 'trangThai',
    ],
  },
  {
    name: 'CauHoi',
    headers: [
      'id', 'maHocKy', 'soTuan', 'maMon', 'maChuong', 'trangNguon', 'noiDung',
      'A', 'B', 'C', 'D', 'dapAn', 'giaiThich', 'tacGia', 'trangThai', 'ngayNop',
    ],
  },
  { name: 'BaoSai', headers: ['idCauHoi', 'email', 'lyDo', 'thoiGian'] },
  { name: 'Mien', headers: ['maHocKy', 'soTuan', 'email', 'lyDo', 'thoiGian'] },
  {
    name: 'LuotThi',
    headers: [
      'maHocKy', 'soTuan', 'email', 'maPhien', 'batDauLuc', 'hetHanLuc', 'nopLuc',
      'dsCau', 'traLoi', 'soDung', 'soCau', 'diem', 'giayLam',
    ],
  },
  {
    name: 'KetQuaTuan',
    headers: [
      'maHocKy', 'soTuan', 'maNhom', 'diemNhom', 'soThanhVienTinh', 'soThamGia',
      'tongGiayLam', 'hang',
    ],
  },
  { name: 'DeThi', headers: ['idDe', 'tenDe', 'loai', 'dsIdCau', 'ngayTao', 'trangThai'] },
  { name: 'NhatKy', headers: ['thoiGian', 'email', 'hanhDong', 'doiTuong', 'chiTiet'] },
];

// Mỗi dòng: [khóa, giá trị mặc định, mô tả]. khoiTao() chỉ thêm khóa còn thiếu, không ghi đè.
var CAU_HINH_MAC_DINH = [
  ['soMonThi', 2, 'Số môn mỗi người tự chọn để thi trong một tuần'],
  ['monThiTuChon', true, 'Người thi tự chọn các môn lúc bắt đầu thi (không bị gắn với môn đã nộp câu hỏi)'],
  ['soCauMoiMonThi', 20, 'Số câu mỗi môn trong bài thi'],
  ['thoiGianPhut', 40, 'Thời gian làm bài (phút) cho cả bài thi'],
  ['soMonNopCauHoi', 3, 'Số môn mỗi người phải nộp câu hỏi trong một tuần'],
  ['soCauNopMoiMon', 5, 'Số câu hỏi phải nộp cho mỗi môn'],
  ['kichThuocNhom', 6, 'Số người mỗi nhóm khi chia'],
  ['soTuanMienToiDa', 1, 'Số tuần được xin miễn trong 5 tuần sự kiện'],
  ['cheDoPool', 'tuan', 'tuan: rút đề từ câu của tuần đó; luy_ke: từ cả học kỳ đến tuần đó'],
  ['baoSaiTamLoai', 2, 'Số người khác nhau báo sai thì câu bị tạm loại (không rút nữa)'],
  ['baoSaiXoa', 5, 'Số người khác nhau báo sai thì câu bị xóa hẳn'],
  ['xemLaiSauDongCua', true, 'Cho xem lại bài sau khi đóng cửa'],
  ['hienCauKhoNhat', true, 'Hiện 5 câu khó nhất tuần sau khi đóng cửa'],
  ['giaiTienBo', false, 'Bật giải nhóm tiến bộ nhất'],
  ['xoaGpaSauChiaNhom', false, 'Tự nhắc xóa cột GPA sau khi chia nhóm'],
  ['graceGiay', 30, 'Số giây gia hạn khi nộp bài trễ do mạng'],
];

// Học kỳ và môn khởi tạo lần đầu (chỉ khi tab còn trống). Chủ sửa trong Sheet sau.
var HOC_KY_MAU = { maHocKy: 'hk1-2026-2027', tenHocKy: 'Học kỳ 1 năm học 2026-2027' };

var MON_MAU = [
  { maMon: 'khoa-hoc-du-lieu', tenMon: 'Khoa học dữ liệu', mau: '#4cc9f0' },
  { maMon: 'dia-chat-kien-truc', tenMon: 'Địa chất kiến trúc', mau: '#f4a261' },
  { maMon: 'triet-hoc-mac-lenin', tenMon: 'Triết học Mác-Lênin', mau: '#e5383b' },
  { maMon: 'khoang-vat-thach-hoc', tenMon: 'Khoáng vật thạch học', mau: '#b5179e' },
  { maMon: 'trac-dia-cong-trinh', tenMon: 'Trắc địa công trình', mau: '#80ed99' },
];

if (typeof module !== 'undefined') {
  module.exports = { TABS, CAU_HINH_MAC_DINH, HOC_KY_MAU, MON_MAU };
}
