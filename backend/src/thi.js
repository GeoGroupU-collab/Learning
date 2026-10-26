// Phòng thi: bắt đầu, tự lưu, nộp bài, chấm, chốt tuần, bảng xếp hạng.

function graceGiay_(cauHinh) {
  var g = Number(cauHinh.graceGiay);
  return isNaN(g) ? 30 : g;
}

function luotThiCua_(maHocKy, soTuan, email) {
  var ds = docBang_('LuotThi').filter(function (r) {
    return r.maHocKy === maHocKy && Number(r.soTuan) === soTuan && chuanHoaEmail(r.email) === email;
  });
  return ds.length ? ds[0] : null;
}

function jsonAnToan_(chuoi, macDinh) {
  try { return JSON.parse(chuoi); } catch (e) { return macDinh; }
}

function daNopLuot_(luot) {
  return luot.nopLuc !== '' && luot.nopLuc !== null && luot.nopLuc !== undefined;
}

// Tóm tắt lượt thi cho trang Sự kiện (không có nội dung đề).
function tomTatLuot_(luot, bayGio, grace) {
  var hetHan = msCua_(luot.hetHanLuc);
  if (daNopLuot_(luot)) return { trangThai: 'da_nop', soDung: Number(luot.soDung), soCau: Number(luot.soCau), diem: Number(luot.diem), giayLam: Number(luot.giayLam) };
  if (bayGio <= hetHan + grace * 1000) return { trangThai: 'dang_lam', hetHanLuc: hetHan };
  return { trangThai: 'het_gio' };
}

// Tìm lượt thi theo mã phiên thi. Dùng cache số dòng để khỏi đọc cả tab khi hàng chục người tự lưu cùng lúc.
function timLuotTheoPhien_(maPhien) {
  if (!maPhien || String(maPhien).length < 16) throw loi_('phien_thi_sai', 'Mã phiên thi không hợp lệ.');
  var cache = CacheService.getScriptCache();
  var dong = Number(cache.get('pt_' + maPhien));
  if (dong >= 2) {
    var r = docMotDong_('LuotThi', dong);
    if (r.maPhien === maPhien) return r;
  }
  var ds = docBang_('LuotThi').filter(function (x) { return x.maPhien === maPhien; });
  if (!ds.length) throw loi_('phien_thi_sai', 'Không tìm thấy lượt thi.');
  cache.put('pt_' + maPhien, String(ds[0]._dong), 6 * 3600);
  return ds[0];
}

function emailTuPhienThi_(maPhien) {
  return chuanHoaEmail(timLuotTheoPhien_(maPhien).email);
}

function cauHoiTheoId_(maHocKy) {
  var map = {};
  docBang_('CauHoi').forEach(function (c) { if (c.maHocKy === maHocKy) map[c.id] = c; });
  return map;
}

// Dựng đề gửi xuống trình duyệt: không có đáp án đúng. Thứ tự đáp án theo tt đã xáo.
function dungDeGui_(luot, cauTheoId) {
  var dl = jsonAnToan_(luot.dsCau, { ds: [] });
  return dl.ds.map(function (c) {
    var g = cauTheoId[c.id] || {};
    return {
      id: c.id,
      maMon: g.maMon,
      noiDung: g.noiDung,
      dapAn: ['A', 'B', 'C', 'D'].map(function (k, i) { return { k: k, text: g[c.tt.charAt(i)] }; }),
    };
  });
}

function chamVaGhi_(luot, traLoi, nopMs) {
  var dl = jsonAnToan_(luot.dsCau, { ds: [] });
  var cauTheoId = cauHoiTheoId_(luot.maHocKy);
  var dapAn = {};
  dl.ds.forEach(function (c) { dapAn[c.id] = cauTheoId[c.id] ? cauTheoId[c.id].dapAn : ''; });
  var kq = chamBai(dl.ds, traLoi, dapAn);
  var batDau = msCua_(luot.batDauLuc);
  var hetHan = msCua_(luot.hetHanLuc);
  var giay = Math.max(0, Math.round((Math.min(nopMs, hetHan) - batDau) / 1000));
  suaDong_('LuotThi', luot._dong, {
    nopLuc: new Date(nopMs), traLoi: JSON.stringify(traLoi || {}), soDung: kq.soDung, soCau: kq.soCau,
    diem: diemCaNhan(kq.soDung, kq.soCau), giayLam: giay,
  });
  return { trangThai: 'da_nop', soDung: kq.soDung, soCau: kq.soCau, diem: diemCaNhan(kq.soDung, kq.soCau), giayLam: giay };
}

function lamSachTraLoi_(traLoi, ds) {
  var hopLe = {};
  ds.forEach(function (c) { hopLe[c.id] = true; });
  var kq = {};
  Object.keys(traLoi || {}).forEach(function (id) {
    if (hopLe[id] && 'ABCD'.indexOf(traLoi[id]) !== -1 && traLoi[id].length === 1) kq[id] = traLoi[id];
  });
  return kq;
}

// ---------- Bắt đầu thi (idempotent) ----------

function hdBatDauThi_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cauHinh = layCauHinh_();
  var grace = graceGiay_(cauHinh);
  var t = chonTuanHienTai(docTuan_(hk.maHocKy), Date.now());
  if (!t) throw loi_('chua_co_tuan', 'Chưa có lịch sự kiện.');

  var traVe = function (luot) {
    var bayGio = Date.now();
    if (daNopLuot_(luot)) return tomTatLuot_(luot, bayGio, grace);
    if (bayGio > msCua_(luot.hetHanLuc) + grace * 1000) {
      // Hết giờ mà chưa nộp: chấm theo bản tự lưu cuối cùng.
      return voiKhoa_(function () {
        var moi = docMotDong_('LuotThi', luot._dong);
        if (daNopLuot_(moi)) return tomTatLuot_(moi, Date.now(), grace);
        return chamVaGhi_(moi, jsonAnToan_(moi.traLoi, {}), msCua_(moi.hetHanLuc));
      });
    }
    return {
      trangThai: 'dang_lam', maPhienThi: luot.maPhien, hetHanLuc: msCua_(luot.hetHanLuc), now: bayGio,
      cauHoi: dungDeGui_(luot, cauHoiTheoId_(hk.maHocKy)), traLoi: jsonAnToan_(luot.traLoi, {}),
    };
  };

  var cu = luotThiCua_(hk.maHocKy, t.soTuan, email);
  if (cu) return traVe(cu);

  var bayGio = Date.now();
  if (trangThaiTuan(t, bayGio) !== 'mo') throw loi_('chua_mo', 'Phòng thi hiện không mở.');
  if (mienCuaEmail_(hk.maHocKy, email).some(function (m) { return Number(m.soTuan) === t.soTuan; })) throw loi_('da_mien', 'Bạn được miễn tuần này.');
  var soMon = t.soMonThi || Number(cauHinh.soMonThi) || 2;
  var soCauMoiMon = t.soCauMoiMonThi || Number(cauHinh.soCauMoiMonThi) || 20;
  var soPhut = t.thoiGianPhut || Number(cauHinh.thoiGianPhut) || 40;
  var yeuCauNop = (Number(cauHinh.soMonNopCauHoi) || 3) * (Number(cauHinh.soCauNopMoiMon) || 5);
  if (cauHoiCuaEmailTuan_(hk.maHocKy, t.soTuan, email).length < yeuCauNop) throw loi_('chua_nop_cau', 'Bạn chưa nộp đủ câu hỏi nên chưa được thi tuần này.');

  var monChon;
  var de;
  if (t.idDe) {
    // Tuần có đề cố định do chủ chọn: mọi người cùng bộ câu, chỉ khác thứ tự câu và thứ tự đáp án.
    var deCD = docBang_('DeThi').filter(function (d) { return d.idDe === t.idDe; })[0];
    if (!deCD) throw loi_('khong_du_cau', 'Đề cố định của tuần này không tồn tại. Báo lớp trưởng.');
    var cauCD = cauHoiTheoId_(hk.maHocKy);
    var idHopLe = jsonAnToan_(deCD.dsIdCau, []).filter(function (id) { return cauCD[id] && cauCD[id].trangThai !== 'removed'; });
    if (!idHopLe.length) throw loi_('khong_du_cau', 'Đề cố định không còn câu hợp lệ. Báo lớp trưởng.');
    de = dungDeCoDinh(idHopLe);
    var monDe = {};
    idHopLe.forEach(function (id) { monDe[cauCD[id].maMon] = true; });
    monChon = Object.keys(monDe);
  } else {
    monChon = Array.isArray(body.monChon) ? body.monChon.map(String) : [];
    var monCuaKy = monCuaHocKy_(hk.maHocKy).map(function (m) { return m.ma; });
    var khacNhau = {};
    monChon.forEach(function (m) { khacNhau[m] = true; });
    if (monChon.length !== soMon || Object.keys(khacNhau).length !== soMon || monChon.some(function (m) { return monCuaKy.indexOf(m) === -1; })) {
      throw loi_('mon_sai', 'Hãy chọn đúng ' + soMon + ' môn khác nhau.');
    }
    // Rút đề ngoài khóa để nhiều người bắt đầu cùng lúc không chờ nhau lâu.
    var pool = docBang_('CauHoi')
      .filter(function (c) { return c.maHocKy === hk.maHocKy; })
      .map(function (c) { return { id: c.id, maMon: c.maMon, soTuan: Number(c.soTuan), tacGia: c.tacGia, trangThai: c.trangThai }; });
    de = rutDe(pool, { email: email, monChon: monChon, soCauMoiMon: soCauMoiMon, soTuan: t.soTuan });
    if (de.ds.length === 0) throw loi_('khong_du_cau', 'Chưa có đủ câu hỏi để ra đề. Báo lớp trưởng.');
  }

  return voiKhoa_(function () {
    var daCo = luotThiCua_(hk.maHocKy, t.soTuan, email);
    if (daCo) return traVe(daCo);
    var batDau = Date.now();
    var maPhien = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    themDong_('LuotThi', {
      maHocKy: hk.maHocKy, soTuan: t.soTuan, email: email, maPhien: maPhien,
      batDauLuc: new Date(batDau), hetHanLuc: new Date(batDau + soPhut * 60000),
      dsCau: JSON.stringify({ ds: de.ds, monChon: monChon }), traLoi: '{}',
    });
    if (de.canhBao.length) ghiNhatKy_(email, 'canhBaoRutDe', hk.maHocKy + '/' + t.soTuan, de.canhBao);
    ghiNhatKy_(email, 'batDauThi', hk.maHocKy + '/' + t.soTuan, { soCau: de.ds.length });
    var luot = luotThiCua_(hk.maHocKy, t.soTuan, email);
    return traVe(luot);
  });
}

// ---------- Tự lưu và nộp (dùng mã phiên thi, không cần token mới) ----------

function hdThiLuu_(email, tv, body) {
  var luot = timLuotTheoPhien_(body.maPhienThi);
  var grace = graceGiay_(layCauHinh_());
  if (daNopLuot_(luot)) throw loi_('da_nop', 'Bài đã được nộp.');
  if (Date.now() > msCua_(luot.hetHanLuc) + grace * 1000) throw loi_('het_gio', 'Đã hết giờ.');
  var dl = jsonAnToan_(luot.dsCau, { ds: [] });
  var traLoi = lamSachTraLoi_(body.traLoi, dl.ds);
  suaDong_('LuotThi', luot._dong, { traLoi: JSON.stringify(traLoi) });
  return { daLuu: true, soDaTraLoi: Object.keys(traLoi).length };
}

function hdThiNop_(email, tv, body) {
  var luot = timLuotTheoPhien_(body.maPhienThi);
  var grace = graceGiay_(layCauHinh_());
  return voiKhoa_(function () {
    var moi = docMotDong_('LuotThi', luot._dong);
    if (daNopLuot_(moi)) return tomTatLuot_(moi, Date.now(), grace);
    var bayGio = Date.now();
    var dl = jsonAnToan_(moi.dsCau, { ds: [] });
    if (bayGio > msCua_(moi.hetHanLuc) + grace * 1000) {
      return chamVaGhi_(moi, jsonAnToan_(moi.traLoi, {}), msCua_(moi.hetHanLuc));
    }
    var traLoi = lamSachTraLoi_(body.traLoi, dl.ds);
    var daLuu = jsonAnToan_(moi.traLoi, {});
    Object.keys(daLuu).forEach(function (id) { if (traLoi[id] === undefined) traLoi[id] = daLuu[id]; });
    var kq = chamVaGhi_(moi, traLoi, bayGio);
    ghiNhatKy_(email, 'nopBai', moi.maHocKy + '/' + moi.soTuan, { soDung: kq.soDung, soCau: kq.soCau });
    return kq;
  });
}

// ---------- Điểm nhóm, chốt tuần ----------

// Bảng điểm nhóm của một tuần, tính từ các lượt thi đã nộp.
function tinhBangTuan_(maHocKy, soTuan) {
  var nhoms = docBang_('Nhom').filter(function (n) { return n.maHocKy === maHocKy; });
  var lienKet = docBang_('NhomThanhVien').filter(function (r) { return r.maHocKy === maHocKy; });
  var active = {};
  docBang_('ThanhVien').forEach(function (t) { if (t.trangThai === 'active') active[chuanHoaEmail(t.email)] = true; });
  var luot = {};
  docBang_('LuotThi').forEach(function (r) {
    if (r.maHocKy === maHocKy && Number(r.soTuan) === soTuan) luot[chuanHoaEmail(r.email)] = r;
  });
  var mien = {};
  docBang_('Mien').forEach(function (m) {
    if (m.maHocKy === maHocKy && Number(m.soTuan) === soTuan) mien[chuanHoaEmail(m.email)] = true;
  });
  var kq = nhoms.map(function (n) {
    var ds = lienKet
      .filter(function (r) { return r.maNhom === n.maNhom && active[chuanHoaEmail(r.email)]; })
      .map(function (r) {
        var e = chuanHoaEmail(r.email);
        var l = luot[e];
        var nop = l && daNopLuot_(l);
        return { email: e, mien: !!mien[e], diem: nop ? Number(l.diem) : null, giay: nop ? Number(l.giayLam) : null };
      });
    var d = diemNhomTuan(ds);
    return {
      maNhom: n.maNhom, tenNhom: n.tenNhom, diem: d.diem, soTinh: d.soTinh, soThamGia: d.soThamGia,
      tiLeThamGia: d.tiLeThamGia, giayTB: d.giayTB, tongGiay: Math.round(d.giayTB * d.soThamGia),
    };
  });
  return xepHangNhom(kq);
}

function tuanDaChot_(maHocKy, soTuan) {
  return docBang_('KetQuaTuan').some(function (r) { return r.maHocKy === maHocKy && Number(r.soTuan) === soTuan; });
}

// Chấm nốt các lượt thi đã hết hạn mà chưa nộp, rồi chốt kết quả nhóm. Trả true nếu đã chốt.
function chotMotTuan_(hk, t, grace) {
  var bayGio = Date.now();
  if (bayGio <= t.dongCua) return false;
  var chuaXong = false;
  docBang_('LuotThi').forEach(function (l) {
    if (l.maHocKy !== hk.maHocKy || Number(l.soTuan) !== t.soTuan || daNopLuot_(l)) return;
    if (bayGio > msCua_(l.hetHanLuc) + grace * 1000) chamVaGhi_(l, jsonAnToan_(l.traLoi, {}), msCua_(l.hetHanLuc));
    else chuaXong = true;
  });
  if (chuaXong) return false;
  var bang = tinhBangTuan_(hk.maHocKy, t.soTuan);
  xoaDongNeu_('KetQuaTuan', function (r) { return r.maHocKy === hk.maHocKy && Number(r.soTuan) === t.soTuan; });
  bang.forEach(function (n) {
    themDong_('KetQuaTuan', {
      maHocKy: hk.maHocKy, soTuan: t.soTuan, maNhom: n.maNhom, diemNhom: n.diem, soThanhVienTinh: n.soTinh,
      soThamGia: n.soThamGia, tongGiayLam: n.tongGiay, hang: n.hang,
    });
  });
  traoThuongTuan_(hk, t, bang);
  suaDong_('Tuan', t._dong, { trangThai: 'da_chot' });
  ghiNhatKy_('he_thong', 'chotTuan', hk.maHocKy + '/' + t.soTuan, { soNhom: bang.length });
  CacheService.getScriptCache().remove('xh_' + hk.maHocKy);
  return true;
}

// Chạy mỗi 15 phút bằng trigger (xem datTrigger).
function chotTuanTuDong() {
  datLaiBoNho_();
  var hk = hocKyDangMo_();
  if (!hk) return;
  var grace = graceGiay_(layCauHinh_());
  voiKhoa_(function () {
    docTuan_(hk.maHocKy).forEach(function (t) {
      if (!tuanDaChot_(hk.maHocKy, t.soTuan)) chotMotTuan_(hk, t, grace);
    });
    donPhienHetHan_();
  });
}

// Chạy một lần để đặt trigger 15 phút. Chạy lại không tạo trigger trùng.
function datTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (tg) {
    if (tg.getHandlerFunction() === 'chotTuanTuDong') ScriptApp.deleteTrigger(tg);
  });
  ScriptApp.newTrigger('chotTuanTuDong').timeBased().everyMinutes(15).create();
  Logger.log('Đã đặt trigger chotTuanTuDong chạy mỗi 15 phút.');
}

function hdChotTuanThuCong_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var soTuan = Number(body.soTuan);
  var grace = graceGiay_(layCauHinh_());
  return voiKhoa_(function () {
    var t = docTuan_(hk.maHocKy).filter(function (x) { return x.soTuan === soTuan; })[0];
    if (!t) throw loi_('khong_thay', 'Không tìm thấy tuần.');
    if (Date.now() <= t.dongCua) throw loi_('chua_dong', 'Tuần này chưa đóng cửa.');
    var xong = chotMotTuan_(hk, t, grace);
    if (!xong) throw loi_('con_dang_thi', 'Vẫn còn người đang làm bài, thử lại sau.');
    ghiNhatKy_(email, 'chotTuanThuCong', hk.maHocKy + '/' + soTuan, '');
    return { daChot: true };
  });
}

// ---------- Bảng xếp hạng ----------

function hdXepHang_(email) {
  var hk = hocKyDangMo_();
  if (!hk) return { tuanHienTai: null, cacTuan: [], luyKe: [], vinhDanh: null, nhomToi: null };
  var cache = CacheService.getScriptCache();
  var khoa = 'xh_' + hk.maHocKy;
  var cu = cache.get(khoa);
  var chung = cu ? JSON.parse(cu) : null;
  if (!chung) {
    chung = tinhXepHangChung_(hk);
    cache.put(khoa, JSON.stringify(chung), 10);
  }
  var nhom = nhomCuaEmail_(email, hk.maHocKy);
  chung.nhomToi = nhom ? nhom.maNhom : null;
  return chung;
}

function tinhXepHangChung_(hk) {
  var tenNhom = {};
  docBang_('Nhom').forEach(function (n) { if (n.maHocKy === hk.maHocKy) tenNhom[n.maNhom] = n.tenNhom; });
  var ketQua = docBang_('KetQuaTuan').filter(function (r) { return r.maHocKy === hk.maHocKy; });
  var theoTuan = {};
  ketQua.forEach(function (r) {
    var so = Number(r.soTuan);
    (theoTuan[so] = theoTuan[so] || []).push({
      maNhom: r.maNhom, tenNhom: tenNhom[r.maNhom] || r.maNhom, diem: Number(r.diemNhom), hang: Number(r.hang),
      soTinh: Number(r.soThanhVienTinh), soThamGia: Number(r.soThamGia),
    });
  });
  var cacTuan = Object.keys(theoTuan).map(Number).sort(function (a, b) { return a - b; }).map(function (so) {
    return { soTuan: so, daChot: true, nhom: theoTuan[so].sort(function (a, b) { return a.hang - b.hang; }) };
  });

  var t = chonTuanHienTai(docTuan_(hk.maHocKy), Date.now());
  var tuanHienTai = null;
  if (t) {
    var daChot = !!theoTuan[t.soTuan];
    var nhom = daChot ? theoTuan[t.soTuan].slice().sort(function (a, b) { return a.hang - b.hang; }) : tinhBangTuan_(hk.maHocKy, t.soTuan).map(function (n) {
      return { maNhom: n.maNhom, tenNhom: n.tenNhom, diem: n.diem, hang: n.hang, soTinh: n.soTinh, soThamGia: n.soThamGia };
    });
    tuanHienTai = { soTuan: t.soTuan, daChot: daChot, nhom: nhom };
  }

  var diemTheoNhom = {};
  var thamGiaTheoNhom = {};
  var giayTheoNhom = {};
  ketQua.forEach(function (r) {
    (diemTheoNhom[r.maNhom] = diemTheoNhom[r.maNhom] || []).push(Number(r.diemNhom));
    var tl = Number(r.soThanhVienTinh) ? Number(r.soThamGia) / Number(r.soThanhVienTinh) : 0;
    (thamGiaTheoNhom[r.maNhom] = thamGiaTheoNhom[r.maNhom] || []).push(tl);
    (giayTheoNhom[r.maNhom] = giayTheoNhom[r.maNhom] || []).push(Number(r.soThamGia) ? Number(r.tongGiayLam) / Number(r.soThamGia) : 0);
  });
  var trungBinh = function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; };
  var luyKe = xepHangNhom(Object.keys(diemTheoNhom).map(function (ma) {
    return { maNhom: ma, tenNhom: tenNhom[ma] || ma, diem: diemLuyKe(diemTheoNhom[ma]), tiLeThamGia: trungBinh(thamGiaTheoNhom[ma]), giayTB: trungBinh(giayTheoNhom[ma]) };
  })).map(function (n) { return { maNhom: n.maNhom, tenNhom: n.tenNhom, diem: n.diem, hang: n.hang }; });

  var vinhDanh = null;
  if (cacTuan.length) {
    var moiNhat = cacTuan[cacTuan.length - 1];
    var dau = moiNhat.nhom.filter(function (n) { return n.hang === 1; });
    if (dau.length) vinhDanh = { soTuan: moiNhat.soTuan, nhom: dau.map(function (n) { return { tenNhom: n.tenNhom, diem: n.diem }; }) };
  }
  return { tuanHienTai: tuanHienTai, cacTuan: cacTuan, luyKe: luyKe, vinhDanh: vinhDanh };
}

// Trạng thái từng thành viên trong tuần hiện tại cho trang Nhóm.
function trangThaiThanhVienTuan_(maHocKy, t, emails) {
  var luot = {};
  var nopCau = {};
  var mien = {};
  if (!t) return {};
  docBang_('LuotThi').forEach(function (r) { if (r.maHocKy === maHocKy && Number(r.soTuan) === t.soTuan) luot[chuanHoaEmail(r.email)] = r; });
  docBang_('Mien').forEach(function (m) { if (m.maHocKy === maHocKy && Number(m.soTuan) === t.soTuan) mien[chuanHoaEmail(m.email)] = true; });
  docBang_('CauHoi').forEach(function (c) {
    if (c.maHocKy === maHocKy && Number(c.soTuan) === t.soTuan && c.trangThai !== 'removed') {
      var e = chuanHoaEmail(c.tacGia);
      nopCau[e] = (nopCau[e] || 0) + 1;
    }
  });
  var yeuCau = (Number(layCauHinh_().soMonNopCauHoi) || 3) * (Number(layCauHinh_().soCauNopMoiMon) || 5);
  var kq = {};
  emails.forEach(function (e) {
    var l = luot[e];
    var nop = l && daNopLuot_(l);
    kq[e] = {
      tt: mien[e] ? 'mien' : nop ? 'da_thi' : l ? 'dang_thi' : (nopCau[e] || 0) >= yeuCau ? 'da_nop_cau' : 'chua_nop_cau',
      diem: nop ? Number(l.diem) : null,
    };
  });
  return kq;
}
