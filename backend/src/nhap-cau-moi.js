// Chủ thêm thẳng câu hỏi mới vào ngân hàng (ví dụ câu từ đề thi cũ có đáp án). Câu vào luôn ở trạng thái đang dùng,
// tác giả là "ngan-hang-chung" nên ai cũng làm được, không ai bị loại vì là tác giả. Tuần = 0 nên không dính tuần nào.

var TAC_GIA_CHUNG_ = 'ngan-hang-chung';
var GIAI_THICH_NHAP_TOI_DA_ = 3000; // chủ nhập nên cho giải thích dài hơn giới hạn 500 của câu thành viên nộp

function laChuoiTho_(v) {
  return String(v == null ? '' : v).trim();
}

// Khớp tên chương người nhập ("Chương 2") với chương chuẩn của môn ("Chương 2 Python cơ bản") để tạo đề lọc theo chương được.
// Khớp đúng toàn bộ, hoặc là phần đầu của đúng một chương chuẩn (sau phần đầu phải là dấu cách hay dấu câu, nên "Chương 1" không khớp "Chương 10").
function khopChuongChuan_(gia, dsChuan) {
  var g = laChuoiTho_(gia).toLowerCase().replace(/\s+/g, ' ');
  if (!g || !dsChuan || !dsChuan.length) return laChuoiTho_(gia);
  var khop = dsChuan.filter(function (c) {
    var x = String(c).toLowerCase().replace(/\s+/g, ' ').trim();
    return x === g || (x.indexOf(g) === 0 && !/[\p{L}\p{N}]/u.test(x.charAt(g.length)));
  });
  return khop.length === 1 ? String(khop[0]).trim() : laChuoiTho_(gia);
}

// Kiểm tra từng dòng. Ở đây bốn đáp án chỉ cần khác nhau theo chữ thô (khác khoảng trắng hay dấu câu vẫn là khác),
// vì câu về code có đáp án như "[ An][8.5]" và "[An ][8.5]".
function kiemTraCauNhapMoi_(r, nhan, monHopLe, chuongCuaMon) {
  var loi = [];
  var c = {
    maMon: laChuoiTho_(r.maMon), maChuong: khopChuongChuan_(r.maChuong, chuongCuaMon[laChuoiTho_(r.maMon)]), trangNguon: laChuoiTho_(r.trangNguon),
    noiDung: laChuoiTho_(r.noiDung), A: laChuoiTho_(r.A), B: laChuoiTho_(r.B), C: laChuoiTho_(r.C), D: laChuoiTho_(r.D),
    dapAn: laChuoiTho_(r.dapAn).toUpperCase(), giaiThich: laChuoiTho_(r.giaiThich),
  };
  if (!monHopLe[c.maMon]) loi.push(nhan + 'môn "' + c.maMon + '" không có trong học kỳ đang mở.');
  ['noiDung', 'A', 'B', 'C', 'D'].forEach(function (k) { if (c[k] === '') loi.push(nhan + 'thiếu ' + k + '.'); });
  if (['A', 'B', 'C', 'D'].indexOf(c.dapAn) === -1) loi.push(nhan + 'đáp án đúng phải là A, B, C hoặc D.');
  if (c.noiDung.length > GIOI_HAN_CHU_.noiDung) loi.push(nhan + 'nội dung quá dài (tối đa ' + GIOI_HAN_CHU_.noiDung + ' ký tự).');
  ['A', 'B', 'C', 'D'].forEach(function (k) { if (c[k].length > GIOI_HAN_CHU_.dapAn) loi.push(nhan + 'đáp án ' + k + ' quá dài.'); });
  if (c.giaiThich.length > GIAI_THICH_NHAP_TOI_DA_) loi.push(nhan + 'giải thích quá dài (' + c.giaiThich.length + ' ký tự, tối đa ' + GIAI_THICH_NHAP_TOI_DA_ + ').');
  if (c.trangNguon.length > GIOI_HAN_CHU_.trangNguon) loi.push(nhan + 'trang nguồn quá dài.');
  if (c.maChuong.length > GIOI_HAN_CHU_.maChuong) loi.push(nhan + 'tên chương quá dài.');
  var khacNhau = {};
  ['A', 'B', 'C', 'D'].forEach(function (k) { khacNhau[c[k]] = true; });
  if (Object.keys(khacNhau).length < 4) loi.push(nhan + 'bốn đáp án phải khác nhau.');
  return { c: c, loi: loi };
}

// body: {rows: [...], chiXem: true để chỉ xem trước}. Hoặc ghi tất cả, hoặc không ghi gì nếu có dòng lỗi.
function hdNhapCauMoi_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var rows = body.rows;
  if (!Array.isArray(rows) || !rows.length || rows.length > 500) throw loi_('du_lieu_sai', 'Cần từ 1 đến 500 câu hỏi.');
  var monHopLe = {};
  var chuongCuaMon = {};
  monCuaHocKy_(hk.maHocKy).forEach(function (m) { monHopLe[m.ma] = true; chuongCuaMon[m.ma] = m.chuong; });
  var daCo = {};
  docBang_('CauHoi').forEach(function (c) {
    if (c.maHocKy === hk.maHocKy && c.trangThai !== 'removed' && c.trangThai !== 'tu_choi') daCo[c.maMon + '|' + chuanHoaChu(c.noiDung)] = true;
  });
  var loi = [];
  var hopLe = [];
  var soTrung = 0;
  rows.forEach(function (r, i) {
    var kq = kiemTraCauNhapMoi_(r || {}, 'Câu ' + (i + 1) + ': ', monHopLe, chuongCuaMon);
    if (kq.loi.length) { loi = loi.concat(kq.loi); return; }
    var khoa = kq.c.maMon + '|' + chuanHoaChu(kq.c.noiDung);
    if (daCo[khoa]) { soTrung++; return; }
    daCo[khoa] = true;
    hopLe.push(kq.c);
  });
  var tomTat = { soHopLe: hopLe.length, soTrung: soTrung, loi: loi.slice(0, 20), soLoi: loi.length };
  if (body.chiXem) return tomTat;
  if (loi.length) throw loi_('cau_sai', 'Có ' + loi.length + ' lỗi, chưa thêm câu nào: ' + loi.slice(0, 5).join(' '));
  return voiKhoa_(function () {
    var bayGio = new Date();
    hopLe.forEach(function (c) {
      themDong_('CauHoi', {
        id: Utilities.getUuid(), maHocKy: hk.maHocKy, soTuan: 0, maMon: c.maMon, maChuong: c.maChuong, trangNguon: c.trangNguon,
        noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich,
        tacGia: TAC_GIA_CHUNG_, trangThai: 'active', ngayNop: bayGio,
      });
    });
    ghiNhatKy_(email, 'nhapCauMoi', hk.maHocKy, { daThem: hopLe.length, trung: soTrung });
    return { daThem: hopLe.length, soTrung: soTrung };
  });
}
