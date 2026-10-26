// Vòng đời học kỳ: thêm môn, kết thúc học kỳ (tổng kết), tạo học kỳ mới.

function ngayVN_(ms) {
  return ms ? new Date(ms + 7 * 3600000).toISOString().slice(0, 10) : '';
}

function homNayDate_(chuoi) {
  var t = Date.parse(String(chuoi || '') + 'T00:00:00+07:00');
  return isNaN(t) ? '' : new Date(t);
}

function hdDsHocKy_() {
  var tongKet = {};
  docBang_('TongKet').forEach(function (r) { tongKet[r.maHocKy] = true; });
  return docBang_('HocKy').map(function (r) {
    return {
      maHocKy: r.maHocKy, tenHocKy: r.tenHocKy, batDau: ngayVN_(msCua_(r.batDau)), ketThuc: ngayVN_(msCua_(r.ketThuc)),
      trangThai: r.trangThai, coTongKet: !!tongKet[r.maHocKy],
    };
  });
}

function hdThemMon_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var ma = String(body.maMon || '').trim().toLowerCase();
  var ten = String(body.tenMon || '').replace(/\s+/g, ' ').trim();
  var mau = /^#[0-9a-fA-F]{6}$/.test(String(body.mau || '')) ? String(body.mau) : '#4cc9f0';
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ma) || ma.length > 40) throw loi_('ma_sai', 'Mã môn chỉ gồm chữ thường không dấu, số và dấu gạch ngang, ví dụ: giai-tich-1.');
  if (ten.length < 2 || ten.length > 80) throw loi_('ten_sai', 'Tên môn dài từ 2 đến 80 ký tự.');
  return voiKhoa_(function () {
    if (docBang_('Mon').some(function (m) { return m.maHocKy === hk.maHocKy && m.maMon === ma; })) throw loi_('da_co', 'Mã môn này đã có.');
    themDong_('Mon', { maHocKy: hk.maHocKy, maMon: ma, tenMon: ten, mau: mau, danhSachChuong: '[]' });
    ghiNhatKy_(email, 'themMon', hk.maHocKy + '/' + ma, ten);
    return {
      maHocKy: hk.maHocKy, maMon: ma,
      duongDan: 'public/bai-hoc/' + hk.maHocKy + '/' + ma + '/mon.json',
      monJson: JSON.stringify({ ten: ten, mau: mau, chuong: [] }, null, 2),
    };
  });
}

// ---------- Tổng kết học kỳ ----------

function tinhTongKet_(hk) {
  var chung = tinhXepHangChung_(hk);
  var tenTheoEmail = dungTenTheoEmail_();
  var luots = docBang_('LuotThi').filter(function (r) { return r.maHocKy === hk.maHocKy && daNopLuot_(r); });

  var tuan = chung.cacTuan.map(function (t) {
    var soTinh = 0;
    var soThamGia = 0;
    t.nhom.forEach(function (n) { soTinh += n.soTinh || 0; soThamGia += n.soThamGia || 0; });
    return { soTuan: t.soTuan, soThamGia: soThamGia, soTinh: soTinh, tiLe: soTinh ? Math.round((soThamGia / soTinh) * 1000) / 10 : 0 };
  });

  var theoNguoi = {};
  luots.forEach(function (r) {
    var e = chuanHoaEmail(r.email);
    var o = theoNguoi[e] || (theoNguoi[e] = { tong: 0, so: 0 });
    o.tong += Number(r.diem) || 0;
    o.so++;
  });
  var topCaNhan = Object.keys(theoNguoi).map(function (e) {
    return { hoTen: tenTheoEmail[e] || e, diemTB: Math.round((theoNguoi[e].tong / theoNguoi[e].so) * 10) / 10, soTuan: theoNguoi[e].so };
  }).sort(function (a, b) { return b.diemTB - a.diemTB || b.soTuan - a.soTuan; }).slice(0, 10);

  var diemCap = tongDiemTheoEmail_();
  var moi = soDiemMoiLevel_(layCauHinh_());
  var topCapBac = Object.keys(diemCap).filter(function (e) { return tenTheoEmail[e]; }).map(function (e) {
    var c = capTuDiem(diemCap[e], moi);
    return { hoTen: tenTheoEmail[e], tong: diemCap[e], level: c.level, tenCapLon: c.tenCapLon };
  }).sort(function (a, b) { return b.tong - a.tong; }).slice(0, 10);

  var dem = {};
  docBang_('DanhHieu').forEach(function (d) {
    if (d.maHocKy !== hk.maHocKy) return;
    var e = chuanHoaEmail(d.email);
    dem[e] = (dem[e] || 0) + 1;
  });
  var danhHieu = Object.keys(dem).map(function (e) { return { hoTen: tenTheoEmail[e] || e, soLan: dem[e] }; })
    .sort(function (a, b) { return b.soLan - a.soLan; });

  var soCau = docBang_('CauHoi').filter(function (c) { return c.maHocKy === hk.maHocKy && c.trangThai !== 'removed'; }).length;
  return {
    maHocKy: hk.maHocKy,
    tenHocKy: hk.tenHocKy,
    ngayTongKet: new Date().toISOString(),
    nhomVoDich: chung.luyKe.filter(function (n) { return n.hang === 1; }).map(function (n) { return { tenNhom: n.tenNhom, diem: n.diem }; }),
    bangNhom: chung.luyKe,
    tuan: tuan,
    thamGiaTrungBinh: tuan.length ? Math.round((tuan.reduce(function (s, t) { return s + t.tiLe; }, 0) / tuan.length) * 10) / 10 : 0,
    topCaNhan: topCaNhan,
    topCapBac: topCapBac,
    danhHieu: danhHieu,
    thongKe: {
      soTuanDaChot: tuan.length, soCauHoi: soCau, soLuotThi: luots.length,
      soDeTuTao: docBang_('DeTuTao').filter(function (r) { return daNopLuot_(r); }).length,
      soThanhVien: Object.keys(tenTheoEmail).length,
    },
  };
}

function hdKetThucHocKy_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  if (!body.xacNhan) throw loi_('can_xac_nhan', 'Cần xác nhận kết thúc học kỳ.');
  var grace = graceGiay_(layCauHinh_());
  return voiKhoa_(function () {
    var bayGio = Date.now();
    var chuaXong = [];
    docTuan_(hk.maHocKy).forEach(function (t) {
      if (tuanDaChot_(hk.maHocKy, t.soTuan)) return;
      if (bayGio <= t.dongCua) {
        var coBai = docBang_('LuotThi').some(function (r) { return r.maHocKy === hk.maHocKy && Number(r.soTuan) === t.soTuan; });
        if (!coBai) { suaDong_('Tuan', t._dong, { trangThai: 'huy' }); return; } // tuần chưa diễn ra thì hủy
        suaDong_('Tuan', t._dong, { dongCua: new Date(bayGio - 1) }); // đóng sớm để chốt
        t.dongCua = bayGio - 1;
      }
      if (!chotMotTuan_(hk, t, grace)) chuaXong.push(t.soTuan);
    });
    if (chuaXong.length) throw loi_('con_dang_thi', 'Tuần ' + chuaXong.join(', ') + ' vẫn còn người đang làm bài. Thử lại sau khi họ nộp xong.');

    datLaiBoNho_();
    var tongKet = tinhTongKet_(hk);
    xoaDongNeu_('TongKet', function (r) { return r.maHocKy === hk.maHocKy; });
    themDong_('TongKet', { maHocKy: hk.maHocKy, noiDung: JSON.stringify(tongKet), ngayTao: new Date() });
    suaDong_('HocKy', docBang_('HocKy').filter(function (r) { return r.maHocKy === hk.maHocKy; })[0]._dong, { trangThai: 'dong', ketThuc: new Date() });
    ghiNhatKy_(email, 'ketThucHocKy', hk.maHocKy, { soTuan: tongKet.tuan.length });
    CacheService.getScriptCache().remove('xh_' + hk.maHocKy);
    CacheService.getScriptCache().remove('xhcn');
    return { tongKet: tongKet };
  });
}

function hdTongKet_(email, tv, body) {
  var r = docBang_('TongKet').filter(function (x) { return x.maHocKy === String(body.maHocKy || ''); })[0];
  if (!r) throw loi_('khong_thay', 'Học kỳ này chưa có tổng kết.');
  return jsonAnToan_(r.noiDung, {});
}

// ---------- Học kỳ mới ----------

function hdTaoHocKy_(email, tv, body) {
  if (hocKyDangMo_()) throw loi_('dang_mo', 'Đang có học kỳ mở. Hãy kết thúc học kỳ hiện tại trước.');
  var ma = String(body.maHocKy || '').trim().toLowerCase();
  var ten = String(body.tenHocKy || '').replace(/\s+/g, ' ').trim();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ma) || ma.length > 40) throw loi_('ma_sai', 'Mã học kỳ chỉ gồm chữ thường không dấu, số, dấu gạch ngang, ví dụ: hk2-2026-2027.');
  if (ten.length < 2 || ten.length > 80) throw loi_('ten_sai', 'Tên học kỳ dài từ 2 đến 80 ký tự.');
  var batDau = body.batDau ? homNayDate_(body.batDau) : '';
  var ketThuc = body.ketThuc ? homNayDate_(body.ketThuc) : '';
  if ((body.batDau && !batDau) || (body.ketThuc && !ketThuc)) throw loi_('ngay_sai', 'Ngày không hợp lệ (dạng 2027-02-15).');
  var saoChepMon = body.saoChepMon !== false;
  var giuNhom = body.giuNhom === true;

  return voiKhoa_(function () {
    var cu = docBang_('HocKy');
    if (cu.some(function (r) { return r.maHocKy === ma; })) throw loi_('da_co', 'Mã học kỳ này đã có.');
    var truoc = cu.filter(function (r) { return r.trangThai === 'dong'; }).pop() || null;
    themDong_('HocKy', { maHocKy: ma, tenHocKy: ten, batDau: batDau, ketThuc: ketThuc, trangThai: 'mo' });
    var soMon = 0;
    var soNhom = 0;
    if (truoc && saoChepMon) {
      docBang_('Mon').filter(function (m) { return m.maHocKy === truoc.maHocKy; }).forEach(function (m) {
        themDong_('Mon', { maHocKy: ma, maMon: m.maMon, tenMon: m.tenMon, mau: m.mau, danhSachChuong: m.danhSachChuong || '[]' });
        soMon++;
      });
    }
    if (truoc && giuNhom) {
      var active = {};
      docBang_('ThanhVien').forEach(function (t) { if (t.trangThai === 'active') active[chuanHoaEmail(t.email)] = true; });
      docBang_('Nhom').filter(function (n) { return n.maHocKy === truoc.maHocKy; }).forEach(function (n) {
        themDong_('Nhom', { maHocKy: ma, maNhom: n.maNhom, tenNhom: n.tenNhom, linkZalo: n.linkZalo });
        soNhom++;
      });
      docBang_('NhomThanhVien').filter(function (r) { return r.maHocKy === truoc.maHocKy && active[chuanHoaEmail(r.email)]; }).forEach(function (r) {
        themDong_('NhomThanhVien', { maHocKy: ma, maNhom: r.maNhom, email: chuanHoaEmail(r.email) });
      });
    }
    ghiNhatKy_(email, 'taoHocKy', ma, { saoChepMon: saoChepMon, giuNhom: giuNhom });
    CacheService.getScriptCache().remove('xh_' + ma);
    return { maHocKy: ma, soMon: soMon, soNhom: soNhom, thuMucBaiHoc: 'public/bai-hoc/' + ma + '/' };
  });
}
