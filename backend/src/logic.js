// Các hàm thuần (không gọi API của Apps Script) để test bằng Vitest.

// Đọc GPA từ chuỗi người dùng gõ: chấp nhận dấu phẩy. Trả NaN nếu không hợp lệ.
function docGpa(giaTri) {
  var s = String(giaTri == null ? '' : giaTri).trim().replace(',', '.');
  if (s === '') return NaN;
  var n = Number(s);
  return isFinite(n) && n >= 0 && n <= 10 ? n : NaN;
}

function trungBinhGpa_(nhom) {
  if (nhom.length === 0) return 0;
  var tong = 0;
  nhom.forEach(function (p) { tong += p.gpa; });
  return tong / nhom.length;
}

// Chia nhóm kiểu rắn.
// danhSach: [{email, gpa, thuTu}]. Trả về mảng nhóm, mỗi nhóm là mảng người.
// Số nhóm = phần nguyên của (n / kichThuoc), tối thiểu 1.
// Người dư được thêm lần lượt vào nhóm có GPA trung bình thấp nhất trong các nhóm đang ít người nhất.
function chiaNhom(danhSach, kichThuoc) {
  var n = danhSach.length;
  if (n === 0) return [];
  var soNhom = Math.max(1, Math.floor(n / kichThuoc));
  var daSapXep = danhSach.slice().sort(function (a, b) {
    if (b.gpa !== a.gpa) return b.gpa - a.gpa;
    return (a.thuTu || 0) - (b.thuTu || 0);
  });

  var nhoms = [];
  for (var i = 0; i < soNhom; i++) nhoms.push([]);

  var soChinh = Math.min(n, soNhom * kichThuoc);
  for (var k = 0; k < soChinh; k++) {
    var vong = Math.floor(k / soNhom);
    var viTri = k % soNhom;
    var idx = vong % 2 === 0 ? viTri : soNhom - 1 - viTri;
    nhoms[idx].push(daSapXep[k]);
  }

  for (var j = soChinh; j < n; j++) {
    var nhoNhat = Math.min.apply(null, nhoms.map(function (g) { return g.length; }));
    var chon = -1;
    var gpaChon = Infinity;
    nhoms.forEach(function (g, vi) {
      if (g.length !== nhoNhat) return;
      var tb = trungBinhGpa_(g);
      if (tb < gpaChon) { gpaChon = tb; chon = vi; }
    });
    nhoms[chon].push(daSapXep[j]);
  }
  return nhoms;
}

// Độ lệch giữa GPA trung bình cao nhất và thấp nhất của các nhóm (dùng để kiểm tra cân bằng).
function doLechGpa(nhoms) {
  if (nhoms.length === 0) return 0;
  var tbs = nhoms.map(trungBinhGpa_);
  return Math.max.apply(null, tbs) - Math.min.apply(null, tbs);
}

// Chuẩn hóa email để so sánh.
function chuanHoaEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Chỉ nhận link bắt đầu bằng https://
function laLinkHopLe(link) {
  return /^https:\/\/[^\s<>"']+$/.test(String(link || '').trim());
}

// ---------- Lịch tuần ----------

// Sinh lịch cho soTuan tuần liên tiếp. thuBayDau dạng 'YYYY-MM-DD' (giờ Việt Nam, UTC+7).
// Hạn nộp 23:59:59 Thứ Sáu, mở cửa 00:00 Thứ Bảy, đóng cửa 23:59:59 Chủ nhật. Trả về số mili giây.
function taoLichTuan(thuBayDau, soTuan) {
  var goc = Date.parse(thuBayDau + 'T00:00:00+07:00');
  if (isNaN(goc)) return [];
  var kq = [];
  for (var i = 0; i < soTuan; i++) {
    var thuBay = goc + i * 7 * 86400000;
    kq.push({ soTuan: i + 1, hanNop: thuBay - 1000, moCua: thuBay, dongCua: thuBay + 2 * 86400000 - 1000 });
  }
  return kq;
}

// Trạng thái theo thời gian: nop_cau_hoi, cho_mo_cua, mo, dong.
function trangThaiTuan(t, now) {
  if (now <= t.hanNop) return 'nop_cau_hoi';
  if (now < t.moCua) return 'cho_mo_cua';
  if (now <= t.dongCua) return 'mo';
  return 'dong';
}

// Tuần hiện tại: tuần đầu tiên chưa đóng cửa. Hết tuần thì trả tuần cuối. Không có tuần thì null.
function chonTuanHienTai(cacTuan, now) {
  if (!cacTuan.length) return null;
  var ds = cacTuan.slice().sort(function (a, b) { return a.soTuan - b.soTuan; });
  for (var i = 0; i < ds.length; i++) if (now <= ds[i].dongCua) return ds[i];
  return ds[ds.length - 1];
}

// Mốc kế tiếp để đếm ngược. Trả {nhan, luc} hoặc null khi đã đóng cửa.
function mocKeTiep(t, now) {
  var tt = trangThaiTuan(t, now);
  if (tt === 'nop_cau_hoi') return { nhan: 'Hạn nộp câu hỏi', luc: t.hanNop };
  if (tt === 'cho_mo_cua') return { nhan: 'Phòng thi mở cửa', luc: t.moCua };
  if (tt === 'mo') return { nhan: 'Phòng thi đóng cửa', luc: t.dongCua };
  return null;
}

// ---------- Kiểm tra bộ câu hỏi nộp ----------

// So sánh nội dung: bỏ khoảng trắng và dấu câu, không phân biệt hoa thường.
function chuanHoaChu(s) {
  return String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/[\s.,;:!?"'“”‘’()\[\]{}\-–—_\/\\]+/g, '');
}

var GIOI_HAN_CHU_ = { noiDung: 600, dapAn: 300, giaiThich: 500, trangNguon: 60, maChuong: 80 };

// dsCau: [{maMon, maChuong, trangNguon, noiDung, A, B, C, D, dapAn, giaiThich}].
// opts: {soMon, soCauMoiMon, daCo: {chuanHoa: true}, chuongCuaMon: {maMon: [maChuong,...]}}.
// Trả {ok, loi: [chuỗi]}. Câu đánh số theo thứ tự trong dsCau, bắt đầu từ 1.
function kiemTraBoCauHoi(dsCau, opts) {
  var loi = [];
  var theoMon = {};
  dsCau.forEach(function (c) {
    var ma = String(c.maMon || '');
    theoMon[ma] = (theoMon[ma] || 0) + 1;
  });
  var cacMon = Object.keys(theoMon);
  if (cacMon.length !== opts.soMon || cacMon.indexOf('') !== -1) {
    loi.push('Cần chọn đúng ' + opts.soMon + ' môn.');
  }
  cacMon.forEach(function (ma) {
    if (ma !== '' && theoMon[ma] !== opts.soCauMoiMon) loi.push('Môn ' + ma + ' cần đúng ' + opts.soCauMoiMon + ' câu (đang có ' + theoMon[ma] + ').');
  });

  var daThay = {};
  var daCo = opts.daCo || {};
  dsCau.forEach(function (c, i) {
    var nhan = 'Câu ' + (i + 1) + ': ';
    var truong = function (ten, ten2, gioiHan) {
      var v = String(c[ten] == null ? '' : c[ten]).trim();
      if (v === '') loi.push(nhan + 'thiếu ' + ten2 + '.');
      else if (v.length > gioiHan) loi.push(nhan + ten2 + ' quá dài.');
      return v;
    };
    var nd = truong('noiDung', 'nội dung câu hỏi', GIOI_HAN_CHU_.noiDung);
    var dapAn = ['A', 'B', 'C', 'D'].map(function (k) { return truong(k, 'đáp án ' + k, GIOI_HAN_CHU_.dapAn); });
    truong('trangNguon', 'trang hoặc slide nguồn', GIOI_HAN_CHU_.trangNguon);
    if (['A', 'B', 'C', 'D'].indexOf(String(c.dapAn)) === -1) loi.push(nhan + 'chưa chọn đáp án đúng.');
    if (String(c.giaiThich || '').length > GIOI_HAN_CHU_.giaiThich) loi.push(nhan + 'giải thích quá dài.');
    var chuong = opts.chuongCuaMon && opts.chuongCuaMon[c.maMon];
    if (chuong && chuong.length && chuong.indexOf(String(c.maChuong || '')) === -1) loi.push(nhan + 'chưa chọn chương.');
    var khacNhau = {};
    dapAn.forEach(function (d) { khacNhau[chuanHoaChu(d)] = true; });
    if (dapAn.every(function (d) { return d !== ''; }) && Object.keys(khacNhau).length < 4) loi.push(nhan + 'bốn đáp án phải khác nhau.');
    var khoa = chuanHoaChu(nd);
    if (khoa !== '') {
      if (daThay[khoa] !== undefined) loi.push(nhan + 'trùng với câu ' + (daThay[khoa] + 1) + ' trong bộ của bạn.');
      else if (daCo[khoa]) loi.push(nhan + 'đã có trong ngân hàng câu hỏi, hãy viết câu khác.');
      daThay[khoa] = i;
    }
  });
  return { ok: loi.length === 0, loi: loi };
}

if (typeof module !== 'undefined') {
  module.exports = {
    docGpa: docGpa, chiaNhom: chiaNhom, doLechGpa: doLechGpa, chuanHoaEmail: chuanHoaEmail, laLinkHopLe: laLinkHopLe,
    taoLichTuan: taoLichTuan, trangThaiTuan: trangThaiTuan, chonTuanHienTai: chonTuanHienTai, mocKeTiep: mocKeTiep,
    chuanHoaChu: chuanHoaChu, kiemTraBoCauHoi: kiemTraBoCauHoi,
  };
}
