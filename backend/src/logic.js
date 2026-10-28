// Các hàm thuần (không gọi API của Apps Script) để test bằng Vitest.

// Đọc GPA từ chuỗi người dùng gõ: chấp nhận dấu phẩy. Trả NaN nếu không hợp lệ.
function docGpa(giaTri) {
  var s = String(giaTri == null ? '' : giaTri).trim().replace(',', '.');
  if (s === '') return NaN;
  var n = Number(s);
  return isFinite(n) && n >= 0 && n <= 4 ? n : NaN; // thang 4
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

// ---------- Điểm cá nhân, cấp, danh hiệu ----------

// Các cấp lớn (Gỗ đến Thách Đấu, huy hiệu vẽ trong src/anh-cap.ts, thứ tự phải khớp). Mỗi cấp lớn gồm nhiều level; level = floor(tổng điểm / diemMoiCap) + 1.
// 5 cấp đầu mỗi cấp 5 level, các cấp sau dài hơn. Chủ có thể đổi tên và khoảng level ở đây.
var CAP_LON = [
  { ten: 'Gỗ', tu: 1, den: 5 },
  { ten: 'Sắt', tu: 6, den: 10 },
  { ten: 'Đồng', tu: 11, den: 15 },
  { ten: 'Bạc', tu: 16, den: 20 },
  { ten: 'Vàng', tu: 21, den: 25 },
  { ten: 'Bạch Kim', tu: 26, den: 35 },
  { ten: 'Lục Bảo', tu: 36, den: 45 },
  { ten: 'Kim Cương', tu: 46, den: 55 },
  { ten: 'Cao Thủ', tu: 56, den: 70 },
  { ten: 'Đại Cao Thủ', tu: 71, den: 90 },
  { ten: 'Thách Đấu', tu: 91, den: null },
];

// Từ tổng điểm tính ra level, cấp lớn và tiến độ.
function capTuDiem(tong, diemMoiCap) {
  var moi = diemMoiCap > 0 ? diemMoiCap : 100;
  var diem = Math.max(0, Math.floor(tong || 0));
  var level = Math.floor(diem / moi) + 1;
  var chi = 0;
  for (var i = 0; i < CAP_LON.length; i++) {
    if (level >= CAP_LON[i].tu && (CAP_LON[i].den === null || level <= CAP_LON[i].den)) { chi = i; break; }
  }
  var c = CAP_LON[chi];
  var ke = CAP_LON[chi + 1] || null;
  return {
    tong: diem,
    level: level,
    diemTrongLevel: diem % moi,
    diemMoiLevel: moi,
    tenCapLon: c.ten,
    levelDauCap: c.tu,
    levelCuoiCap: c.den,
    capKe: ke ? ke.ten : null,
    levelConLaiDenCapKe: ke ? ke.tu - level : null,
  };
}

// Số tuần ISO theo giờ Việt Nam, dạng '2026-W45'. Dùng để giới hạn điểm luyện tập mỗi tuần.
function tuanKeVN(ms) {
  var d = new Date(ms + 7 * 3600000);
  var thu = (d.getUTCDay() + 6) % 7;
  var thuNamCuaTuan = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - thu + 3));
  var nam = thuNamCuaTuan.getUTCFullYear();
  var mung4 = new Date(Date.UTC(nam, 0, 4));
  var tuan = 1 + Math.round(((thuNamCuaTuan - mung4) / 86400000 - 3 + ((mung4.getUTCDay() + 6) % 7)) / 7);
  return nam + '-W' + (tuan < 10 ? '0' : '') + tuan;
}

// Điểm thưởng cho một lượt luyện tập: tối đa diemMoi, không vượt trần mỗi tuần.
function diemThuongLuyenTap(daDungTuan, diemMoi, tranTuan) {
  return Math.max(0, Math.min(diemMoi, tranTuan - daDungTuan));
}

// Điểm thưởng nhóm theo hạng, ví dụ [50, 30, 10]: hạng 1 được 50, hạng 2 được 30, còn lại 10.
function diemThuongNhom(hang, bang) {
  if (!bang.length || !(hang >= 1)) return 0;
  return bang[Math.min(hang, bang.length) - 1];
}

// Đọc cấu hình '50,30,10' thành mảng số.
function docBangDiemNhom(chuoi) {
  var kq = String(chuoi == null ? '' : chuoi).split(',').map(function (s) { return Number(s.trim()); }).filter(function (n) { return isFinite(n) && n >= 0; });
  return kq.length ? kq : [50, 30, 10];
}

// Người đạt điểm cao nhất tuần: điểm cao nhất, bằng điểm thì thời gian ngắn nhất; bằng cả hai thì cùng nhận.
function chonDanhHieuCaNhan(luots) {
  if (!luots.length) return [];
  var tot = luots.slice().sort(function (a, b) {
    if (b.diem !== a.diem) return b.diem - a.diem;
    return a.giay - b.giay;
  })[0];
  return luots.filter(function (l) { return l.diem === tot.diem && l.giay === tot.giay; });
}

// Xếp hạng cá nhân theo tổng điểm; bằng điểm thì cùng hạng.
function xepHangCaNhan(ds) {
  var s = ds.slice().sort(function (a, b) { return b.tong - a.tong; });
  var kq = [];
  s.forEach(function (x, i) {
    var o = {};
    Object.keys(x).forEach(function (k) { o[k] = x[k]; });
    o.hang = i > 0 && kq[i - 1].tong === x.tong ? kq[i - 1].hang : i + 1;
    kq.push(o);
  });
  return kq;
}

// Câu khó nhất: tỉ lệ sai cao nhất trong các lượt đã nộp, chỉ xét câu có ít nhất minLuot lượt làm.
function cauKhoNhat(luots, dapAnGoc, minLuot, top) {
  var dem = {};
  luots.forEach(function (l) {
    l.ds.forEach(function (c) {
      var d = dem[c.id] || (dem[c.id] = { id: c.id, soLuot: 0, soSai: 0 });
      d.soLuot++;
      var idx = 'ABCD'.indexOf(l.traLoi && l.traLoi[c.id]);
      if (!(idx !== -1 && c.tt.charAt(idx) === dapAnGoc[c.id])) d.soSai++;
    });
  });
  return Object.keys(dem).map(function (k) {
    dem[k].tyLeSai = dem[k].soSai / dem[k].soLuot;
    return dem[k];
  }).filter(function (d) { return d.soLuot >= minLuot; }).sort(function (a, b) {
    if (b.tyLeSai !== a.tyLeSai) return b.tyLeSai - a.tyLeSai;
    return b.soLuot - a.soLuot;
  }).slice(0, top);
}

// Trạng thái câu hỏi theo số người khác nhau đã báo sai. Câu đã bị xóa giữ nguyên.
function trangThaiTheoBaoSai(soNguoi, nguongTam, nguongXoa, hienTai) {
  if (hienTai === 'removed') return 'removed';
  if (soNguoi >= nguongXoa) return 'removed';
  if (soNguoi >= nguongTam && hienTai === 'active') return 'suspended';
  return hienTai;
}

// ---------- Sửa câu hỏi hàng loạt (nhập bản đã rà soát) ----------

var TRUONG_SUA_ = ['noiDung', 'A', 'B', 'C', 'D', 'dapAn', 'giaiThich', 'trangNguon', 'maChuong', 'trangThai', 'ghiChuDuyet'];

// Kiểm tra một câu sau khi sửa. Trả mảng lỗi (rỗng là hợp lệ).
function kiemTraMotCau(c) {
  var loi = [];
  ['noiDung', 'A', 'B', 'C', 'D'].forEach(function (k) { if (String(c[k] == null ? '' : c[k]).trim() === '') loi.push('thiếu ' + k); });
  if (['A', 'B', 'C', 'D'].indexOf(String(c.dapAn)) === -1) loi.push('đáp án đúng phải là A, B, C hoặc D');
  if (['active', 'suspended', 'removed', 'cho_duyet', 'tu_choi'].indexOf(String(c.trangThai)) === -1) loi.push('trạng thái phải là active, cho_duyet, tu_choi, suspended hoặc removed');
  var k4 = {};
  ['A', 'B', 'C', 'D'].forEach(function (k) { k4[chuanHoaChu(c[k])] = true; });
  if (Object.keys(k4).length < 4) loi.push('bốn đáp án phải khác nhau');
  if (String(c.noiDung || '').length > 600) loi.push('nội dung quá dài');
  return loi;
}

// So sánh câu hiện có với bản mới, chỉ xét các trường cho phép. Trả {} nếu không đổi.
function soSanhCauHoi(cu, moi) {
  var diff = {};
  TRUONG_SUA_.forEach(function (k) {
    if (moi[k] === undefined) return;
    var a = String(cu[k] == null ? '' : cu[k]).trim();
    var b = String(moi[k] == null ? '' : moi[k]).trim();
    if (a !== b) diff[k] = { tu: a, den: b };
  });
  return diff;
}

// ---------- Tạo đề từ ngân hàng ----------

// Dựng đề cố định từ danh sách id: mỗi người nhận cùng bộ câu nhưng thứ tự câu và thứ tự đáp án khác nhau.
function dungDeCoDinh(ids, rng) {
  var ds = xao_(ids, rng).map(function (id) {
    return { id: id, tt: xao_(['A', 'B', 'C', 'D'], rng).join('') };
  });
  return { ds: ds, thieu: 0, canhBao: [] };
}

// Rút câu theo phân bổ. phanBo: [{maMon, chuong: [mã hoặc tên chương], soCau}]. Không rút trùng câu.
// Trả {chon: [id], thieu: [{maMon, can, co}]}.
function rutTheoPhanBo(cacCau, phanBo, rng) {
  var da = {};
  var chon = [];
  var thieu = [];
  phanBo.forEach(function (q) {
    var chuong = (q.chuong || []).map(chuanHoaChu).filter(function (x) { return x !== ''; });
    var set = {};
    chuong.forEach(function (k) { set[k] = true; });
    var ung = cacCau.filter(function (c) {
      return !da[c.id] && c.maMon === q.maMon && (chuong.length === 0 || set[chuanHoaChu(c.maChuong)]);
    });
    var lay = xao_(ung, rng).slice(0, q.soCau);
    lay.forEach(function (c) { da[c.id] = true; chon.push(c.id); });
    if (lay.length < q.soCau) thieu.push({ maMon: q.maMon, can: q.soCau, co: lay.length });
  });
  return { chon: chon, thieu: thieu };
}

// ---------- Gợi ý câu nghi trùng ----------

function tapTu_(s) {
  var o = {};
  var dem = 0;
  String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).forEach(function (x) {
    if (x.length > 1 && !o[x]) { o[x] = true; dem++; }
  });
  return { tu: o, dem: dem };
}

function doGiongTapTu_(a, b) {
  if (!a.dem || !b.dem) return 0;
  var chung = 0;
  Object.keys(a.tu).forEach(function (k) { if (b.tu[k]) chung++; });
  return chung / (a.dem + b.dem - chung);
}

// Độ giống nhau (0 đến 1) của hai đoạn chữ theo tập từ. 1 là giống hệt (sau khi bỏ dấu câu, hoa thường).
function doGiongNhau(a, b) {
  return doGiongTapTu_(tapTu_(a), tapTu_(b));
}

// Tìm các câu nghi trùng nhau trong cùng một môn. cau: [{id, maMon, noiDung}].
// Trả {id: [{id, doGiong}]} chỉ gồm các câu có ít nhất một câu giống từ nguong trở lên, tối đa 3 câu giống nhất.
function timCauNghiTrung(cau, nguong) {
  var theoMon = {};
  cau.forEach(function (c) { (theoMon[c.maMon] = theoMon[c.maMon] || []).push({ id: c.id, t: tapTu_(c.noiDung) }); });
  var kq = {};
  Object.keys(theoMon).forEach(function (m) {
    var ds = theoMon[m];
    for (var i = 0; i < ds.length; i++) {
      for (var j = i + 1; j < ds.length; j++) {
        var g = doGiongTapTu_(ds[i].t, ds[j].t);
        if (g >= nguong) {
          (kq[ds[i].id] = kq[ds[i].id] || []).push({ id: ds[j].id, doGiong: Math.round(g * 100) / 100 });
          (kq[ds[j].id] = kq[ds[j].id] || []).push({ id: ds[i].id, doGiong: Math.round(g * 100) / 100 });
        }
      }
    }
  });
  Object.keys(kq).forEach(function (id) {
    kq[id].sort(function (a, b) { return b.doGiong - a.doGiong; });
    kq[id] = kq[id].slice(0, 3);
  });
  return kq;
}

if (typeof module !== 'undefined') {
  module.exports = {
    docGpa: docGpa, chiaNhom: chiaNhom, doLechGpa: doLechGpa, chuanHoaEmail: chuanHoaEmail, laLinkHopLe: laLinkHopLe,
    taoLichTuan: taoLichTuan, trangThaiTuan: trangThaiTuan, chonTuanHienTai: chonTuanHienTai, mocKeTiep: mocKeTiep,
    chuanHoaChu: chuanHoaChu, kiemTraBoCauHoi: kiemTraBoCauHoi,
    rutDe: rutDe, chamBai: chamBai, diemCaNhan: diemCaNhan, diemNhomTuan: diemNhomTuan, xepHangNhom: xepHangNhom, diemLuyKe: diemLuyKe,
    CAP_LON: CAP_LON, capTuDiem: capTuDiem, tuanKeVN: tuanKeVN, diemThuongLuyenTap: diemThuongLuyenTap, diemThuongNhom: diemThuongNhom,
    docBangDiemNhom: docBangDiemNhom, chonDanhHieuCaNhan: chonDanhHieuCaNhan, xepHangCaNhan: xepHangCaNhan, cauKhoNhat: cauKhoNhat,
    dungDeCoDinh: dungDeCoDinh, doGiongNhau: doGiongNhau, timCauNghiTrung: timCauNghiTrung, rutTheoPhanBo: rutTheoPhanBo, trangThaiTheoBaoSai: trangThaiTheoBaoSai, kiemTraMotCau: kiemTraMotCau, soSanhCauHoi: soSanhCauHoi,
  };
}
