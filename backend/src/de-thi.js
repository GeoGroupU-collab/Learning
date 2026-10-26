// Tạo đề thi từ ngân hàng (chủ): rút theo bộ lọc, lưu, gán làm đề cố định của một tuần, phát hành cho thành viên.

var TRANG_THAI_DE_ = ['nhap', 'phat_hanh', 'luu_tru'];

function idDaDungTrongDe_() {
  var kq = {};
  docBang_('DeThi').forEach(function (d) {
    jsonAnToan_(d.dsIdCau, []).forEach(function (id) { kq[id] = true; });
  });
  return kq;
}

// Các câu đủ điều kiện để đưa vào đề theo bộ lọc của chủ.
function layCauChoDe_(hk, loc) {
  var l = loc || {};
  var tuan = (l.soTuan || []).map(Number);
  var tru = (l.truTacGia || []).map(chuanHoaEmail);
  var daDung = l.tranhDaDung ? idDaDungTrongDe_() : {};
  return docBang_('CauHoi').filter(function (c) {
    return c.maHocKy === hk.maHocKy && c.trangThai === 'active' &&
      (!tuan.length || tuan.indexOf(Number(c.soTuan)) !== -1) &&
      tru.indexOf(chuanHoaEmail(c.tacGia)) === -1 && !daDung[c.id];
  });
}

function hangCauDe_(c, tenMon, tenTacGia) {
  return {
    id: c.id, soTuan: Number(c.soTuan), maMon: c.maMon, tenMon: tenMon[c.maMon] || c.maMon, maChuong: c.maChuong, trangNguon: c.trangNguon,
    noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich,
    tacGia: chuanHoaEmail(c.tacGia), tenTacGia: tenTacGia[chuanHoaEmail(c.tacGia)] || '', trangThai: c.trangThai,
  };
}

function canHocKyMo_() {
  var hk = hocKyDangMo_();
  if (!hk) throw loi_('khong_co_hoc_ky', 'Chưa có học kỳ đang mở.');
  return hk;
}

function hdXemTruocDeThi_(email, tv, body) {
  var hk = canHocKyMo_();
  var phanBo = (Array.isArray(body.phanBo) ? body.phanBo : []).map(function (q) {
    return { maMon: String(q.maMon || ''), chuong: Array.isArray(q.chuong) ? q.chuong.map(String) : [], soCau: Math.max(0, Math.min(200, Number(q.soCau) || 0)) };
  }).filter(function (q) { return q.maMon && q.soCau > 0; });
  if (!phanBo.length) throw loi_('thieu_phan_bo', 'Hãy chọn ít nhất một môn và số câu.');
  var ung = layCauChoDe_(hk, body.loc).map(function (c) { return { id: c.id, maMon: c.maMon, maChuong: c.maChuong }; });
  var kq = rutTheoPhanBo(ung, phanBo);
  var cauTheoId = {};
  docBang_('CauHoi').forEach(function (c) { if (c.maHocKy === hk.maHocKy) cauTheoId[c.id] = c; });
  var tenMon = tenMonTheoMa_(hk.maHocKy);
  var ten = dungTenTheoEmail_();
  return {
    cau: kq.chon.map(function (id) { return hangCauDe_(cauTheoId[id], tenMon, ten); }),
    thieu: kq.thieu,
    soUngVien: ung.length,
  };
}

// Rút thêm một câu thay thế (cùng môn và chương), không trùng các câu đang có trong đề.
function hdThayCauDe_(email, tv, body) {
  var hk = canHocKyMo_();
  var loai = {};
  (Array.isArray(body.loaiTruId) ? body.loaiTruId : []).forEach(function (id) { loai[String(id)] = true; });
  var ung = layCauChoDe_(hk, body.loc).filter(function (c) { return !loai[c.id]; }).map(function (c) { return { id: c.id, maMon: c.maMon, maChuong: c.maChuong }; });
  var kq = rutTheoPhanBo(ung, [{ maMon: String(body.maMon || ''), chuong: Array.isArray(body.chuong) ? body.chuong.map(String) : [], soCau: 1 }]);
  if (!kq.chon.length) return { cau: null };
  var c = docBang_('CauHoi').filter(function (x) { return x.id === kq.chon[0]; })[0];
  return { cau: hangCauDe_(c, tenMonTheoMa_(hk.maHocKy), dungTenTheoEmail_()) };
}

function tuanDangGanDe_(idDe) {
  var hk = hocKyDangMo_();
  if (!hk) return null;
  var t = docTuan_(hk.maHocKy).filter(function (x) { return x.idDe === idDe; })[0];
  return t || null;
}

function hdLuuDeThi_(email, tv, body) {
  var hk = canHocKyMo_();
  var tenDe = String(body.tenDe || '').replace(/\s+/g, ' ').trim();
  if (tenDe.length < 2 || tenDe.length > 80) throw loi_('ten_sai', 'Tên đề dài từ 2 đến 80 ký tự.');
  var ids = Array.isArray(body.dsIdCau) ? body.dsIdCau.map(String) : [];
  var duy = {};
  ids = ids.filter(function (id) { if (duy[id]) return false; duy[id] = true; return true; });
  if (ids.length < 1 || ids.length > 300) throw loi_('so_cau_sai', 'Đề cần từ 1 đến 300 câu.');
  var trangThai = body.trangThai === undefined ? 'nhap' : String(body.trangThai);
  if (TRANG_THAI_DE_.indexOf(trangThai) === -1) throw loi_('trang_thai_sai', 'Trạng thái đề không hợp lệ.');
  return voiKhoa_(function () {
    var cauTheoId = {};
    docBang_('CauHoi').forEach(function (c) { if (c.maHocKy === hk.maHocKy) cauTheoId[c.id] = c; });
    var khongCo = ids.filter(function (id) { return !cauTheoId[id] || cauTheoId[id].trangThai === 'removed'; });
    if (khongCo.length) throw loi_('cau_khong_co', khongCo.length + ' câu không còn trong ngân hàng.');
    var cu = body.idDe ? docBang_('DeThi').filter(function (d) { return d.idDe === String(body.idDe); })[0] : null;
    if (body.idDe && !cu) throw loi_('khong_thay', 'Không tìm thấy đề.');
    if (cu) {
      var gan = tuanDangGanDe_(cu.idDe);
      if (gan && Date.now() >= gan.moCua && JSON.stringify(jsonAnToan_(cu.dsIdCau, [])) !== JSON.stringify(ids)) {
        throw loi_('dang_dung', 'Đề đang được dùng cho sự kiện đã mở cửa, không sửa danh sách câu được.');
      }
      suaDong_('DeThi', cu._dong, { tenDe: tenDe, dsIdCau: JSON.stringify(ids), trangThai: trangThai });
      ghiNhatKy_(email, 'suaDeThi', cu.idDe, { soCau: ids.length, trangThai: trangThai });
      return { idDe: cu.idDe };
    }
    var idMoi = 'de-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    themDong_('DeThi', { idDe: idMoi, tenDe: tenDe, loai: 'tuy_chon', dsIdCau: JSON.stringify(ids), ngayTao: new Date(), trangThai: trangThai });
    ghiNhatKy_(email, 'taoDeThi', idMoi, { soCau: ids.length });
    return { idDe: idMoi };
  });
}

function hdDsDeThi_() {
  var hk = hocKyDangMo_();
  var gan = {};
  if (hk) docTuan_(hk.maHocKy).forEach(function (t) { if (t.idDe) gan[t.idDe] = t.soTuan; });
  return docBang_('DeThi').map(function (d) {
    return {
      idDe: d.idDe, tenDe: d.tenDe, soCau: jsonAnToan_(d.dsIdCau, []).length, trangThai: d.trangThai,
      ngayTao: d.ngayTao ? new Date(msCua_(d.ngayTao)).toISOString() : '', tuanGan: gan[d.idDe] || null,
    };
  }).reverse();
}

// Toàn bộ nội dung một đề (có đáp án) để xem, in và xuất file.
function hdLayDeThi_(email, tv, body) {
  var hk = canHocKyMo_();
  var d = docBang_('DeThi').filter(function (x) { return x.idDe === String(body.idDe || ''); })[0];
  if (!d) throw loi_('khong_thay', 'Không tìm thấy đề.');
  var cauTheoId = {};
  docBang_('CauHoi').forEach(function (c) { if (c.maHocKy === hk.maHocKy) cauTheoId[c.id] = c; });
  var tenMon = tenMonTheoMa_(hk.maHocKy);
  var ten = dungTenTheoEmail_();
  var cau = jsonAnToan_(d.dsIdCau, []).filter(function (id) { return cauTheoId[id]; }).map(function (id) { return hangCauDe_(cauTheoId[id], tenMon, ten); });
  return { idDe: d.idDe, tenDe: d.tenDe, trangThai: d.trangThai, cau: cau };
}

function hdDoiTrangThaiDe_(email, tv, body) {
  var tt = String(body.trangThai || '');
  if (TRANG_THAI_DE_.indexOf(tt) === -1) throw loi_('trang_thai_sai', 'Trạng thái đề không hợp lệ.');
  return voiKhoa_(function () {
    var d = docBang_('DeThi').filter(function (x) { return x.idDe === String(body.idDe || ''); })[0];
    if (!d) throw loi_('khong_thay', 'Không tìm thấy đề.');
    suaDong_('DeThi', d._dong, { trangThai: tt });
    ghiNhatKy_(email, 'doiTrangThaiDe', d.idDe, tt);
    return { idDe: d.idDe, trangThai: tt };
  });
}

// Gán một đề làm đề cố định của một tuần (mọi người thi cùng bộ câu). Chỉ được gán trước giờ mở cửa.
function hdGanDeChoTuan_(email, tv, body) {
  var hk = canHocKyMo_();
  var soTuan = Number(body.soTuan);
  var idDe = String(body.idDe || '');
  return voiKhoa_(function () {
    var t = docTuan_(hk.maHocKy).filter(function (x) { return x.soTuan === soTuan; })[0];
    if (!t) throw loi_('khong_thay', 'Không tìm thấy tuần.');
    if (Date.now() >= t.moCua) throw loi_('da_mo', 'Tuần này đã mở cửa phòng thi, không đổi đề được nữa.');
    if (idDe) {
      var d = docBang_('DeThi').filter(function (x) { return x.idDe === idDe; })[0];
      if (!d) throw loi_('khong_thay', 'Không tìm thấy đề.');
      if (jsonAnToan_(d.dsIdCau, []).length < 5) throw loi_('it_cau', 'Đề cần ít nhất 5 câu.');
    }
    suaDong_('Tuan', t._dong, { idDe: idDe });
    ghiNhatKy_(email, 'ganDeChoTuan', hk.maHocKy + '/' + soTuan, idDe || '(bỏ gán)');
    return { soTuan: soTuan, idDe: idDe };
  });
}
