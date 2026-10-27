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
    return hangAnToan_(tieuDe.map(function (h) { return o[h] === undefined ? '' : o[h]; }));
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, hang.length, tieuDe.length).setValues(hang);
  lamMoiBang_('Diem');
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

function diemTaoDeTuanKey_(email, tuanKey) {
  var tong = 0;
  docBang_('Diem').forEach(function (r) {
    if (r.loai === 'tao_de' && r.tuanKey === tuanKey && chuanHoaEmail(r.email) === email) tong += Number(r.soDiem) || 0;
  });
  return tong;
}

// Giữ tên cũ cho các nơi đang gọi; suaDong_ đã ghi cả dòng bằng một lệnh.
function ghiCaDong_(ten, soDong, thayDoi) {
  suaDong_(ten, soDong, thayDoi);
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

// ---------- Tạo đề tự luyện (chọn môn, chọn chương, 30 câu từ ngân hàng) ----------

function thongTinCapCuaToi_(email, cauHinh) {
  var tong = tongDiemTheoEmail_()[email] || 0;
  return capTuDiem(tong, soDiemMoiLevel_(cauHinh));
}

function luotTaoDeDangMo_(email) {
  var ds = docBang_('DeTuTao').filter(function (r) { return chuanHoaEmail(r.email) === email && !daNopLuot_(r); });
  return ds.length ? ds[ds.length - 1] : null;
}

// Các câu có thể dùng để tạo đề cho một người: đang dùng, không phải câu của chính họ.
function cauDungDuocChoDe_(maHocKy, email) {
  var bayGio = Date.now();
  var tuanChuaDong = {};
  if (String(layCauHinh_().anCauTuanChuaDong).toLowerCase() !== 'false') {
    docTuan_(maHocKy).forEach(function (t) { if (bayGio <= t.dongCua) tuanChuaDong[t.soTuan] = true; });
  }
  return docBang_('CauHoi').filter(function (c) {
    return c.maHocKy === maHocKy && c.trangThai === 'active' && chuanHoaEmail(c.tacGia) !== email && !tuanChuaDong[Number(c.soTuan)];
  });
}

// Danh sách chương của một môn kèm số câu. Nếu chủ chưa nhập danh sách chương thì lấy các giá trị chương
// đang có trong ngân hàng của môn đó.
function chuongCuaMon_(mon, cauCuaMon) {
  var dem = {};
  cauCuaMon.forEach(function (c) {
    var k = chuanHoaChu(c.maChuong);
    if (k !== '') dem[k] = (dem[k] || 0) + 1;
  });
  if (mon.chuong && mon.chuong.length) {
    return mon.chuong.map(function (x) { return { ma: x.ma, ten: x.ten, soCau: dem[chuanHoaChu(x.ma)] || 0 }; });
  }
  var thay = {};
  var kq = [];
  cauCuaMon.forEach(function (c) {
    var k = chuanHoaChu(c.maChuong);
    if (k === '' || thay[k]) return;
    thay[k] = true;
    kq.push({ ma: String(c.maChuong).trim(), ten: String(c.maChuong).trim(), soCau: dem[k] });
  });
  return kq.sort(function (a, b) { return a.ten < b.ten ? -1 : 1; });
}

// Khóa tự tạo đề: chưa nộp đủ câu hỏi của tuần hiện tại thì chưa được tạo đề. Chủ, người được miễn tuần, tuần chưa có lịch thì không khóa.
function khoaTaoDe_(email, tv, hk) {
  var khong = { bi: false, daNop: 0, can: 0, soTuan: 0 };
  if (!hk || (tv && tv.vaiTro === 'owner')) return khong;
  var cauHinh = layCauHinh_();
  if (String(cauHinh.khoaTaoDeKhiChuaNop).toLowerCase() === 'false') return khong;
  var t = chonTuanHienTai(docTuan_(hk.maHocKy), Date.now());
  if (!t) return khong;
  if (mienCuaEmail_(hk.maHocKy, email).some(function (m) { return Number(m.soTuan) === t.soTuan; })) return { bi: false, daNop: 0, can: 0, soTuan: t.soTuan, mien: true };
  var can = (Number(cauHinh.soMonNopCauHoi) || 3) * (Number(cauHinh.soCauNopMoiMon) || 5);
  var daNop = demCauNopTheoTuan_(hk.maHocKy, t.soTuan)[email] || 0;
  return { bi: daNop < can, daNop: daNop, can: can, soTuan: t.soTuan };
}

function hdTaoDeThongTin_(email, tv) {
  var hk = hocKyDangMo_();
  var cauHinh = layCauHinh_();
  var tranTuan = Number(cauHinh.diemToiDaDeTuTaoTuan) || 120;
  var tuanKey = tuanKeVN(Date.now());
  var daDung = diemTaoDeTuanKey_(email, tuanKey);
  var mon = [];
  if (hk) {
    var pool = cauDungDuocChoDe_(hk.maHocKy, email);
    mon = monCuaHocKy_(hk.maHocKy).map(function (m) {
      var cauMon = pool.filter(function (c) { return c.maMon === m.ma; });
      return { ma: m.ma, ten: m.ten, mau: m.mau, soCau: cauMon.length, chuong: chuongCuaMon_(m, cauMon) };
    });
  }
  return {
    cap: thongTinCapCuaToi_(email, cauHinh),
    diemTuanNay: daDung,
    diemToiDaTuan: tranTuan,
    diemMoiDe: Number(cauHinh.diemMoiDeTuTao) || 20,
    soCauMoiDe: Number(cauHinh.soCauDeTuTao) || 30,
    soCauToiThieu: Number(cauHinh.soCauToiThieuDeTuTao) || 10,
    mon: mon,
    dePhatHanh: dePhatHanhChoToi_(email, hk),
    dangMo: !!luotTaoDeDangMo_(email),
    khoa: khoaTaoDe_(email, tv, hk),
  };
}

// Các đề do chủ phát hành kèm trạng thái đã làm của người này.
function dePhatHanhChoToi_(email, hk) {
  if (!hk) return [];
  var cauTheoId = cauHoiTheoId_(hk.maHocKy);
  var daLam = {};
  docBang_('DeTuTao').forEach(function (r) {
    if (r.idDe && chuanHoaEmail(r.email) === email && daNopLuot_(r) && (!daLam[r.idDe] || Number(r.diem) > daLam[r.idDe].diem)) {
      daLam[r.idDe] = { diem: Number(r.diem), soDung: Number(r.soDung), soCau: Number(r.soCau) };
    }
  });
  return docBang_('DeThi').filter(function (d) { return d.trangThai === 'phat_hanh'; }).map(function (d) {
    var ids = jsonAnToan_(d.dsIdCau, []);
    var conLai = ids.filter(function (id) { return cauTheoId[id] && cauTheoId[id].trangThai === 'active'; }).length;
    return { idDe: d.idDe, tenDe: d.tenDe, soCau: conLai, daLam: daLam[d.idDe] || null };
  });
}

function guiLuotTaoDe_(luot, maHocKy) {
  var dl = jsonAnToan_(luot.dsCau, { ds: [] });
  var tenDe = '';
  if (luot.idDe) {
    var deP = docBang_('DeThi').filter(function (d) { return d.idDe === luot.idDe; })[0];
    tenDe = 'Đề: ' + (deP ? deP.tenDe : luot.idDe);
  }
  return {
    trangThai: 'dang_lam',
    maLuot: luot.maLuot,
    tenMon: tenDe || tenMonTheoMa_(maHocKy)[luot.maMon] || luot.maMon,
    chuong: jsonAnToan_(luot.chuong, []),
    cauHoi: dungDeGui_(luot, cauHoiTheoId_(maHocKy)),
    soCau: dl.ds.length,
  };
}

function hdTaoDeBat_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cu = luotTaoDeDangMo_(email);
  if (cu) return guiLuotTaoDe_(cu, hk.maHocKy); // đề đang làm dở vẫn được làm tiếp
  var khoa = khoaTaoDe_(email, tv, hk);
  if (khoa.bi) throw loi_('khoa_tao_de', 'Hãy nộp đủ ' + khoa.can + ' câu hỏi của tuần này (mới có ' + khoa.daNop + ') để mở khóa đề luyện tập.');
  if (body.idDe) return batDeDaPhatHanh_(email, hk, String(body.idDe));

  var cauHinh = layCauHinh_();
  var maMon = String(body.maMon || '');
  if (monCuaHocKy_(hk.maHocKy).every(function (m) { return m.ma !== maMon; })) throw loi_('mon_sai', 'Môn không hợp lệ.');
  var soCau = Number(cauHinh.soCauDeTuTao) || 30;
  var toiThieu = Number(cauHinh.soCauToiThieuDeTuTao) || 10;

  var chuongChon = Array.isArray(body.chuong) ? body.chuong.map(function (x) { return chuanHoaChu(x); }).filter(function (x) { return x !== ''; }) : [];
  var chonSet = {};
  chuongChon.forEach(function (k) { chonSet[k] = true; });

  var daGap = {};
  docBang_('LuotThi').concat(docBang_('DeTuTao')).forEach(function (r) {
    if (chuanHoaEmail(r.email) !== email) return;
    jsonAnToan_(r.dsCau, { ds: [] }).ds.forEach(function (c) { daGap[c.id] = true; });
  });
  var pool = cauDungDuocChoDe_(hk.maHocKy, email)
    .filter(function (c) { return c.maMon === maMon && (chuongChon.length === 0 || chonSet[chuanHoaChu(c.maChuong)]); })
    .map(function (c) { return { id: c.id, maMon: c.maMon, soTuan: Number(c.soTuan), tacGia: c.tacGia, trangThai: c.trangThai }; });
  if (pool.length < toiThieu) {
    throw loi_('khong_du_cau', 'Chỉ có ' + pool.length + ' câu phù hợp, cần ít nhất ' + toiThieu + '. Hãy chọn thêm chương hoặc môn khác.');
  }
  var chuaGap = pool.filter(function (c) { return !daGap[c.id]; });
  var opts = { email: email, monChon: [maMon], soCauMoiMon: Math.min(soCau, pool.length), soTuan: -1 };
  var de = rutDe(chuaGap, opts);
  if (de.ds.length < opts.soCauMoiMon) de = rutDe(pool, opts); // hết câu mới thì cho làm lại câu đã gặp

  return voiKhoa_(function () {
    var daMo = luotTaoDeDangMo_(email);
    if (daMo) return guiLuotTaoDe_(daMo, hk.maHocKy);
    var maLuot = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    themDong_('DeTuTao', {
      maLuot: maLuot, email: email, batDauLuc: new Date(), maMon: maMon, chuong: JSON.stringify(Array.isArray(body.chuong) ? body.chuong.slice(0, 60) : []),
      dsCau: JSON.stringify({ ds: de.ds, monChon: [maMon] }), traLoi: '{}', tuanKey: tuanKeVN(Date.now()),
    });
    return guiLuotTaoDe_(luotTaoDeDangMo_(email), hk.maHocKy);
  });
}

// Làm một đề do chủ phát hành: mọi người cùng bộ câu, thứ tự khác nhau.
function batDeDaPhatHanh_(email, hk, idDe) {
  var de = docBang_('DeThi').filter(function (r) { return r.idDe === idDe && r.trangThai === 'phat_hanh'; })[0];
  if (!de) throw loi_('khong_thay', 'Đề không tồn tại hoặc chưa được phát hành.');
  var cauTheoId = cauHoiTheoId_(hk.maHocKy);
  var ids = jsonAnToan_(de.dsIdCau, []).filter(function (id) { return cauTheoId[id] && cauTheoId[id].trangThai === 'active'; });
  if (ids.length < 5) throw loi_('khong_du_cau', 'Đề này không còn đủ câu hợp lệ.');
  var dd = dungDeCoDinh(ids);
  return voiKhoa_(function () {
    var daMo = luotTaoDeDangMo_(email);
    if (daMo) return guiLuotTaoDe_(daMo, hk.maHocKy);
    var maLuot = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    themDong_('DeTuTao', {
      maLuot: maLuot, email: email, batDauLuc: new Date(), maMon: '', chuong: '[]', idDe: idDe,
      dsCau: JSON.stringify({ ds: dd.ds, monChon: [] }), traLoi: '{}', tuanKey: tuanKeVN(Date.now()),
    });
    return guiLuotTaoDe_(luotTaoDeDangMo_(email), hk.maHocKy);
  });
}

// Bỏ đề đang làm dở để tạo đề khác. Không được cộng điểm.
function hdTaoDeHuy_(email) {
  return voiKhoa_(function () {
    var n = xoaDongNeu_('DeTuTao', function (r) { return chuanHoaEmail(r.email) === email && !daNopLuot_(r); });
    return { daHuy: n > 0 };
  });
}

function hdTaoDeNop_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var cauHinh = layCauHinh_();
  var maLuot = String(body.maLuot || '');
  var luot = docBang_('DeTuTao').filter(function (r) { return r.maLuot === maLuot && chuanHoaEmail(r.email) === email; })[0];
  if (!luot) throw loi_('khong_thay', 'Không tìm thấy đề.');
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
    var moi = docMotDong_('DeTuTao', luot._dong);
    if (daNopLuot_(moi)) return traVe(moi);
    var traLoi = lamSachTraLoi_(body.traLoi, dl.ds);
    var dapAn = {};
    dl.ds.forEach(function (c) { dapAn[c.id] = cauTheoId[c.id] ? cauTheoId[c.id].dapAn : ''; });
    var kq = chamBai(dl.ds, traLoi, dapAn);
    var daTraLoi = Object.keys(traLoi).length;
    var hopLe = kq.soCau > 0 && daTraLoi / kq.soCau >= (Number(cauHinh.deTuTaoToiThieuTraLoi) || 0);

    var tuanKey = tuanKeVN(Date.now());
    var diemMoi = Number(cauHinh.diemMoiDeTuTao) || 20;
    var tran = Number(cauHinh.diemToiDaDeTuTaoTuan) || 120;
    var khoaDiem = moi.idDe ? 'dephat:' + moi.idDe + ':' + email : 'td:' + maLuot;
    // Đề do chủ phát hành chỉ được cộng điểm lần làm đầu tiên của mỗi người.
    var daNhan = moi.idDe && docBang_('Diem').some(function (r) { return r.khoa === khoaDiem; });
    var thuong = hopLe && !daNhan ? diemThuongLuyenTap(diemTaoDeTuanKey_(email, tuanKey), diemMoi, tran) : 0;

    ghiCaDong_('DeTuTao', moi._dong, {
      nopLuc: new Date(), traLoi: JSON.stringify(traLoi), soDung: kq.soDung, soCau: kq.soCau,
      diem: diemCaNhan(kq.soDung, kq.soCau), diemThuong: thuong, tuanKey: tuanKey,
    });
    if (thuong > 0) {
      themDiemNhieu_([{ email: email, loai: 'tao_de', soDiem: thuong, tuanKey: tuanKey, khoa: khoaDiem, ghiChu: moi.idDe || moi.maMon }]);
    }
    ghiNhatKy_(email, 'nopDeTuTao', maLuot, { soDung: kq.soDung, soCau: kq.soCau, thuong: thuong });
    return traVe(docMotDong_('DeTuTao', moi._dong), thuong);
  });
}

// ---------- Quản trị danh sách chương ----------

function hdDsMon_() {
  var hk = hocKyDangMo_();
  if (!hk) return { mon: [] };
  var tatCa = docBang_('CauHoi').filter(function (c) { return c.maHocKy === hk.maHocKy && c.trangThai !== 'removed' && c.trangThai !== 'tu_choi'; });
  return {
    mon: monCuaHocKy_(hk.maHocKy).map(function (m) {
      var cauMon = tatCa.filter(function (c) { return c.maMon === m.ma; });
      var giaTri = {};
      cauMon.forEach(function (c) {
        var k = String(c.maChuong || '').trim();
        giaTri[k] = (giaTri[k] || 0) + 1;
      });
      return {
        ma: m.ma, ten: m.ten, mau: m.mau, chuong: m.chuong, soCau: cauMon.length,
        giaTriTrongNganHang: Object.keys(giaTri).sort().map(function (k) { return { giaTri: k, soCau: giaTri[k] }; }),
      };
    }),
  };
}

function hdLuuChuong_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var ten = Array.isArray(body.chuong) ? body.chuong : [];
  if (ten.length > 60) throw loi_('qua_nhieu', 'Tối đa 60 chương mỗi môn.');
  return voiKhoa_(function () {
    var dong = docBang_('Mon').filter(function (m) { return m.maHocKy === hk.maHocKy && m.maMon === String(body.maMon || ''); })[0];
    if (!dong) throw loi_('khong_thay', 'Không tìm thấy môn.');
    var cu = jsonAnToan_(dong.danhSachChuong, []);
    var maCu = {};
    cu.forEach(function (c) { maCu[chuanHoaChu(c.ten)] = c.ma; });
    var daDung = {};
    var moi = [];
    ten.forEach(function (x) {
      var t = String(typeof x === 'string' ? x : (x && x.ten) || '').replace(/\s+/g, ' ').trim();
      if (!t) return;
      if (t.length > 80) throw loi_('ten_dai', 'Tên chương tối đa 80 ký tự.');
      var khoa = chuanHoaChu(t);
      if (daDung[khoa]) return;
      daDung[khoa] = true;
      moi.push({ ten: t, ma: maCu[khoa] || null });
    });
    // Chương mới được cấp mã c1, c2... không trùng mã đang có.
    var dungMa = {};
    moi.forEach(function (c) { if (c.ma) dungMa[c.ma] = true; });
    var dem = 0;
    moi.forEach(function (c) {
      if (c.ma) return;
      do { dem++; } while (dungMa['c' + dem]);
      c.ma = 'c' + dem;
      dungMa[c.ma] = true;
    });
    suaDong_('Mon', dong._dong, { danhSachChuong: JSON.stringify(moi) });
    ghiNhatKy_(email, 'luuChuong', body.maMon, { soChuong: moi.length });
    return { chuong: moi };
  });
}

// Đổi giá trị chương của các câu hỏi trong ngân hàng (dùng để gộp các cách gõ tự do vào chương chuẩn).
function hdDoiChuongCau_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var tu = chuanHoaChu(body.tu);
  var den = String(body.den == null ? '' : body.den).trim();
  return voiKhoa_(function () {
    var n = 0;
    docBang_('CauHoi').forEach(function (c) {
      if (c.maHocKy === hk.maHocKy && c.maMon === String(body.maMon || '') && chuanHoaChu(c.maChuong) === tu) {
        suaDong_('CauHoi', c._dong, { maChuong: den });
        n++;
      }
    });
    ghiNhatKy_(email, 'doiChuongCau', body.maMon, { tu: body.tu, den: den, soCau: n });
    return { soCau: n };
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
