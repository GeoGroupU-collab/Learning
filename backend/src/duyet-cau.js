// Duyệt câu hỏi theo đợt: chờ duyệt, duyệt hoặc từ chối hàng loạt, xuất đợt ra file rà soát, dọn câu bị từ chối.

// ---------- Duyệt câu hỏi theo đợt ----------
// Câu mới nộp ở trạng thái cho_duyet (không vào đề) cho tới khi chủ hoặc trợ lý duyệt. Quy trình theo đợt:
// xuất đợt chờ duyệt ra file, rà soát bên ngoài (trùng, dở, hay), nhập kết quả quay lại, rồi dọn các câu bị từ chối.

function duyetTruoc_(cauHinh) {
  return String(cauHinh.duyetCauHoiTruoc).toLowerCase() !== 'false';
}

function demChoDuyet_(maHocKy) {
  var cache = CacheService.getScriptCache();
  var khoa = 'cd_' + maHocKy + '_' + phienBanCauHoi_();
  var c = cache.get(khoa);
  if (c !== null && c !== undefined) return Number(c);
  var n = docBang_('CauHoi').filter(function (r) { return r.maHocKy === maHocKy && r.trangThai === 'cho_duyet'; }).length;
  try { cache.put(khoa, String(n), 120); } catch (e) { /* bỏ qua */ }
  return n;
}

// Duyệt hoặc từ chối nhiều câu đang chờ duyệt một lượt. Chọn theo danh sách id hoặc theo bộ lọc.
function hdDuyetCau_(email, tv, body) {
  var quyet = String(body.quyetDinh || '');
  if (quyet !== 'duyet' && quyet !== 'tu_choi') throw loi_('quyet_dinh_sai', 'Quyết định chỉ là duyet hoặc tu_choi.');
  var moi = quyet === 'duyet' ? 'active' : 'tu_choi';
  var lyDo = String(body.lyDo || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  var ids = Array.isArray(body.ids) ? body.ids.map(String) : null;
  if (!ids && !body.loc) throw loi_('thieu_dieu_kien', 'Hãy chọn câu cần duyệt.');
  var loc = body.loc || {};
  var tacGia = String(loc.tacGia || '').trim().toLowerCase();
  return voiKhoa_(function () {
    var hk = hocKyDangMo_();
    var ten = dungTenTheoEmail_();
    var tap = {};
    (ids || []).forEach(function (id) { tap[id] = true; });
    var chon = docBang_('CauHoi').filter(function (c) {
      if (c.trangThai !== 'cho_duyet') return false;
      if (ids) return !!tap[c.id];
      if (hk && c.maHocKy !== hk.maHocKy) return false;
      if (loc.soTuan && Number(c.soTuan) !== Number(loc.soTuan)) return false;
      if (loc.maMon && c.maMon !== loc.maMon) return false;
      if (tacGia) {
        var e = chuanHoaEmail(c.tacGia);
        if (e.indexOf(tacGia) === -1 && String(ten[e] || '').toLowerCase().indexOf(tacGia) === -1) return false;
      }
      return true;
    });
    if (chon.length > 3000) throw loi_('qua_nhieu', 'Quá nhiều câu một lượt, hãy lọc bớt.');
    var tt = {};
    var gc = {};
    chon.forEach(function (c) { tt[c._dong] = moi; gc[c._dong] = quyet === 'tu_choi' ? lyDo : ''; });
    datCotNhieuDong_('CauHoi', 'trangThai', tt);
    datCotNhieuDong_('CauHoi', 'ghiChuDuyet', gc);
    ghiNhatKy_(email, quyet === 'duyet' ? 'duyetCau' : 'tuChoiCau', hk ? hk.maHocKy : '', { soCau: chon.length, lyDo: lyDo });
    return { soCau: chon.length, trangThai: moi };
  });
}

// Xuất đợt chờ duyệt để rà soát bên ngoài. Tên tác giả được thay bằng mã (T01, T02...) để file không chứa email.
// kemThamKhao: kèm các câu đã duyệt (không có quyết định) để so trùng với ngân hàng hiện có.
function hdXuatChoDuyet_(email, tv, body) {
  var hk = hocKyDangMo_();
  var maHk = body.maHocKy === '*' ? '' : String(body.maHocKy || (hk ? hk.maHocKy : ''));
  var kemThamKhao = body.kemThamKhao !== false;
  var tatCa = docBang_('CauHoi').filter(function (c) { return !maHk || c.maHocKy === maHk; });
  var cho = tatCa.filter(function (c) { return c.trangThai === 'cho_duyet'; });
  var daCo = kemThamKhao ? tatCa.filter(function (c) { return c.trangThai === 'active' || c.trangThai === 'suspended'; }) : [];
  var maTG = {};
  var dem = 0;
  var maTacGia = function (e) {
    var k = chuanHoaEmail(e);
    if (!maTG[k]) { dem++; maTG[k] = 'T' + (dem < 10 ? '0' : '') + dem; }
    return maTG[k];
  };
  var tenMon = {};
  docBang_('Mon').forEach(function (m) { tenMon[m.maHocKy + '/' + m.maMon] = m.tenMon; });

  var cacCho = cho.map(function (c) {
    return {
      id: c.id, maHocKy: c.maHocKy, soTuan: Number(c.soTuan), maMon: c.maMon, tenMon: tenMon[c.maHocKy + '/' + c.maMon] || c.maMon, maChuong: c.maChuong,
      trangNguon: c.trangNguon, noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich,
      maTacGia: maTacGia(c.tacGia),
    };
  });
  var thamKhao = daCo.map(function (c) {
    return { id: c.id, maMon: c.maMon, maChuong: c.maChuong, noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, maTacGia: maTacGia(c.tacGia) };
  });
  var trung = timCauNghiTrung(cacCho.concat(thamKhao), 0.7);
  var dot = cacCho.map(function (c) {
    var o = {};
    Object.keys(c).forEach(function (k) { o[k] = c[k]; });
    o.nghiTrung = trung[c.id] || [];
    o.quyetDinh = '';
    o.ghiChuDuyet = '';
    return o;
  });
  var soNghiTrung = dot.filter(function (c) { return c.nghiTrung.length; }).length;
  return {
    meta: {
      ngayXuat: new Date().toISOString(), maHocKy: maHk || '(tất cả)', soChoDuyet: dot.length, soThamKhao: thamKhao.length, soNghiTrung: soNghiTrung,
      huongDan: 'Rà soát từng câu trong "cho". Với mỗi câu trả lại: id, quyetDinh ("duyet", "tu_choi" hoặc để trống nếu chưa quyết), ghiChuDuyet (lý do, hiện cho người nộp khi từ chối), ' +
        'và các trường muốn sửa (noiDung, A, B, C, D, dapAn, giaiThich, trangNguon, maChuong). "nghiTrung" là gợi ý tự động các câu giống >= 70% (id kèm độ giống). ' +
        '"thamKhao" là các câu đã duyệt, chỉ để so trùng, không cần trả lại. Nhập file kết quả ở Quản trị, Câu hỏi, Xuất và nhập ngân hàng (có bước xem trước).',
    },
    cho: dot,
    thamKhao: thamKhao,
  };
}

// Xóa hẳn các câu đã bị từ chối khỏi Sheet (sau khi đã lưu file rà soát). Câu từ chối chưa từng vào đề nào nên xóa an toàn.
function hdDonCauTuChoi_(email, tv, body) {
  if (!body.xacNhan) throw loi_('can_xac_nhan', 'Cần xác nhận xóa các câu bị từ chối.');
  return voiKhoa_(function () {
    var bayGio = Date.now();
    var dongCua = {};
    docBang_('Tuan').forEach(function (t) { dongCua[t.maHocKy + '/' + Number(t.soTuan)] = msCua_(t.dongCua); });
    var tuChoi = docBang_('CauHoi').filter(function (c) { return c.trangThai === 'tu_choi'; });
    var xoaDuoc = tuChoi.filter(function (c) {
      var d = dongCua[c.maHocKy + '/' + Number(c.soTuan)];
      return !d || bayGio > d;
    });
    var dong = xoaDuoc.map(function (c) { return c._dong; });
    xoaNhieuDong_('CauHoi', dong);
    ghiNhatKy_(email, 'donCauTuChoi', '', { soCau: dong.length, giuLai: tuChoi.length - dong.length });
    return { soCau: dong.length, giuLai: tuChoi.length - dong.length };
  });
}
