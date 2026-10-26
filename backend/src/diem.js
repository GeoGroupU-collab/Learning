// Điểm cá nhân: sổ điểm, luyện tập ngoài sự kiện, thưởng nhóm, danh hiệu tuần, xếp hạng cá nhân.

function soDiemMoiLevel_(cauHinh) {
  return Number(cauHinh.diemMoiLevel) || 100;
}

// Thêm nhiều dòng vào sổ điểm một lượt. Dòng có khóa (khoa) đã tồn tại thì bỏ qua, nên chạy lại không cộng trùng.
function themDiemNhieu_(cacMuc) {
  if (!cacMuc.length) return 0;
  var daCo = {};
  docBang_('Diem').forEach(function (r) { if (r.khoa !== '') daCo[r.khoa] = true; });
  var moi = cacMuc.filter(function (m) {
    if (m.khoa && daCo[m.khoa]) return false;
    if (m.khoa) daCo[m.khoa] = true;
    return true;
  });
  if (!moi.length) return 0;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Diem');
  var tieuDe = tieuDeTab_(sheet);
  var bayGio = new Date();
  var hang = moi.map(function (m) {
    var o = {
      thoiGian: bayGio, email: m.email, loai: m.loai, soDiem: m.soDiem, maHocKy: m.maHocKy || '', soTuan: m.soTuan || '',
      tuanKey: m.tuanKey || '', khoa: m.khoa || '', ghiChu: m.ghiChu || '',
    };
    return tieuDe.map(function (h) { return o[h] === undefined ? '' : o[h]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, hang.length, tieuDe.length).setValues(hang);
  CacheService.getScriptCache().remove('xhcn');
  return moi.length;
}

function tongDiemTheoEmail_() {
  var kq = {};
  docBang_('Diem').forEach(function (r) {
    var e = chuanHoaEmail(r.email);
    kq[e] = (kq[e] || 0) + (Number(r.soDiem) || 0);
  });
  return kq;
}

function diemLuyenTapTuanKey_(email, tuanKey) {
  var tong = 0;
  docBang_('Diem').forEach(function (r) {
    if (r.loai === 'luyen_tap' && r.tuanKey === tuanKey && chuanHoaEmail(r.email) === email) tong += Number(r.soDiem) || 0;
  });
  return tong;
}

// Ghi cả một dòng bằng một lệnh (nhanh hơn ghi từng ô).
function ghiCaDong_(ten, soDong, thayDoi) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  var tieuDe = tieuDeTab_(sheet);
  var hienCo = sheet.getRange(soDong, 1, 1, tieuDe.length).getValues()[0];
  var moi = tieuDe.map(function (h, i) { return thayDoi[h] !== undefined ? thayDoi[h] : hienCo[i]; });
  sheet.getRange(soDong, 1, 1, tieuDe.length).setValues([moi]);
}

// ---------- Dựng nội dung xem lại ----------

function dungXemLai_(ds, traLoi, cauTheoId, tenMon) {
  return ds.map(function (c) {
    var g = cauTheoId[c.id] || {};
    var dungHienThi = 'ABCD'.charAt(c.tt.indexOf(g.dapAn));
    var chon = traLoi && traLoi[c.id] ? traLoi[c.id] : '';
    return {
      id: c.id,
      tenMon: tenMon[g.maMon] || g.maMon,
      maChuong: g.maChuong,
      trangNguon: g.trangNguon,
      noiDung: g.noiDung,
      giaiThich: g.giaiThich,
      dapAn: ['A', 'B', 'C', 'D'].map(function (k, i) { return { k: k, text: g[c.tt.charAt(i)] }; }),
      chon: chon,
      dung: dungHienThi,
      laDung: chon === dungHienThi,
    };
  });
}

function tenMonTheoMa_(maHocKy) {
  var kq = {};
  docBang_('Mon').forEach(function (m) { if (m.maHocKy === maHocKy) kq[m.maMon] = m.tenMon; });
  return kq;
}

// ---------- Luyện tập ngoài sự kiện ----------

function thongTinCapCuaToi_(email, cauHinh) {
  var tong = tongDiemTheoEmail_()[email] || 0;
  return capTuDiem(tong, soDiemMoiLevel_(cauHinh));
}

function luotLuyenTapDangMo_(email) {
  var ds = docBang_('LuyenTap').filter(function (r) { return chuanHoaEmail(r.email) === email && !daNopLuot_(r); });
  return ds.length ? ds[ds.length - 1] : null;
}

function hdLuyenTapThongTin_(email) {
  var hk = hocKyDangMo_();
  var cauHinh = layCauHinh_();
  var tranTuan = Number(cauHinh.diemToiDaLuyenTapTuan) || 120;
  var tuanKey = tuanKeVN(Date.now());
  var daDung = diemLuyenTapTuanKey_(email, tuanKey);
  var dem = {};
  if (hk) {
    docBang_('CauHoi').forEach(function (c) {
      if (c.maHocKy === hk.maHocKy && c.trangThai === 'active' && chuanHoaEmail(c.tacGia) !== email) dem[c.maMon] = (dem[c.maMon] || 0) + 1;
    });
  }
  return {
    cap: thongTinCapCuaToi_(email, cauHinh),
    diemTuanNay: daDung,
    diemToiDaTuan: tranTuan,
    diemMoiLuot: Number(cauHinh.diemMoiLuyenTap) || 20,
    soCauMoiLuot: Number(cauHinh.soCauLuyenTap) || 10,
    mon: hk ? monCuaHocKy_(hk.maHocKy).map(function (m) { return { ma: m.ma, ten: m.ten, mau: m.mau, soCauCoSan: dem[m.ma] || 0 }; }) : [],
    dangMo: !!luotLuyenTapDangMo_(email),
  };
}

function guiLuotLuyenTap_(luot, maHocKy) {
  return {
    trangThai: 'dang_lam',
    maLuot: luot.maLuot,
    cauHoi: dungDeGui_(luot, cauHoiTheoId_(maHocKy)),
  };
}

function hdLuyenTapBat_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cu = luotLuyenTapDangMo_(email);
  if (cu) return guiLuotLuyenTap_(cu, hk.maHocKy);

  var cauHinh = layCauHinh_();
  var maMon = String(body.maMon || '');
  if (monCuaHocKy_(hk.maHocKy).every(function (m) { return m.ma !== maMon; })) throw loi_('mon_sai', 'Môn không hợp lệ.');
  var soCau = Number(cauHinh.soCauLuyenTap) || 10;

  var daGap = {};
  docBang_('LuotThi').concat(docBang_('LuyenTap')).forEach(function (r) {
    if (chuanHoaEmail(r.email) !== email) return;
    jsonAnToan_(r.dsCau, { ds: [] }).ds.forEach(function (c) { daGap[c.id] = true; });
  });
  var pool = docBang_('CauHoi')
    .filter(function (c) { return c.maHocKy === hk.maHocKy && c.maMon === maMon; })
    .map(function (c) { return { id: c.id, maMon: c.maMon, soTuan: Number(c.soTuan), tacGia: c.tacGia, trangThai: c.trangThai }; });
  var chuaGap = pool.filter(function (c) { return !daGap[c.id]; });
  var opts = { email: email, monChon: [maMon], soCauMoiMon: soCau, soTuan: -1 };
  var de = rutDe(chuaGap, opts);
  if (de.ds.length < soCau) de = rutDe(pool, opts); // hết câu mới thì cho làm lại câu đã gặp
  if (de.ds.length === 0) throw loi_('khong_du_cau', 'Môn này chưa có câu hỏi để luyện tập.');

  return voiKhoa_(function () {
    var daMo = luotLuyenTapDangMo_(email);
    if (daMo) return guiLuotLuyenTap_(daMo, hk.maHocKy);
    var maLuot = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    themDong_('LuyenTap', {
      maLuot: maLuot, email: email, batDauLuc: new Date(), maMon: maMon,
      dsCau: JSON.stringify({ ds: de.ds, monChon: [maMon] }), traLoi: '{}', tuanKey: tuanKeVN(Date.now()),
    });
    return guiLuotLuyenTap_(luotLuyenTapDangMo_(email), hk.maHocKy);
  });
}

function hdLuyenTapNop_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cauHinh = layCauHinh_();
  var maLuot = String(body.maLuot || '');
  var luot = docBang_('LuyenTap').filter(function (r) { return r.maLuot === maLuot && chuanHoaEmail(r.email) === email; })[0];
  if (!luot) throw loi_('khong_thay', 'Không tìm thấy lượt luyện tập.');
  var cauTheoId = cauHoiTheoId_(hk.maHocKy);
  var tenMon = tenMonTheoMa_(hk.maHocKy);
  var dl = jsonAnToan_(luot.dsCau, { ds: [] });

  var traVe = function (l, thuong) {
    var tl = jsonAnToan_(l.traLoi, {});
    return {
      soDung: Number(l.soDung), soCau: Number(l.soCau), diem: Number(l.diem), diemThuong: thuong === undefined ? Number(l.diemThuong) : thuong,
      cauHoi: dungXemLai_(dl.ds, tl, cauTheoId, tenMon),
      cap: thongTinCapCuaToi_(email, cauHinh),
    };
  };
  if (daNopLuot_(luot)) return traVe(luot);

  return voiKhoa_(function () {
    var moi = docMotDong_('LuyenTap', luot._dong);
    if (daNopLuot_(moi)) return traVe(moi);
    var traLoi = lamSachTraLoi_(body.traLoi, dl.ds);
    var dapAn = {};
    dl.ds.forEach(function (c) { dapAn[c.id] = cauTheoId[c.id] ? cauTheoId[c.id].dapAn : ''; });
    var kq = chamBai(dl.ds, traLoi, dapAn);
    var daTraLoi = Object.keys(traLoi).length;
    var hopLe = kq.soCau > 0 && daTraLoi / kq.soCau >= (Number(cauHinh.luyenTapToiThieuTraLoi) || 0);

    var tuanKey = tuanKeVN(Date.now());
    var diemMoi = Number(cauHinh.diemMoiLuyenTap) || 20;
    var tran = Number(cauHinh.diemToiDaLuyenTapTuan) || 120;
    var thuong = hopLe ? diemThuongLuyenTap(diemLuyenTapTuanKey_(email, tuanKey), diemMoi, tran) : 0;

    ghiCaDong_('LuyenTap', moi._dong, {
      nopLuc: new Date(), traLoi: JSON.stringify(traLoi), soDung: kq.soDung, soCau: kq.soCau,
      diem: diemCaNhan(kq.soDung, kq.soCau), diemThuong: thuong, tuanKey: tuanKey,
    });
    if (thuong > 0) {
      themDiemNhieu_([{ email: email, loai: 'luyen_tap', soDiem: thuong, tuanKey: tuanKey, khoa: 'lt:' + maLuot, ghiChu: moi.maMon }]);
    }
    ghiNhatKy_(email, 'nopLuyenTap', maLuot, { soDung: kq.soDung, soCau: kq.soCau, thuong: thuong });
    var xong = docMotDong_('LuyenTap', moi._dong);
    return traVe(xong, thuong);
  });
}

// ---------- Thưởng cuối tuần: điểm nhóm và danh hiệu cá nhân ----------

function traoThuongTuan_(hk, t, bang) {
  var cauHinh = layCauHinh_();
  var bangDiem = docBangDiemNhom(cauHinh.diemThuongNhom);
  var active = {};
  docBang_('ThanhVien').forEach(function (x) { if (x.trangThai === 'active') active[chuanHoaEmail(x.email)] = x; });
  var luot = {};
  docBang_('LuotThi').forEach(function (r) {
    if (r.maHocKy === hk.maHocKy && Number(r.soTuan) === t.soTuan && daNopLuot_(r)) luot[chuanHoaEmail(r.email)] = r;
  });
  var mien = {};
  docBang_('Mien').forEach(function (m) { if (m.maHocKy === hk.maHocKy && Number(m.soTuan) === t.soTuan) mien[chuanHoaEmail(m.email)] = true; });
  var lienKet = docBang_('NhomThanhVien').filter(function (r) { return r.maHocKy === hk.maHocKy; });
  var tuanKey = tuanKeVN(t.dongCua);

  var cacMuc = [];
  bang.forEach(function (n) {
    var diem = diemThuongNhom(n.hang, bangDiem);
    var loai = n.hang === 1 ? 'thuong_nhom_nhat' : n.hang === 2 ? 'thuong_nhom_nhi' : 'thuong_nhom_khac';
    lienKet.filter(function (r) { return r.maNhom === n.maNhom; }).forEach(function (r) {
      var e = chuanHoaEmail(r.email);
      if (!active[e] || mien[e] || !luot[e] || !(diem > 0)) return; // chỉ thành viên đã thi mới được thưởng nhóm
      cacMuc.push({ email: e, loai: loai, soDiem: diem, maHocKy: hk.maHocKy, soTuan: t.soTuan, tuanKey: tuanKey, khoa: 'nhom:' + hk.maHocKy + ':' + t.soTuan + ':' + e, ghiChu: n.tenNhom + ' hạng ' + n.hang });
    });
  });
  var soThuong = themDiemNhieu_(cacMuc);

  // Danh hiệu cá nhân: điểm cao nhất tuần.
  var ungVien = Object.keys(luot).filter(function (e) { return active[e]; }).map(function (e) {
    return { email: e, diem: Number(luot[e].diem), giay: Number(luot[e].giayLam) };
  });
  var thang = chonDanhHieuCaNhan(ungVien);
  xoaDongNeu_('DanhHieu', function (r) { return r.maHocKy === hk.maHocKy && Number(r.soTuan) === t.soTuan; });
  thang.forEach(function (w) {
    themDong_('DanhHieu', { maHocKy: hk.maHocKy, soTuan: t.soTuan, email: w.email, danhHieu: 'Thiên Kiêu Tuần ' + t.soTuan, diem: w.diem, giayLam: w.giay });
  });
  CacheService.getScriptCache().remove('xhcn');
  return { soThuong: soThuong, soDanhHieu: thang.length };
}

// ---------- Xếp hạng cá nhân ----------

function hdXepHangCaNhan_(email) {
  var cache = CacheService.getScriptCache();
  var cu = cache.get('xhcn');
  var chung = cu ? JSON.parse(cu) : null;
  if (!chung) {
    var cauHinh = layCauHinh_();
    var moi = soDiemMoiLevel_(cauHinh);
    var tong = tongDiemTheoEmail_();
    var danhHieu = {};
    docBang_('DanhHieu').forEach(function (d) {
      var e = chuanHoaEmail(d.email);
      (danhHieu[e] = danhHieu[e] || []).push({ soTuan: Number(d.soTuan), danhHieu: d.danhHieu, diem: Number(d.diem) });
    });
    var ds = [];
    docBang_('ThanhVien').forEach(function (t) {
      if (t.trangThai !== 'active') return;
      var e = chuanHoaEmail(t.email);
      ds.push({ email: e, hoTen: t.hoTen, tong: tong[e] || 0 });
    });
    var bang = xepHangCaNhan(ds).map(function (x) {
      var c = capTuDiem(x.tong, moi);
      return { email: x.email, hoTen: x.hoTen, hang: x.hang, tong: x.tong, level: c.level, tenCapLon: c.tenCapLon, soDanhHieu: (danhHieu[x.email] || []).length };
    });
    var moiNhat = 0;
    Object.keys(danhHieu).forEach(function (e) { danhHieu[e].forEach(function (d) { if (d.soTuan > moiNhat) moiNhat = d.soTuan; }); });
    var vinhDanh = null;
    if (moiNhat) {
      var nguoi = [];
      Object.keys(danhHieu).forEach(function (e) {
        danhHieu[e].forEach(function (d) {
          if (d.soTuan === moiNhat) {
            var x = ds.filter(function (y) { return y.email === e; })[0];
            nguoi.push({ hoTen: x ? x.hoTen : e, diem: d.diem, danhHieu: d.danhHieu });
          }
        });
      });
      if (nguoi.length) vinhDanh = { soTuan: moiNhat, nguoi: nguoi };
    }
    chung = { bang: bang, vinhDanh: vinhDanh, diemMoiLevel: moi };
    cache.put('xhcn', JSON.stringify(chung), 10);
  }
  var toi = chung.bang.filter(function (x) { return x.email === email; })[0] || null;
  var capToi = capTuDiem(toi ? toi.tong : 0, chung.diemMoiLevel);
  var danhHieuToi = docBang_('DanhHieu').filter(function (d) { return chuanHoaEmail(d.email) === email; })
    .map(function (d) { return { soTuan: Number(d.soTuan), danhHieu: d.danhHieu, diem: Number(d.diem) }; });
  // Không trả email của người khác về trình duyệt.
  return {
    bang: chung.bang.map(function (x) {
      return { hang: x.hang, hoTen: x.hoTen, tong: x.tong, level: x.level, tenCapLon: x.tenCapLon, soDanhHieu: x.soDanhHieu, laToi: x.email === email };
    }),
    vinhDanh: chung.vinhDanh,
    toi: { hang: toi ? toi.hang : null, cap: capToi, danhHieu: danhHieuToi },
  };
}
