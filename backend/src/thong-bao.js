// Thông báo của chủ gửi cho cả lớp, một nhóm hoặc từng người. Chỉ chủ được gửi và xóa.

var THONG_BAO_TOI_DA_ = 60; // số thông báo mới nhất trả về cho mỗi người

function lamSachChu_(s, toiDa) {
  return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, toiDa);
}

// Thông báo mà người này được xem: gửi cả lớp, đúng nhóm của họ, hoặc có tên họ.
function thongBaoCuaEmail_(email) {
  var hk = hocKyDangMo_();
  var nhom = hk ? nhomCuaEmail_(email, hk.maHocKy) : null;
  return docBang_('ThongBao').filter(function (r) {
    if (r.loai === 'all') return true;
    if (r.loai === 'nhom') return !!nhom && r.maHocKy === nhom.maHocKy && r.maNhom === nhom.maNhom;
    if (r.loai === 'nguoi') return String(r.dsEmail || '').split(',').indexOf(email) !== -1;
    return false;
  }).sort(function (a, b) { return Number(b.ngay) - Number(a.ngay); });
}

function thongBaoMoiNhat_(email) {
  var ds = thongBaoCuaEmail_(email);
  return ds.length ? Number(ds[0].ngay) : 0;
}

function hdThongBaoCuaToi_(email) {
  return thongBaoCuaEmail_(email).slice(0, THONG_BAO_TOI_DA_).map(function (r) {
    return { id: r.id, ngay: Number(r.ngay), tieuDe: r.tieuDe, noiDung: r.noiDung, rieng: r.loai !== 'all' };
  });
}

function hdGuiThongBao_(email, tv, body) {
  var tieuDe = lamSachChu_(body.tieuDe, 100);
  var noiDung = lamSachChu_(body.noiDung, 1500);
  if (!tieuDe) throw loi_('thieu_tieu_de', 'Hãy nhập tiêu đề.');
  if (!noiDung) throw loi_('thieu_noi_dung', 'Hãy nhập nội dung.');
  var loai = String(body.loai || 'all');
  if (['all', 'nhom', 'nguoi'].indexOf(loai) === -1) throw loi_('loai_sai', 'Đối tượng chỉ là all, nhom hoặc nguoi.');
  return voiKhoa_(function () {
    var hk = hocKyDangMo_();
    var dong = { id: 'tb-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10), ngay: Date.now(), tieuDe: tieuDe, noiDung: noiDung, loai: loai, maHocKy: hk ? hk.maHocKy : '', maNhom: '', dsEmail: '', nguoiTao: email };
    var soNguoi = 0;
    if (loai === 'nhom') {
      var maNhom = String(body.maNhom || '');
      var coNhom = hk && docBang_('Nhom').some(function (n) { return n.maHocKy === hk.maHocKy && n.maNhom === maNhom; });
      if (!coNhom) throw loi_('nhom_khong_co', 'Không có nhóm này trong học kỳ đang mở.');
      dong.maNhom = maNhom;
    } else if (loai === 'nguoi') {
      var ds = Array.isArray(body.dsEmail) ? body.dsEmail.map(chuanHoaEmail) : [];
      var hopLe = {};
      docBang_('ThanhVien').forEach(function (t) { if (t.trangThai === 'active') hopLe[chuanHoaEmail(t.email)] = true; });
      var chon = [];
      ds.forEach(function (e) { if (hopLe[e] && chon.indexOf(e) === -1) chon.push(e); });
      if (!chon.length) throw loi_('thieu_nguoi', 'Hãy chọn ít nhất một người nhận.');
      if (chon.length > 100) throw loi_('qua_nhieu', 'Tối đa 100 người một thông báo.');
      dong.dsEmail = chon.join(',');
      soNguoi = chon.length;
    }
    themDong_('ThongBao', dong);
    ghiNhatKy_(email, 'guiThongBao', dong.id, { loai: loai, soNguoi: soNguoi });
    return { id: dong.id };
  });
}

// Danh sách cho chủ: kèm mô tả người nhận để biết thông báo đã gửi cho ai.
function hdDsThongBao_() {
  var tenNhom = {};
  docBang_('Nhom').forEach(function (n) { tenNhom[n.maHocKy + '/' + n.maNhom] = n.tenNhom; });
  var ten = dungTenTheoEmail_();
  return docBang_('ThongBao').sort(function (a, b) { return Number(b.ngay) - Number(a.ngay); }).slice(0, 100).map(function (r) {
    var nhan = 'Cả lớp';
    if (r.loai === 'nhom') nhan = 'Nhóm: ' + (tenNhom[r.maHocKy + '/' + r.maNhom] || r.maNhom);
    if (r.loai === 'nguoi') {
      var ds = String(r.dsEmail || '').split(',').filter(Boolean);
      nhan = ds.length <= 3 ? ds.map(function (e) { return ten[e] || e; }).join(', ') : ds.length + ' người';
    }
    return { id: r.id, ngay: Number(r.ngay), tieuDe: r.tieuDe, noiDung: r.noiDung, nguoiNhan: nhan };
  });
}

function hdXoaThongBao_(email, tv, body) {
  return voiKhoa_(function () {
    var dong = docBang_('ThongBao').filter(function (r) { return r.id === String(body.id || ''); }).map(function (r) { return r._dong; });
    if (!dong.length) throw loi_('khong_thay', 'Không tìm thấy thông báo.');
    xoaNhieuDong_('ThongBao', dong);
    ghiNhatKy_(email, 'xoaThongBao', String(body.id), '');
    return { daXoa: true };
  });
}
