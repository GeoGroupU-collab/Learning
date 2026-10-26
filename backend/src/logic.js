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


// ---------- Rút đề và chấm bài ----------

// Xáo trộn Fisher-Yates. rng trả số trong [0,1); mặc định Math.random.
function xao_(mang, rng) {
  var r = rng || Math.random;
  var a = mang.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(r() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Rút đề cho một người.
// pool: [{id, maMon, soTuan, tacGia, trangThai}]. opts: {email, monChon, soCauMoiMon, soTuan, rng}.
// Mỗi môn: ưu tiên câu active của tuần này; thiếu thì lấy tuần khác cùng môn; thiếu nữa thì môn khác.
// Luôn loại câu của chính người thi và không trùng câu. Trả {ds: [{id, tt}], thieu, canhBao}.
// tt là thứ tự đáp án đã xáo, ví dụ 'CADB': ô hiển thị A là đáp án gốc C.
function rutDe(pool, opts) {
  var email = chuanHoaEmail(opts.email);
  var hopLe = pool.filter(function (c) { return c.trangThai === 'active' && chuanHoaEmail(c.tacGia) !== email; });
  var daLay = {};
  var ds = [];
  var thieu = 0;
  var canhBao = [];
  var lay = function (cacUngVien, can, nhoXong) {
    var chon = xao_(cacUngVien.filter(function (c) { return !daLay[c.id]; }), opts.rng).slice(0, can);
    chon.forEach(function (c) { daLay[c.id] = true; nhoXong.push(c.id); });
    return chon.length;
  };
  opts.monChon.forEach(function (ma) {
    var cua = [];
    var can = opts.soCauMoiMon;
    can -= lay(hopLe.filter(function (c) { return c.maMon === ma && c.soTuan === opts.soTuan; }), can, cua);
    if (can > 0) {
      var them = lay(hopLe.filter(function (c) { return c.maMon === ma; }), can, cua);
      if (them > 0) canhBao.push('Môn ' + ma + ': lấy ' + them + ' câu từ tuần khác vì thiếu câu của tuần này.');
      can -= them;
    }
    if (can > 0) {
      var khac = lay(hopLe, can, cua);
      if (khac > 0) canhBao.push('Môn ' + ma + ': lấy ' + khac + ' câu từ môn khác vì thiếu câu.');
      can -= khac;
    }
    if (can > 0) {
      thieu += can;
      canhBao.push('Môn ' + ma + ': thiếu ' + can + ' câu, đề ngắn hơn.');
    }
    xao_(cua, opts.rng).forEach(function (id) {
      ds.push({ id: id, tt: xao_(['A', 'B', 'C', 'D'], opts.rng).join('') });
    });
  });
  return { ds: ds, thieu: thieu, canhBao: canhBao };
}

// Chấm bài. ds: [{id, tt}], traLoi: {id: 'A'..'D' (ô người thi chọn)}, dapAn: {id: 'A'..'D' (đáp án gốc)}.
function chamBai(ds, traLoi, dapAn) {
  var dung = 0;
  ds.forEach(function (c) {
    var chon = traLoi && traLoi[c.id];
    var idx = 'ABCD'.indexOf(chon);
    if (idx !== -1 && c.tt.charAt(idx) === dapAn[c.id]) dung++;
  });
  return { soDung: dung, soCau: ds.length };
}

function diemCaNhan(soDung, soCau) {
  return soCau > 0 ? Math.round((soDung / soCau) * 1000) / 10 : 0;
}

// ---------- Điểm nhóm và xếp hạng ----------

// thanhVien: [{email, mien, diem (số hoặc null nếu không thi), giay}] gồm các thành viên đang active.
// Điểm nhóm = tổng điểm / (số người - số người miễn). Người vắng tính 0 và vẫn nằm trong mẫu số.
function diemNhomTuan(thanhVien) {
  var tinh = thanhVien.filter(function (t) { return !t.mien; });
  var tham = tinh.filter(function (t) { return t.diem !== null && t.diem !== undefined; });
  var tong = 0;
  tham.forEach(function (t) { tong += t.diem; });
  var giay = 0;
  tham.forEach(function (t) { giay += t.giay || 0; });
  return {
    diem: tinh.length ? Math.round((tong / tinh.length) * 100) / 100 : 0,
    soTinh: tinh.length,
    soThamGia: tham.length,
    tiLeThamGia: tinh.length ? tham.length / tinh.length : 0,
    giayTB: tham.length ? giay / tham.length : 0,
  };
}

// Xếp hạng: điểm cao hơn trên; bằng điểm thì tỉ lệ tham gia cao hơn; vẫn bằng thì thời gian bình quân ngắn hơn.
// Nhóm bằng hoàn toàn ở cả ba tiêu chí thì cùng hạng. Trả mảng đã sắp xếp, thêm trường hang.
function xepHangNhom(nhoms) {
  var ds = nhoms.slice().sort(function (a, b) {
    if (b.diem !== a.diem) return b.diem - a.diem;
    if (b.tiLeThamGia !== a.tiLeThamGia) return b.tiLeThamGia - a.tiLeThamGia;
    return a.giayTB - b.giayTB;
  });
  var kq = [];
  ds.forEach(function (n, i) {
    var truoc = kq[i - 1];
    var hang = i + 1;
    if (truoc && truoc.diem === n.diem && truoc.tiLeThamGia === n.tiLeThamGia && truoc.giayTB === n.giayTB) hang = truoc.hang;
    var o = {};
    Object.keys(n).forEach(function (k) { o[k] = n[k]; });
    o.hang = hang;
    kq.push(o);
  });
  return kq;
}

// Điểm lũy kế = trung bình điểm nhóm các tuần đã chốt.
function diemLuyKe(diemCacTuan) {
  if (!diemCacTuan.length) return 0;
  var tong = 0;
  diemCacTuan.forEach(function (d) { tong += d; });
  return Math.round((tong / diemCacTuan.length) * 100) / 100;
}

if (typeof module !== 'undefined') {
  module.exports = {
    docGpa: docGpa, chiaNhom: chiaNhom, doLechGpa: doLechGpa, chuanHoaEmail: chuanHoaEmail, laLinkHopLe: laLinkHopLe,
    taoLichTuan: taoLichTuan, trangThaiTuan: trangThaiTuan, chonTuanHienTai: chonTuanHienTai, mocKeTiep: mocKeTiep,
    chuanHoaChu: chuanHoaChu, kiemTraBoCauHoi: kiemTraBoCauHoi,
    rutDe: rutDe, chamBai: chamBai, diemCaNhan: diemCaNhan, diemNhomTuan: diemNhomTuan, xepHangNhom: xepHangNhom, diemLuyKe: diemLuyKe,
  };
}
