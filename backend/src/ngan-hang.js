// Ngân hàng câu hỏi: báo sai, xem lại bài, câu khó nhất, quản trị, xuất và nhập.

function nguoiDaGapCau_(email, id) {
  var thay = false;
  docBang_('LuotThi').concat(docBang_('DeTuTao')).forEach(function (r) {
    if (thay || chuanHoaEmail(r.email) !== email) return;
    thay = jsonAnToan_(r.dsCau, { ds: [] }).ds.some(function (c) { return c.id === id; });
  });
  return thay;
}

function hdBaoSai_(email, tv, body) {
  var id = String(body.idCauHoi || '');
  var lyDo = String(body.lyDo || '').trim().slice(0, 200);
  var cauHinh = layCauHinh_();
  var nguongTam = Number(cauHinh.baoSaiTamLoai) || 2;
  var nguongXoa = Number(cauHinh.baoSaiXoa) || 5;
  return voiKhoa_(function () {
    var c = docBang_('CauHoi').filter(function (x) { return x.id === id; })[0];
    if (!c || c.trangThai === 'removed') throw loi_('khong_thay', 'Không tìm thấy câu hỏi.');
    if (chuanHoaEmail(c.tacGia) === email) throw loi_('cua_minh', 'Không thể báo sai câu do chính bạn nộp.');
    if (!nguoiDaGapCau_(email, id)) throw loi_('khong_gap', 'Bạn chỉ báo sai được câu đã gặp trong đề của mình.');
    var baoSai = docBang_('BaoSai');
    var bayGio = Date.now();
    var gan = baoSai.filter(function (b) { return chuanHoaEmail(b.email) === email && bayGio - msCua_(b.thoiGian) < 3600000; });
    if (gan.length >= 30) throw loi_('qua_nhieu', 'Bạn báo sai quá nhiều trong một giờ, thử lại sau.');
    if (baoSai.some(function (b) { return b.idCauHoi === id && chuanHoaEmail(b.email) === email; })) throw loi_('da_bao', 'Bạn đã báo sai câu này rồi.');
    themDong_('BaoSai', { idCauHoi: id, email: email, lyDo: lyDo, thoiGian: new Date() });
    var nguoi = {};
    baoSai.forEach(function (b) { if (b.idCauHoi === id) nguoi[chuanHoaEmail(b.email)] = true; });
    nguoi[email] = true;
    var daKiemTra = c.daKiemTra === true || String(c.daKiemTra).toLowerCase() === 'true';
    // Câu chủ đã kiểm tra là đúng: vẫn ghi báo sai để chủ xem, nhưng không tự tạm loại hay xóa, nên vài người thông đồng không loại được câu.
    var moi = daKiemTra ? c.trangThai : trangThaiTheoBaoSai(Object.keys(nguoi).length, nguongTam, nguongXoa, c.trangThai);
    if (moi !== c.trangThai) {
      suaDong_('CauHoi', c._dong, { trangThai: moi });
      ghiNhatKy_('he_thong', 'doiTrangThaiCau', id, { tu: c.trangThai, den: moi, soNguoiBao: Object.keys(nguoi).length });
    }
    return { daBao: true };
  });
}

// ---------- Xem lại bài sau khi đóng cửa ----------

function tuanDaDong_(maHocKy) {
  var bayGio = Date.now();
  return docTuan_(maHocKy).filter(function (t) { return bayGio > t.dongCua; }).sort(function (a, b) { return a.soTuan - b.soTuan; });
}

function hdXemLai_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cauHinh = layCauHinh_();
  if (cauHinh.xemLaiSauDongCua === false || String(cauHinh.xemLaiSauDongCua).toLowerCase() === 'false') throw loi_('tat', 'Chức năng xem lại đang tắt.');
  var dong = tuanDaDong_(hk.maHocKy);
  var cacTuan = dong.filter(function (t) { return !!luotThiCua_(hk.maHocKy, t.soTuan, email); }).map(function (t) { return t.soTuan; });
  var soTuan = Number(body.soTuan) || (cacTuan.length ? cacTuan[cacTuan.length - 1] : 0);
  if (!soTuan) return { cacTuan: [], soTuan: null, cauHoi: [] };
  if (dong.every(function (t) { return t.soTuan !== soTuan; })) throw loi_('chua_dong', 'Tuần này chưa đóng cửa nên chưa xem lại được.');
  var luot = luotThiCua_(hk.maHocKy, soTuan, email);
  if (!luot) return { cacTuan: cacTuan, soTuan: soTuan, cauHoi: [] };
  if (!daNopLuot_(luot)) throw loi_('chua_cham', 'Bài của bạn chưa được chấm, thử lại sau ít phút.');
  var dl = jsonAnToan_(luot.dsCau, { ds: [] });
  return {
    cacTuan: cacTuan, soTuan: soTuan, diem: Number(luot.diem), soDung: Number(luot.soDung), soCau: Number(luot.soCau),
    cauHoi: dungXemLai_(dl.ds, jsonAnToan_(luot.traLoi, {}), cauHoiTheoId_(hk.maHocKy), tenMonTheoMa_(hk.maHocKy)),
  };
}

// ---------- Câu khó nhất tuần ----------

function hdCauKhoNhat_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cauHinh = layCauHinh_();
  if (cauHinh.hienCauKhoNhat === false || String(cauHinh.hienCauKhoNhat).toLowerCase() === 'false') return { tat: true, cauHoi: [] };
  var dong = tuanDaDong_(hk.maHocKy);
  var soTuan = Number(body.soTuan) || (dong.length ? dong[dong.length - 1].soTuan : 0);
  if (!soTuan || dong.every(function (t) { return t.soTuan !== soTuan; })) return { soTuan: null, cauHoi: [] };
  var cache = CacheService.getScriptCache();
  var khoa = 'ck_' + hk.maHocKy + '_' + soTuan;
  var cu = cache.get(khoa);
  if (cu) return JSON.parse(cu);

  var cauTheoId = cauHoiTheoId_(hk.maHocKy);
  var dapAn = {};
  Object.keys(cauTheoId).forEach(function (id) { dapAn[id] = cauTheoId[id].dapAn; });
  var luots = docBang_('LuotThi')
    .filter(function (r) { return r.maHocKy === hk.maHocKy && Number(r.soTuan) === soTuan && daNopLuot_(r); })
    .map(function (r) { return { ds: jsonAnToan_(r.dsCau, { ds: [] }).ds, traLoi: jsonAnToan_(r.traLoi, {}) }; });
  var top = cauKhoNhat(luots, dapAn, Number(cauHinh.cauKhoToiThieuLuot) || 3, 5);
  var tenMon = tenMonTheoMa_(hk.maHocKy);
  var kq = {
    soTuan: soTuan,
    cauHoi: top.map(function (d) {
      var g = cauTheoId[d.id] || {};
      return {
        id: d.id, tenMon: tenMon[g.maMon] || g.maMon, maChuong: g.maChuong, trangNguon: g.trangNguon, noiDung: g.noiDung,
        dapAn: ['A', 'B', 'C', 'D'].map(function (k) { return { k: k, text: g[k] }; }), dung: g.dapAn, giaiThich: g.giaiThich,
        soLuot: d.soLuot, tyLeSai: Math.round(d.tyLeSai * 100),
      };
    }),
  };
  cache.put(khoa, JSON.stringify(kq), 300);
  return kq;
}

// ---------- Quản trị ngân hàng ----------

function hangCauHoiQuanTri_(c, soBaoSai, tenTacGia) {
  return {
    id: c.id, maHocKy: c.maHocKy, soTuan: Number(c.soTuan), maMon: c.maMon, maChuong: c.maChuong, trangNguon: c.trangNguon,
    noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich,
    tacGia: chuanHoaEmail(c.tacGia), tenTacGia: tenTacGia || '', trangThai: c.trangThai, ghiChuDuyet: c.ghiChuDuyet || '',
    daKiemTra: c.daKiemTra === true || String(c.daKiemTra).toLowerCase() === 'true', ngayNop: c.ngayNop ? new Date(msCua_(c.ngayNop)).toISOString() : '',
    soBaoSai: soBaoSai || 0,
  };
}

function dungChiMucBaoSai_() {
  var kq = {};
  docBang_('BaoSai').forEach(function (b) {
    kq[b.idCauHoi] = kq[b.idCauHoi] || {};
    kq[b.idCauHoi][chuanHoaEmail(b.email)] = true;
  });
  return kq;
}

function dungTenTheoEmail_() {
  var kq = {};
  docBang_('ThanhVien').forEach(function (t) { kq[chuanHoaEmail(t.email)] = t.hoTen; });
  return kq;
}

function hdNganHang_(email, tv, body) {
  var baoSai = dungChiMucBaoSai_();
  var ten = dungTenTheoEmail_();
  var tacGia = String(body.tacGia || '').trim().toLowerCase();
  var tuKhoa = String(body.tuKhoa || '').trim().toLowerCase();
  // Mặc định chỉ hiện ngân hàng của học kỳ đang mở; '*' là mọi học kỳ; hoặc một mã học kỳ cụ thể.
  var hkMo = hocKyDangMo_();
  var maHk = body.maHocKy === '*' ? '' : String(body.maHocKy || (hkMo ? hkMo.maHocKy : ''));
  var ds = docBang_('CauHoi').filter(function (c) {
    if (maHk && c.maHocKy !== maHk) return false;
    if (body.soTuan && Number(c.soTuan) !== Number(body.soTuan)) return false;
    if (body.maMon && c.maMon !== body.maMon) return false;
    if (body.trangThai && c.trangThai !== body.trangThai) return false;
    if (tacGia && chuanHoaEmail(c.tacGia).indexOf(tacGia) === -1 && String(ten[chuanHoaEmail(c.tacGia)] || '').toLowerCase().indexOf(tacGia) === -1) return false;
    if (tuKhoa && String(c.noiDung).toLowerCase().indexOf(tuKhoa) === -1) return false;
    if (body.chiBaoSai && !(baoSai[c.id] && Object.keys(baoSai[c.id]).length)) return false;
    return true;
  }).map(function (c) {
    return hangCauHoiQuanTri_(c, baoSai[c.id] ? Object.keys(baoSai[c.id]).length : 0, ten[chuanHoaEmail(c.tacGia)]);
  }).sort(function (a, b) {
    if (b.soBaoSai !== a.soBaoSai) return b.soBaoSai - a.soBaoSai;
    return a.ngayNop < b.ngayNop ? 1 : -1;
  });
  var coKichThuoc = 50;
  var trang = Math.max(1, Number(body.trang) || 1);
  var trongKy = docBang_('CauHoi').filter(function (c) { return !maHk || c.maHocKy === maHk; });
  var soChoDuyet = trongKy.filter(function (c) { return c.trangThai === 'cho_duyet'; }).length;
  var soTamLoai = trongKy.filter(function (c) { return c.trangThai === 'suspended'; }).length;
  return { soChoDuyet: soChoDuyet, soTamLoai: soTamLoai, tong: ds.length, trang: trang, coTrang: coKichThuoc, cauHoi: ds.slice((trang - 1) * coKichThuoc, trang * coKichThuoc) };
}

function hdSuaCauHoi_(email, tv, body) {
  var id = String(body.id || '');
  var thayDoi = body.thayDoi || {};
  return voiKhoa_(function () {
    var c = docBang_('CauHoi').filter(function (x) { return x.id === id; })[0];
    if (!c) throw loi_('khong_thay', 'Không tìm thấy câu hỏi.');
    var hopLe = {};
    TRUONG_SUA_.forEach(function (k) { if (thayDoi[k] !== undefined) hopLe[k] = String(thayDoi[k]).trim(); });
    var merged = {};
    Object.keys(c).forEach(function (k) { merged[k] = c[k]; });
    Object.keys(hopLe).forEach(function (k) { merged[k] = hopLe[k]; });
    var loi = kiemTraMotCau(merged);
    if (loi.length) throw loi_('cau_hoi_sai', loi.join('\n'));
    ghiCaDong_('CauHoi', c._dong, hopLe);
    ghiNhatKy_(email, 'suaCauHoi', id, hopLe);
    return { id: id };
  });
}

function hdDoiTrangThaiCau_(email, tv, body) {
  var id = String(body.id || '');
  var moi = String(body.trangThai || '');
  if (['active', 'suspended', 'removed', 'cho_duyet', 'tu_choi'].indexOf(moi) === -1) throw loi_('trang_thai_sai', 'Trạng thái không hợp lệ.');
  if (tv.vaiTro !== 'owner' && moi === 'removed') throw loi_('cam', 'Chỉ chủ mới xóa câu hỏi.');
  return voiKhoa_(function () {
    var c = docBang_('CauHoi').filter(function (x) { return x.id === id; })[0];
    if (!c) throw loi_('khong_thay', 'Không tìm thấy câu hỏi.');
    if (tv.vaiTro !== 'owner' && c.trangThai === 'removed') throw loi_('cam', 'Chỉ chủ mới khôi phục câu đã xóa.');
    var khoiPhuc = moi === 'active' && (c.trangThai === 'suspended' || c.trangThai === 'removed');
    var thayDoi = { trangThai: moi };
    if (khoiPhuc) thayDoi.daKiemTra = true; // chủ đã xem và thấy câu đúng
    if (moi === 'suspended' || moi === 'removed') thayDoi.daKiemTra = false; // chủ tự loại thì bỏ dấu đã kiểm tra
    suaDong_('CauHoi', c._dong, thayDoi);
    if (moi === 'active') xoaDongNeu_('BaoSai', function (b) { return b.idCauHoi === id; }); // khôi phục thì xóa các báo sai cũ
    ghiNhatKy_(email, 'doiTrangThaiCau', id, { tu: c.trangThai, den: moi });
    return { id: id, trangThai: moi };
  });
}

function hdXuatNganHang_() {
  var baoSai = dungChiMucBaoSai_();
  var ten = dungTenTheoEmail_();
  return docBang_('CauHoi').map(function (c) {
    return hangCauHoiQuanTri_(c, baoSai[c.id] ? Object.keys(baoSai[c.id]).length : 0, ten[chuanHoaEmail(c.tacGia)]);
  });
}

// So khớp theo id, chưa ghi gì. Trả danh sách thay đổi, lỗi và id không tồn tại.
function soKhopNhapNganHang_(rows) {
  if (!Array.isArray(rows) || rows.length > 5000) throw loi_('du_lieu_sai', 'Dữ liệu nhập không hợp lệ.');
  var hienCo = {};
  docBang_('CauHoi').forEach(function (c) { hienCo[c.id] = c; });
  var thayDoi = [];
  var loi = [];
  var khongCo = [];
  var khongDoi = 0;
  rows.forEach(function (r0) {
    var c = hienCo[String(r0.id || '')];
    if (!c) { khongCo.push(String(r0.id || '(trống)')); return; }
    // quyetDinh trong file (duyet hoặc tu_choi) đổi thành trạng thái tương ứng; để trống thì giữ nguyên.
    var r = {};
    Object.keys(r0).forEach(function (k) { r[k] = r0[k]; });
    if (r0.quyetDinh === 'duyet') r.trangThai = 'active';
    else if (r0.quyetDinh === 'tu_choi') r.trangThai = 'tu_choi';
    var diff = soSanhCauHoi(c, r);
    if (!Object.keys(diff).length) { khongDoi++; return; }
    var merged = {};
    Object.keys(c).forEach(function (k) { merged[k] = c[k]; });
    Object.keys(diff).forEach(function (k) { merged[k] = diff[k].den; });
    var l = merged.trangThai === 'tu_choi' ? [] : kiemTraMotCau(merged); // câu bị từ chối không cần đủ định dạng
    if (l.length) loi.push({ id: c.id, loi: l });
    else thayDoi.push({ id: c.id, dong: c._dong, diff: diff });
  });
  return { thayDoi: thayDoi, loi: loi, khongCo: khongCo, khongDoi: khongDoi };
}

function hdXemTruocNhap_(email, tv, body) {
  var kq = soKhopNhapNganHang_(body.rows);
  var dem = function (tt) { return kq.thayDoi.filter(function (t) { return t.diff.trangThai && t.diff.trangThai.den === tt; }).length; };
  return {
    thayDoi: kq.thayDoi.map(function (t) { return { id: t.id, diff: t.diff }; }), loi: kq.loi, khongCo: kq.khongCo, khongDoi: kq.khongDoi,
    soDuyet: dem('active'), soTuChoi: dem('tu_choi'),
  };
}

function hdNhapNganHang_(email, tv, body) {
  return voiKhoa_(function () {
    var kq = soKhopNhapNganHang_(body.rows);
    kq.thayDoi.forEach(function (t) {
      var ghi = {};
      Object.keys(t.diff).forEach(function (k) { ghi[k] = t.diff[k].den; });
      ghiCaDong_('CauHoi', t.dong, ghi);
    });
    ghiNhatKy_(email, 'nhapNganHang', '', { daSua: kq.thayDoi.length, loi: kq.loi.length, khongCo: kq.khongCo.length });
    return { daSua: kq.thayDoi.length, boQuaViLoi: kq.loi.length, khongCo: kq.khongCo.length };
  });
}
