// Điểm vào duy nhất của Web app: doPost(e) -> kiểm tra danh tính -> chuyển theo action.
// Trình duyệt gửi POST với Content-Type text/plain để tránh preflight CORS.

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var hd = HANH_DONG_[body.action];
    if (!hd) throw loi_('khong_biet', 'Hành động không hợp lệ.');
    var email;
    if (body.action === 'dangNhap') email = xacMinhToken_(body.idToken);
    else if (hd.choPhienThi && body.maPhienThi) email = emailTuPhienThi_(body.maPhienThi); // tự lưu và nộp không phụ thuộc đăng nhập
    else if (body.phien) email = emailTuPhien_(body.phien);
    else email = xacMinhToken_(body.idToken);
    var tv = canThanhVienActive_(email);
    if (hd.vaiTro) canVaiTro_(tv, hd.vaiTro);
    var du_lieu = hd.chay(email, tv, body);
    return jsonOut_({ ok: true, data: du_lieu });
  } catch (err) {
    var ma = err && err.ma ? err.ma : 'loi_he_thong';
    if (ma === 'loi_he_thong') console.error(err && err.stack ? err.stack : String(err));
    return jsonOut_({ ok: false, error: ma, message: ma === 'loi_he_thong' ? 'Có lỗi hệ thống, thử lại sau.' : err.message });
  }
}

// Mở link Web app bằng trình duyệt sẽ chạy hàm này: dùng để kiểm tra đã triển khai đúng.
function doGet() {
  return jsonOut_({ ok: true, data: 'Learning Group API đang chạy.' });
}

var CHU_ = ['owner'];
var CHU_TRO_LY_ = ['owner', 'assistant'];

var HANH_DONG_ = {
  dangNhap: { chay: hdDangNhap_ },
  dangXuat: { chay: hdDangXuat_ },
  me: { chay: hdMe_ },
  batDauThi: { chay: hdBatDauThi_ },
  'thi.luu': { choPhienThi: true, chay: hdThiLuu_ },
  'thi.nop': { choPhienThi: true, chay: hdThiNop_ },
  xepHang: { chay: hdXepHang_ },
  xepHangCaNhan: { chay: hdXepHangCaNhan_ },
  'luyenTap.thongTin': { chay: hdLuyenTapThongTin_ },
  'luyenTap.bat': { chay: hdLuyenTapBat_ },
  'luyenTap.nop': { chay: hdLuyenTapNop_ },
  baoSai: { chay: hdBaoSai_ },
  xemLai: { chay: hdXemLai_ },
  cauKhoNhat: { chay: hdCauKhoNhat_ },
  'admin.nganHang': { vaiTro: CHU_TRO_LY_, chay: hdNganHang_ },
  'admin.suaCauHoi': { vaiTro: CHU_, chay: hdSuaCauHoi_ },
  'admin.doiTrangThaiCau': { vaiTro: CHU_TRO_LY_, chay: hdDoiTrangThaiCau_ },
  'admin.xuatNganHang': { vaiTro: CHU_, chay: hdXuatNganHang_ },
  'admin.xemTruocNhap': { vaiTro: CHU_, chay: hdXemTruocNhap_ },
  'admin.nhapNganHang': { vaiTro: CHU_, chay: hdNhapNganHang_ },
  'admin.chotTuan': { vaiTro: CHU_, chay: hdChotTuanThuCong_ },
  nhomCuaToi: { chay: hdNhomCuaToi_ },
  capNhatLinkZalo: { chay: hdCapNhatLinkZalo_ },
  doiTenNhom: { chay: hdDoiTenNhom_ },
  tuanHienTai: { chay: hdTuanHienTai_ },
  nhapLay: { chay: hdNhapLay_ },
  nhapLuu: { chay: hdNhapLuu_ },
  nopCauHoi: { chay: hdNopCauHoi_ },
  xinMien: { chay: hdXinMien_ },
  huyMien: { chay: hdHuyMien_ },
  cauHoiCuaToi: { chay: hdCauHoiCuaToi_ },
  'admin.dsTuan': { vaiTro: CHU_TRO_LY_, chay: hdDsTuan_ },
  'admin.taoLichTuan': { vaiTro: CHU_, chay: hdTaoLichTuan_ },
  'admin.suaTuan': { vaiTro: CHU_, chay: hdSuaTuan_ },
  'admin.dsThanhVien': { vaiTro: CHU_TRO_LY_, chay: hdDsThanhVien_ },
  'admin.nhapDangKy': { vaiTro: CHU_, chay: hdNhapDangKy_ },
  'admin.themThanhVien': { vaiTro: CHU_, chay: hdThemThanhVien_ },
  'admin.doiVaiTro': { vaiTro: CHU_, chay: hdDoiVaiTro_ },
  'admin.goThanhVien': { vaiTro: CHU_, chay: hdGoThanhVien_ },
  'admin.moLaiThanhVien': { vaiTro: CHU_, chay: hdMoLaiThanhVien_ },
  'admin.xemTruocChiaNhom': { vaiTro: CHU_, chay: hdXemTruocChiaNhom_ },
  'admin.chotChiaNhom': { vaiTro: CHU_, chay: hdChotChiaNhom_ },
  'admin.nhomHienTai': { vaiTro: CHU_, chay: hdNhomHienTai_ },
  'admin.chuyenNguoi': { vaiTro: CHU_, chay: hdChuyenNguoi_ },
};

// ---------- Người dùng ----------

function nhomCuaEmail_(email, maHocKy) {
  var lienKet = docBang_('NhomThanhVien').filter(function (r) {
    return r.maHocKy === maHocKy && chuanHoaEmail(r.email) === email;
  });
  if (!lienKet.length) return null;
  var maNhom = lienKet[0].maNhom;
  var nhom = docBang_('Nhom').filter(function (n) { return n.maHocKy === maHocKy && n.maNhom === maNhom; });
  return nhom.length ? nhom[0] : null;
}

function chiTietNhom_(nhom) {
  var tvTheoEmail = {};
  docBang_('ThanhVien').forEach(function (t) { tvTheoEmail[chuanHoaEmail(t.email)] = t; });
  var thanhVien = docBang_('NhomThanhVien')
    .filter(function (r) { return r.maHocKy === nhom.maHocKy && r.maNhom === nhom.maNhom; })
    .map(function (r) {
      var t = tvTheoEmail[chuanHoaEmail(r.email)];
      return { email: chuanHoaEmail(r.email), hoTen: t ? t.hoTen : '', trangThai: t ? t.trangThai : '' };
    })
    .filter(function (t) { return t.trangThai === 'active'; });
  return { maNhom: nhom.maNhom, tenNhom: nhom.tenNhom, linkZalo: nhom.linkZalo || '', thanhVien: thanhVien };
}

function hdMe_(email, tv) {
  var hk = hocKyDangMo_();
  var nhom = hk ? nhomCuaEmail_(email, hk.maHocKy) : null;
  return {
    email: email,
    hoTen: tv.hoTen,
    vaiTro: tv.vaiTro,
    hocKy: hk ? { maHocKy: hk.maHocKy, tenHocKy: hk.tenHocKy } : null,
    nhom: nhom ? { maNhom: nhom.maNhom, tenNhom: nhom.tenNhom } : null,
  };
}

function hdNhomCuaToi_(email) {
  var hk = hocKyDangMo_();
  if (!hk) return null;
  var nhom = nhomCuaEmail_(email, hk.maHocKy);
  if (!nhom) return null;
  var ct = chiTietNhom_(nhom);
  var t = chonTuanHienTai(docTuan_(hk.maHocKy), Date.now());
  var tt = trangThaiThanhVienTuan_(hk.maHocKy, t, ct.thanhVien.map(function (x) { return x.email; }));
  ct.thanhVien.forEach(function (x) {
    x.tt = tt[x.email] ? tt[x.email].tt : '';
    x.diem = tt[x.email] ? tt[x.email].diem : null;
  });
  ct.tuan = t ? { soTuan: t.soTuan, trangThai: trangThaiTuan(t, Date.now()) } : null;
  return ct;
}

function canNhomCuaToi_(email) {
  var hk = hocKyDangMo_();
  var nhom = hk ? nhomCuaEmail_(email, hk.maHocKy) : null;
  if (!nhom) throw loi_('chua_co_nhom', 'Bạn chưa được xếp vào nhóm.');
  return nhom;
}

function hdCapNhatLinkZalo_(email, tv, body) {
  var link = String(body.link || '').trim();
  if (link !== '' && !laLinkHopLe(link)) throw loi_('link_sai', 'Link phải bắt đầu bằng https://');
  if (link.length > 300) throw loi_('link_sai', 'Link quá dài.');
  var nhom = canNhomCuaToi_(email);
  voiKhoa_(function () {
    suaDong_('Nhom', nhom._dong, { linkZalo: link });
    ghiNhatKy_(email, 'capNhatLinkZalo', nhom.maNhom, '');
  });
  return { linkZalo: link };
}

function hdDoiTenNhom_(email, tv, body) {
  var ten = String(body.tenNhom || '').replace(/\s+/g, ' ').trim();
  if (ten.length < 2 || ten.length > 40) throw loi_('ten_sai', 'Tên nhóm dài từ 2 đến 40 ký tự.');
  var nhom = canNhomCuaToi_(email);
  return voiKhoa_(function () {
    if (tv.vaiTro !== 'owner') {
      var bayGioMs = Date.now();
      var gan = docBang_('NhatKy').filter(function (r) {
        return r.hanhDong === 'doiTenNhom' && r.doiTuong === nhom.maNhom && bayGioMs - new Date(r.thoiGian).getTime() < 7 * 86400000;
      });
      if (gan.length) throw loi_('qua_som', 'Nhóm chỉ được đổi tên một lần mỗi tuần.');
    }
    suaDong_('Nhom', nhom._dong, { tenNhom: ten });
    ghiNhatKy_(email, 'doiTenNhom', nhom.maNhom, ten);
    return { tenNhom: ten };
  });
}

// ---------- Quản trị ----------

function hdDsThanhVien_(email, tv) {
  return docBang_('ThanhVien').map(function (t) {
    return { email: chuanHoaEmail(t.email), hoTen: t.hoTen, vaiTro: t.vaiTro, trangThai: t.trangThai, ngayThamGia: t.ngayThamGia };
  });
}

function timCot_(tieuDe, tuKhoa) {
  for (var i = 0; i < tieuDe.length; i++) {
    if (String(tieuDe[i]).toLowerCase().indexOf(tuKhoa) !== -1) return tieuDe[i];
  }
  return null;
}

// Đọc DangKy thành [{email, hoTen, gpa, thuTu, dong}]. Cột tìm theo từ khóa trong tiêu đề của Form.
function docDangKy_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DangKy');
  if (!sheet) throw loi_('chua_co_dang_ky', 'Chưa có tab DangKy. Hãy chạy taoFormDangKy().');
  var tieuDe = tieuDeTab_(sheet);
  var cotEmail = timCot_(tieuDe, 'email');
  var cotTen = timCot_(tieuDe, 'họ');
  var cotGpa = timCot_(tieuDe, 'gpa');
  if (!cotEmail || !cotTen || !cotGpa) throw loi_('cot_sai', 'Tab DangKy thiếu cột email, họ tên hoặc GPA.');
  return docBang_('DangKy').map(function (r, i) {
    return { email: chuanHoaEmail(r[cotEmail]), hoTen: String(r[cotTen] || '').trim(), gpa: docGpa(r[cotGpa]), thuTu: i, dong: r._dong };
  });
}

function hdNhapDangKy_(email) {
  return voiKhoa_(function () {
    var dangKy = docDangKy_();
    var daCo = {};
    docBang_('ThanhVien').forEach(function (t) { daCo[chuanHoaEmail(t.email)] = true; });
    var them = 0;
    var boQua = 0;
    dangKy.forEach(function (d) {
      if (!d.email) return;
      if (daCo[d.email]) { boQua++; return; }
      themDong_('ThanhVien', { email: d.email, hoTen: d.hoTen, vaiTro: 'member', trangThai: 'active', ngayThamGia: new Date(), ghiChu: '' });
      daCo[d.email] = true;
      them++;
    });
    ghiNhatKy_(email, 'nhapDangKy', '', { them: them, boQua: boQua });
    return { them: them, daCo: boQua, tongDangKy: dangKy.length };
  });
}

function hdThemThanhVien_(email, tv, body) {
  var emailMoi = chuanHoaEmail(body.email);
  var hoTen = String(body.hoTen || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailMoi)) throw loi_('email_sai', 'Email không hợp lệ.');
  if (!hoTen) throw loi_('thieu_ten', 'Cần nhập họ tên.');
  return voiKhoa_(function () {
    if (timThanhVien_(emailMoi)) throw loi_('da_co', 'Email này đã có trong danh sách.');
    themDong_('ThanhVien', { email: emailMoi, hoTen: hoTen, vaiTro: 'member', trangThai: 'active', ngayThamGia: new Date(), ghiChu: 'thêm tay' });
    ghiNhatKy_(email, 'themThanhVien', emailMoi, '');
    return { email: emailMoi };
  });
}

function canThanhVienKhongPhaiChu_(emailMuc) {
  var t = timThanhVien_(emailMuc);
  if (!t) throw loi_('khong_thay', 'Không tìm thấy thành viên.');
  if (t.vaiTro === 'owner') throw loi_('cam', 'Không thể thay đổi chủ.');
  return t;
}

function hdDoiVaiTro_(email, tv, body) {
  var vaiTro = body.vaiTro;
  if (vaiTro !== 'member' && vaiTro !== 'assistant') throw loi_('vai_tro_sai', 'Vai trò chỉ là member hoặc assistant.');
  var emailMuc = chuanHoaEmail(body.email);
  return voiKhoa_(function () {
    var t = canThanhVienKhongPhaiChu_(emailMuc);
    suaDong_('ThanhVien', t._dong, { vaiTro: vaiTro });
    ghiNhatKy_(email, 'doiVaiTro', emailMuc, vaiTro);
    return { email: emailMuc, vaiTro: vaiTro };
  });
}

function hdGoThanhVien_(email, tv, body) {
  var loai = body.loai;
  if (loai !== 'withdrawn' && loai !== 'removed') throw loi_('loai_sai', 'Lý do gỡ chỉ là withdrawn hoặc removed.');
  var emailMuc = chuanHoaEmail(body.email);
  return voiKhoa_(function () {
    var t = canThanhVienKhongPhaiChu_(emailMuc);
    var thayDoi = { trangThai: loai };
    if (body.xoaDuLieu) {
      thayDoi.hoTen = '(đã xóa)';
      xoaDongNeu_('DangKy', function (r) {
        var cot = Object.keys(r).filter(function (k) { return k.toLowerCase().indexOf('email') !== -1; })[0];
        return cot && chuanHoaEmail(r[cot]) === emailMuc;
      });
    }
    suaDong_('ThanhVien', t._dong, thayDoi);
    ghiNhatKy_(email, 'goThanhVien', emailMuc, { loai: loai, xoaDuLieu: !!body.xoaDuLieu });
    return { email: emailMuc, trangThai: loai };
  });
}

function hdMoLaiThanhVien_(email, tv, body) {
  var emailMuc = chuanHoaEmail(body.email);
  return voiKhoa_(function () {
    var t = canThanhVienKhongPhaiChu_(emailMuc);
    suaDong_('ThanhVien', t._dong, { trangThai: 'active' });
    ghiNhatKy_(email, 'moLaiThanhVien', emailMuc, '');
    return { email: emailMuc, trangThai: 'active' };
  });
}

function hdXemTruocChiaNhom_(email) {
  var cauHinh = layCauHinh_();
  var kichThuoc = Number(cauHinh.kichThuocNhom) || 6;
  var dangKy = docDangKy_();
  var gpaTheoEmail = {};
  dangKy.forEach(function (d) { gpaTheoEmail[d.email] = d; });

  var nguoi = [];
  var thieuGpa = [];
  docBang_('ThanhVien').forEach(function (t, i) {
    if (t.trangThai !== 'active') return;
    var e = chuanHoaEmail(t.email);
    var d = gpaTheoEmail[e];
    if (!d || isNaN(d.gpa)) { thieuGpa.push({ email: e, hoTen: t.hoTen }); return; }
    nguoi.push({ email: e, hoTen: t.hoTen, gpa: d.gpa, thuTu: i });
  });
  var nhoms = chiaNhom(nguoi, kichThuoc);
  return {
    kichThuoc: kichThuoc,
    doLech: doLechGpa(nhoms),
    thieuGpa: thieuGpa,
    nhoms: nhoms.map(function (g, i) {
      return { tenNhom: 'Nhóm ' + (i + 1), thanhVien: g.map(function (p) { return { email: p.email, hoTen: p.hoTen, gpa: p.gpa }; }) };
    }),
  };
}

function hdChotChiaNhom_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở (tab HocKy).');
  var nhoms = body.nhoms;
  if (!Array.isArray(nhoms) || nhoms.length === 0) throw loi_('thieu_nhom', 'Không có nhóm nào để chốt.');
  return voiKhoa_(function () {
    var active = {};
    docBang_('ThanhVien').forEach(function (t) { if (t.trangThai === 'active') active[chuanHoaEmail(t.email)] = true; });
    var daThay = {};
    nhoms.forEach(function (g) {
      (g.thanhVien || []).forEach(function (p) {
        var e = chuanHoaEmail(p.email);
        if (!active[e]) throw loi_('khong_active', e + ' không phải thành viên đang hoạt động.');
        if (daThay[e]) throw loi_('trung', e + ' xuất hiện ở hai nhóm.');
        daThay[e] = true;
      });
    });

    var cu = {};
    docBang_('Nhom').forEach(function (n) { if (n.maHocKy === hk.maHocKy) cu[n.maNhom] = n; });
    xoaDongNeu_('NhomThanhVien', function (r) { return r.maHocKy === hk.maHocKy; });
    xoaDongNeu_('Nhom', function (r) { return r.maHocKy === hk.maHocKy; });

    nhoms.forEach(function (g, i) {
      var ma = 'n' + (i + 1);
      var ten = String(g.tenNhom || '').trim().slice(0, 40) || 'Nhóm ' + (i + 1);
      themDong_('Nhom', { maHocKy: hk.maHocKy, maNhom: ma, tenNhom: ten, linkZalo: cu[ma] ? cu[ma].linkZalo : '' });
      (g.thanhVien || []).forEach(function (p) {
        themDong_('NhomThanhVien', { maHocKy: hk.maHocKy, maNhom: ma, email: chuanHoaEmail(p.email) });
      });
    });
    ghiNhatKy_(email, 'chotChiaNhom', hk.maHocKy, { soNhom: nhoms.length });
    return { soNhom: nhoms.length };
  });
}

function hdNhomHienTai_() {
  var hk = hocKyDangMo_();
  if (!hk) return { nhoms: [], chuaCoNhom: [] };
  var gpaTheoEmail = {};
  try {
    docDangKy_().forEach(function (d) { gpaTheoEmail[d.email] = d.gpa; });
  } catch (e) { /* chưa có DangKy thì không hiện GPA */ }
  var tvTheoEmail = {};
  docBang_('ThanhVien').forEach(function (t) { tvTheoEmail[chuanHoaEmail(t.email)] = t; });

  var lienKet = docBang_('NhomThanhVien').filter(function (r) { return r.maHocKy === hk.maHocKy; });
  var coNhom = {};
  var nhoms = docBang_('Nhom').filter(function (n) { return n.maHocKy === hk.maHocKy; }).map(function (n) {
    var tv = lienKet.filter(function (r) { return r.maNhom === n.maNhom; }).map(function (r) {
      var e = chuanHoaEmail(r.email);
      coNhom[e] = true;
      var t = tvTheoEmail[e];
      var g = gpaTheoEmail[e];
      return { email: e, hoTen: t ? t.hoTen : '', gpa: g === undefined || isNaN(g) ? null : g };
    });
    return { maNhom: n.maNhom, tenNhom: n.tenNhom, thanhVien: tv };
  });
  var chuaCoNhom = [];
  Object.keys(tvTheoEmail).forEach(function (e) {
    if (tvTheoEmail[e].trangThai === 'active' && !coNhom[e]) chuaCoNhom.push({ email: e, hoTen: tvTheoEmail[e].hoTen });
  });
  return { nhoms: nhoms, chuaCoNhom: chuaCoNhom };
}

function hdChuyenNguoi_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var emailMuc = chuanHoaEmail(body.email);
  var maNhom = String(body.maNhom || '');
  return voiKhoa_(function () {
    var nhomDich = docBang_('Nhom').filter(function (n) { return n.maHocKy === hk.maHocKy && n.maNhom === maNhom; });
    if (!nhomDich.length) throw loi_('khong_thay', 'Không tìm thấy nhóm.');
    var t = timThanhVien_(emailMuc);
    if (!t || t.trangThai !== 'active') throw loi_('khong_active', 'Người này không đang hoạt động.');
    var cu = docBang_('NhomThanhVien').filter(function (r) { return r.maHocKy === hk.maHocKy && chuanHoaEmail(r.email) === emailMuc; });
    if (cu.length) suaDong_('NhomThanhVien', cu[0]._dong, { maNhom: maNhom });
    else themDong_('NhomThanhVien', { maHocKy: hk.maHocKy, maNhom: maNhom, email: emailMuc });
    ghiNhatKy_(email, 'chuyenNguoi', emailMuc, maNhom);
    return { email: emailMuc, maNhom: maNhom };
  });
}
