// Sự kiện hàng tuần: lịch tuần, nộp câu hỏi, lưu nháp, xin miễn.

function msCua_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0; // trình duyệt gửi mili giây dạng số
  var t = v instanceof Date ? v.getTime() : Date.parse(v);
  return isNaN(t) ? 0 : t;
}

function docTuan_(maHocKy) {
  return docBang_('Tuan')
    .filter(function (r) { return r.maHocKy === maHocKy; })
    .map(function (r) {
      return {
        soTuan: Number(r.soTuan), hanNop: msCua_(r.hanNopCauHoi), moCua: msCua_(r.moCua), dongCua: msCua_(r.dongCua), _dong: r._dong,
        soMonThi: Number(r.soMonThi) || 0, soCauMoiMonThi: Number(r.soCauMoiMonThi) || 0, thoiGianPhut: Number(r.thoiGianPhut) || 0,
      };
    });
}

function monCuaHocKy_(maHocKy) {
  return docBang_('Mon')
    .filter(function (m) { return m.maHocKy === maHocKy; })
    .map(function (m) {
      var chuong = [];
      try { chuong = JSON.parse(m.danhSachChuong || '[]'); } catch (e) { chuong = []; }
      return { ma: m.maMon, ten: m.tenMon, mau: m.mau, chuong: chuong };
    });
}

function canTuanDangNop_(hk) {
  var t = chonTuanHienTai(docTuan_(hk.maHocKy), Date.now());
  if (!t) throw loi_('chua_co_tuan', 'Chưa có lịch sự kiện.');
  if (trangThaiTuan(t, Date.now()) !== 'nop_cau_hoi') throw loi_('het_han', 'Đã quá hạn nộp câu hỏi của tuần này.');
  return t;
}

function cauHoiCuaEmailTuan_(maHocKy, soTuan, email) {
  return docBang_('CauHoi').filter(function (c) {
    return c.maHocKy === maHocKy && Number(c.soTuan) === soTuan && chuanHoaEmail(c.tacGia) === email && c.trangThai !== 'removed';
  });
}

function mienCuaEmail_(maHocKy, email) {
  return docBang_('Mien').filter(function (m) { return m.maHocKy === maHocKy && chuanHoaEmail(m.email) === email; });
}

// Thông tin tuần hiện tại cho một người dùng.
function hdTuanHienTai_(email) {
  var hk = hocKyDangMo_();
  if (!hk) return { now: Date.now(), tuan: null };
  var cauHinh = layCauHinh_();
  var t = chonTuanHienTai(docTuan_(hk.maHocKy), Date.now());
  var soMon = Number(cauHinh.soMonNopCauHoi) || 3;
  var soCauMoiMon = Number(cauHinh.soCauNopMoiMon) || 5;
  var res = {
    now: Date.now(),
    tuan: null,
    mon: monCuaHocKy_(hk.maHocKy),
    yeuCau: { soMon: soMon, soCauMoiMon: soCauMoiMon },
    soMienToiDa: Number(cauHinh.soTuanMienToiDa) || 0,
  };
  if (!t) return res;
  var mien = mienCuaEmail_(hk.maHocKy, email);
  var daNop = cauHoiCuaEmailTuan_(hk.maHocKy, t.soTuan, email).length;
  res.tuan = {
    soTuan: t.soTuan,
    hanNop: t.hanNop,
    moCua: t.moCua,
    dongCua: t.dongCua,
    trangThai: trangThaiTuan(t, res.now),
    moc: mocKeTiep(t, res.now),
  };
  res.soCauDaNop = daNop;
  res.soCauCanNop = soMon * soCauMoiMon;
  res.moKhoa = daNop >= soMon * soCauMoiMon;
  res.mien = mien.some(function (m) { return Number(m.soTuan) === t.soTuan; });
  res.soMienDaDung = mien.length;
  res.thi = { soMonThi: t.soMonThi || Number(cauHinh.soMonThi) || 2, soCauMoiMonThi: t.soCauMoiMonThi || Number(cauHinh.soCauMoiMonThi) || 20, thoiGianPhut: t.thoiGianPhut || Number(cauHinh.thoiGianPhut) || 40 };
  var luot = luotThiCua_(hk.maHocKy, t.soTuan, email);
  res.luotThi = luot ? tomTatLuot_(luot, res.now, Number(cauHinh.graceGiay) || 30) : null;
  return res;
}

function hdNhapLay_(email) {
  var hk = hocKyDangMo_();
  var t = hk ? chonTuanHienTai(docTuan_(hk.maHocKy), Date.now()) : null;
  if (!t) return { duLieu: null };
  var r = docBang_('NhapCauHoi').filter(function (x) {
    return x.maHocKy === hk.maHocKy && Number(x.soTuan) === t.soTuan && chuanHoaEmail(x.email) === email;
  });
  if (!r.length) return { duLieu: null };
  try { return { duLieu: JSON.parse(r[0].duLieu) }; } catch (e) { return { duLieu: null }; }
}

function hdNhapLuu_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var t = canTuanDangNop_(hk);
  var chuoi = JSON.stringify(body.duLieu || {});
  if (chuoi.length > 45000) throw loi_('qua_lon', 'Bản nháp quá lớn.');
  return voiKhoa_(function () {
    var cu = docBang_('NhapCauHoi').filter(function (x) {
      return x.maHocKy === hk.maHocKy && Number(x.soTuan) === t.soTuan && chuanHoaEmail(x.email) === email;
    });
    if (cu.length) suaDong_('NhapCauHoi', cu[0]._dong, { duLieu: chuoi, capNhat: new Date() });
    else themDong_('NhapCauHoi', { maHocKy: hk.maHocKy, soTuan: t.soTuan, email: email, duLieu: chuoi, capNhat: new Date() });
    return { daLuu: true };
  });
}

function hdNopCauHoi_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cauHinh = layCauHinh_();
  var soMon = Number(cauHinh.soMonNopCauHoi) || 3;
  var soCauMoiMon = Number(cauHinh.soCauNopMoiMon) || 5;
  var ds = body.cauHoi;
  if (!Array.isArray(ds) || ds.length > 100) throw loi_('du_lieu_sai', 'Dữ liệu câu hỏi không hợp lệ.');

  return voiKhoa_(function () {
    var t = canTuanDangNop_(hk);
    if (mienCuaEmail_(hk.maHocKy, email).some(function (m) { return Number(m.soTuan) === t.soTuan; })) {
      throw loi_('da_mien', 'Bạn đang xin miễn tuần này. Hãy hủy xin miễn trước khi nộp câu hỏi.');
    }
    var monHopLe = {};
    var chuongCuaMon = {};
    monCuaHocKy_(hk.maHocKy).forEach(function (m) {
      monHopLe[m.ma] = true;
      chuongCuaMon[m.ma] = m.chuong.map(function (c) { return c.ma; });
    });
    var sach = ds.map(function (c) {
      return {
        maMon: String(c.maMon || ''), maChuong: String(c.maChuong || '').trim(), trangNguon: String(c.trangNguon || '').trim(),
        noiDung: String(c.noiDung || '').trim(), A: String(c.A || '').trim(), B: String(c.B || '').trim(),
        C: String(c.C || '').trim(), D: String(c.D || '').trim(), dapAn: String(c.dapAn || ''), giaiThich: String(c.giaiThich || '').trim(),
      };
    });
    var monSai = sach.filter(function (c) { return !monHopLe[c.maMon]; });
    if (monSai.length) throw loi_('mon_sai', 'Có câu thuộc môn không tồn tại trong học kỳ.');

    // Ngân hàng đã có (trừ câu của chính mình trong tuần này, vì sẽ được thay thế).
    var daCo = {};
    docBang_('CauHoi').forEach(function (c) {
      if (c.maHocKy !== hk.maHocKy || c.trangThai === 'removed') return;
      if (Number(c.soTuan) === t.soTuan && chuanHoaEmail(c.tacGia) === email) return;
      daCo[chuanHoaChu(c.noiDung)] = true;
    });
    var kq = kiemTraBoCauHoi(sach, { soMon: soMon, soCauMoiMon: soCauMoiMon, daCo: daCo, chuongCuaMon: chuongCuaMon });
    if (!kq.ok) throw loi_('cau_hoi_sai', kq.loi.join('\n'));

    xoaDongNeu_('CauHoi', function (c) {
      return c.maHocKy === hk.maHocKy && Number(c.soTuan) === t.soTuan && chuanHoaEmail(c.tacGia) === email;
    });
    var bayGio = new Date();
    sach.forEach(function (c) {
      themDong_('CauHoi', {
        id: Utilities.getUuid(), maHocKy: hk.maHocKy, soTuan: t.soTuan, maMon: c.maMon, maChuong: c.maChuong, trangNguon: c.trangNguon,
        noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich,
        tacGia: email, trangThai: 'active', ngayNop: bayGio,
      });
    });
    xoaDongNeu_('NhapCauHoi', function (x) {
      return x.maHocKy === hk.maHocKy && Number(x.soTuan) === t.soTuan && chuanHoaEmail(x.email) === email;
    });
    ghiNhatKy_(email, 'nopCauHoi', hk.maHocKy + '/' + t.soTuan, { soCau: sach.length });
    return { soCau: sach.length, moKhoa: true };
  });
}

function hdXinMien_(email) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var soMienToiDa = Number(layCauHinh_().soTuanMienToiDa) || 0;
  return voiKhoa_(function () {
    var t = canTuanDangNop_(hk);
    var mien = mienCuaEmail_(hk.maHocKy, email);
    if (mien.some(function (m) { return Number(m.soTuan) === t.soTuan; })) throw loi_('da_mien', 'Bạn đã xin miễn tuần này.');
    if (mien.length >= soMienToiDa) throw loi_('het_luot', 'Bạn đã dùng hết số tuần được miễn.');
    if (cauHoiCuaEmailTuan_(hk.maHocKy, t.soTuan, email).length) throw loi_('da_nop', 'Bạn đã nộp câu hỏi tuần này nên không xin miễn được.');
    themDong_('Mien', { maHocKy: hk.maHocKy, soTuan: t.soTuan, email: email, lyDo: '', thoiGian: new Date() });
    ghiNhatKy_(email, 'xinMien', hk.maHocKy + '/' + t.soTuan, '');
    return { mien: true };
  });
}

function hdHuyMien_(email) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  return voiKhoa_(function () {
    var t = canTuanDangNop_(hk);
    var n = xoaDongNeu_('Mien', function (m) {
      return m.maHocKy === hk.maHocKy && Number(m.soTuan) === t.soTuan && chuanHoaEmail(m.email) === email;
    });
    if (n) ghiNhatKy_(email, 'huyMien', hk.maHocKy + '/' + t.soTuan, '');
    return { mien: false };
  });
}

// Câu hỏi của chính người dùng, kèm số người đã báo sai (không lộ ai báo).
function hdCauHoiCuaToi_(email) {
  var baoSai = {};
  docBang_('BaoSai').forEach(function (b) {
    baoSai[b.idCauHoi] = baoSai[b.idCauHoi] || {};
    baoSai[b.idCauHoi][chuanHoaEmail(b.email)] = true;
  });
  var tenMon = {};
  docBang_('Mon').forEach(function (m) { tenMon[m.maHocKy + '/' + m.maMon] = m.tenMon; });
  return docBang_('CauHoi')
    .filter(function (c) { return chuanHoaEmail(c.tacGia) === email && c.trangThai !== 'removed'; })
    .map(function (c) {
      return {
        id: c.id, soTuan: Number(c.soTuan), tenMon: tenMon[c.maHocKy + '/' + c.maMon] || c.maMon, maChuong: c.maChuong, noiDung: c.noiDung,
        A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, trangNguon: c.trangNguon, giaiThich: c.giaiThich, trangThai: c.trangThai,
        soBaoSai: baoSai[c.id] ? Object.keys(baoSai[c.id]).length : 0,
      };
    });
}

// ---------- Quản trị lịch tuần ----------

function hdDsTuan_() {
  var hk = hocKyDangMo_();
  if (!hk) return { maHocKy: null, tuan: [] };
  return { maHocKy: hk.maHocKy, tuan: docTuan_(hk.maHocKy).sort(function (a, b) { return a.soTuan - b.soTuan; }).map(function (t) {
    return { soTuan: t.soTuan, hanNop: t.hanNop, moCua: t.moCua, dongCua: t.dongCua, trangThai: trangThaiTuan(t, Date.now()) };
  }) };
}

function hdTaoLichTuan_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var soTuan = Number(body.soTuan);
  if (!(soTuan >= 1 && soTuan <= 30)) throw loi_('so_tuan_sai', 'Số tuần từ 1 đến 30.');
  var lich = taoLichTuan(String(body.thuBayDau || ''), soTuan);
  if (!lich.length) throw loi_('ngay_sai', 'Ngày Thứ Bảy đầu tiên không hợp lệ (dạng 2026-11-07).');
  var cauHinh = layCauHinh_();
  return voiKhoa_(function () {
    xoaDongNeu_('Tuan', function (r) { return r.maHocKy === hk.maHocKy; });
    lich.forEach(function (t) {
      themDong_('Tuan', {
        maHocKy: hk.maHocKy, soTuan: t.soTuan, hanNopCauHoi: new Date(t.hanNop), moCua: new Date(t.moCua), dongCua: new Date(t.dongCua),
        soMonThi: cauHinh.soMonThi, soCauMoiMonThi: cauHinh.soCauMoiMonThi, thoiGianPhut: cauHinh.thoiGianPhut, trangThai: 'tu_dong',
      });
    });
    ghiNhatKy_(email, 'taoLichTuan', hk.maHocKy, { thuBayDau: body.thuBayDau, soTuan: soTuan });
    return { soTuan: lich.length };
  });
}

function hdSuaTuan_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var hanNop = msCua_(body.hanNop);
  var moCua = msCua_(body.moCua);
  var dongCua = msCua_(body.dongCua);
  if (!hanNop || !moCua || !dongCua) throw loi_('gio_sai', 'Thời gian không hợp lệ.');
  if (!(hanNop <= moCua && moCua < dongCua)) throw loi_('gio_sai', 'Thứ tự phải là: hạn nộp, mở cửa, đóng cửa.');
  return voiKhoa_(function () {
    var t = docTuan_(hk.maHocKy).filter(function (x) { return x.soTuan === Number(body.soTuan); })[0];
    if (!t) throw loi_('khong_thay', 'Không tìm thấy tuần.');
    suaDong_('Tuan', t._dong, { hanNopCauHoi: new Date(hanNop), moCua: new Date(moCua), dongCua: new Date(dongCua) });
    ghiNhatKy_(email, 'suaTuan', hk.maHocKy + '/' + t.soTuan, { hanNop: hanNop, moCua: moCua, dongCua: dongCua });
    return { soTuan: t.soTuan };
  });
}
