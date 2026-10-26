// Báo cáo và công cụ quản trị: bảng điểm, chấm lại tuần, nhật ký.

function hdBangDiem_() {
  var hk = hocKyDangMo_();
  if (!hk) return { tuan: [], nguoi: [], nhom: [] };
  var cauHinh = layCauHinh_();
  var moi = soDiemMoiLevel_(cauHinh);
  var luot = {};
  var cacTuanCoBai = {};
  docBang_('LuotThi').forEach(function (r) {
    if (r.maHocKy !== hk.maHocKy || !daNopLuot_(r)) return;
    var so = Number(r.soTuan);
    cacTuanCoBai[so] = true;
    luot[chuanHoaEmail(r.email) + '#' + so] = Number(r.diem);
  });
  var mienSet = {};
  docBang_('Mien').forEach(function (m) {
    if (m.maHocKy === hk.maHocKy) { mienSet[chuanHoaEmail(m.email) + '#' + Number(m.soTuan)] = true; cacTuanCoBai[Number(m.soTuan)] = true; }
  });
  var tuan = Object.keys(cacTuanCoBai).map(Number).sort(function (a, b) { return a - b; });

  var tenNhom = {};
  docBang_('Nhom').forEach(function (n) { if (n.maHocKy === hk.maHocKy) tenNhom[n.maNhom] = n.tenNhom; });
  var nhomCua = {};
  docBang_('NhomThanhVien').forEach(function (r) { if (r.maHocKy === hk.maHocKy) nhomCua[chuanHoaEmail(r.email)] = tenNhom[r.maNhom] || r.maNhom; });
  var diemCap = tongDiemTheoEmail_();

  var nguoi = [];
  docBang_('ThanhVien').forEach(function (t) {
    if (t.trangThai !== 'active') return;
    var e = chuanHoaEmail(t.email);
    var diemTuan = {};
    var tong = 0;
    var so = 0;
    tuan.forEach(function (so_) {
      var k = e + '#' + so_;
      if (luot[k] !== undefined) { diemTuan[so_] = luot[k]; tong += luot[k]; so++; }
      else diemTuan[so_] = mienSet[k] ? 'mien' : null;
    });
    var c = capTuDiem(diemCap[e] || 0, moi);
    nguoi.push({
      hoTen: t.hoTen, email: e, nhom: nhomCua[e] || '', diemTuan: diemTuan, soTuanThi: so, diemTB: so ? Math.round((tong / so) * 10) / 10 : null,
      tongCapBac: diemCap[e] || 0, level: c.level, tenCapLon: c.tenCapLon,
    });
  });
  nguoi.sort(function (a, b) { return (a.nhom < b.nhom ? -1 : a.nhom > b.nhom ? 1 : 0) || (a.hoTen < b.hoTen ? -1 : 1); });

  var nhom = docBang_('KetQuaTuan').filter(function (r) { return r.maHocKy === hk.maHocKy; }).map(function (r) {
    return { soTuan: Number(r.soTuan), nhom: tenNhom[r.maNhom] || r.maNhom, diem: Number(r.diemNhom), hang: Number(r.hang), soThamGia: Number(r.soThamGia), soTinh: Number(r.soThanhVienTinh) };
  });
  return { tuan: tuan, nguoi: nguoi, nhom: nhom };
}

// Chấm lại một tuần đã chốt: các câu hiện không còn "đang dùng" (tạm loại hoặc xóa sau báo sai) bị loại khỏi
// cả tử số và mẫu số của mọi bài. Tính lại điểm nhóm, hạng, thưởng nhóm và danh hiệu của tuần đó.
function hdChamLaiTuan_(email, tv, body) {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  var soTuan = Number(body.soTuan);
  return voiKhoa_(function () {
    var t = docTuan_(hk.maHocKy).filter(function (x) { return x.soTuan === soTuan; })[0];
    if (!t) throw loi_('khong_thay', 'Không tìm thấy tuần.');
    if (!tuanDaChot_(hk.maHocKy, soTuan)) throw loi_('chua_chot', 'Tuần này chưa được chốt nên chưa chấm lại được.');
    var cauTheoId = cauHoiTheoId_(hk.maHocKy);
    var loaiRa = {};
    var soBaiDoi = 0;
    docBang_('LuotThi').forEach(function (r) {
      if (r.maHocKy !== hk.maHocKy || Number(r.soTuan) !== soTuan || !daNopLuot_(r)) return;
      var dl = jsonAnToan_(r.dsCau, { ds: [] });
      var hopLe = dl.ds.filter(function (c) {
        var ok = cauTheoId[c.id] && cauTheoId[c.id].trangThai === 'active';
        if (!ok) loaiRa[c.id] = true;
        return ok;
      });
      var dapAn = {};
      hopLe.forEach(function (c) { dapAn[c.id] = cauTheoId[c.id].dapAn; });
      var kq = chamBai(hopLe, jsonAnToan_(r.traLoi, {}), dapAn);
      if (kq.soDung !== Number(r.soDung) || kq.soCau !== Number(r.soCau)) {
        suaDong_('LuotThi', r._dong, { soDung: kq.soDung, soCau: kq.soCau, diem: diemCaNhan(kq.soDung, kq.soCau) });
        soBaiDoi++;
      }
    });
    var bang = tinhBangTuan_(hk.maHocKy, soTuan);
    ghiKetQuaTuan_(hk, t, bang);
    xoaDongNeu_('Diem', function (r) {
      return r.maHocKy === hk.maHocKy && Number(r.soTuan) === soTuan && String(r.loai).indexOf('thuong_nhom') === 0;
    });
    traoThuongTuan_(hk, t, bang);
    var cache = CacheService.getScriptCache();
    cache.remove('xh_' + hk.maHocKy);
    cache.remove('xhcn');
    ghiNhatKy_(email, 'chamLaiTuan', hk.maHocKy + '/' + soTuan, { soBaiDoi: soBaiDoi, soCauBiLoai: Object.keys(loaiRa).length });
    return { soBaiDoi: soBaiDoi, soCauBiLoai: Object.keys(loaiRa).length };
  });
}

function hdNhatKy_(email, tv, body) {
  var hanhDong = String(body.hanhDong || '');
  var ai = String(body.email || '').trim().toLowerCase();
  var tuKhoa = String(body.tuKhoa || '').trim().toLowerCase();
  var ds = docBang_('NhatKy').filter(function (r) {
    if (hanhDong && r.hanhDong !== hanhDong) return false;
    if (ai && String(r.email).toLowerCase().indexOf(ai) === -1) return false;
    if (tuKhoa && (String(r.doiTuong) + ' ' + String(r.chiTiet)).toLowerCase().indexOf(tuKhoa) === -1) return false;
    return true;
  });
  var cacHanhDong = {};
  docBang_('NhatKy').forEach(function (r) { cacHanhDong[r.hanhDong] = true; });
  ds.reverse();
  var coTrang = 50;
  var trang = Math.max(1, Number(body.trang) || 1);
  return {
    tong: ds.length, trang: trang, coTrang: coTrang, cacHanhDong: Object.keys(cacHanhDong).sort(),
    dong: ds.slice((trang - 1) * coTrang, trang * coTrang).map(function (r) {
      return { thoiGian: r.thoiGian ? new Date(msCua_(r.thoiGian)).toISOString() : '', email: r.email, hanhDong: r.hanhDong, doiTuong: r.doiTuong, chiTiet: String(r.chiTiet).slice(0, 400) };
    }),
  };
}
