// Phiên đăng nhập dài hạn: sau khi xác minh Google một lần, máy chủ cấp một mã ngẫu nhiên
// để trình duyệt nhớ đăng nhập. Chỉ lưu bản băm của mã. Thành viên bị gỡ vẫn mất quyền ngay,
// vì mỗi yêu cầu đều kiểm tra lại tab ThanhVien.

var SO_NGAY_PHIEN_ = 30;
var GIAY_CACHE_PHIEN_ = 6 * 3600;

function hdDangNhap_(email) {
  var ma = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  var bam = bamHex_(ma);
  var bayGio = Date.now();
  var hetHan = bayGio + SO_NGAY_PHIEN_ * 86400000;
  voiKhoa_(function () {
    themDong_('PhienDangNhap', { hashPhien: bam, email: email, taoLuc: new Date(bayGio), hetHan: new Date(hetHan) });
  });
  CacheService.getScriptCache().put('ph_' + bam, email, GIAY_CACHE_PHIEN_);
  return { phien: ma, hetHan: hetHan };
}

function emailTuPhien_(ma) {
  var bam = bamHex_(String(ma));
  var cache = CacheService.getScriptCache();
  var daCo = cache.get('ph_' + bam);
  if (daCo) return daCo;
  var bayGio = Date.now();
  var ds = docBang_('PhienDangNhap');
  for (var i = 0; i < ds.length; i++) {
    if (ds[i].hashPhien === bam) {
      if (msCua_(ds[i].hetHan) < bayGio) break;
      var email = chuanHoaEmail(ds[i].email);
      cache.put('ph_' + bam, email, GIAY_CACHE_PHIEN_);
      return email;
    }
  }
  throw loi_('phien_het_han', 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.');
}

function hdDangXuat_(email, tv, body) {
  var bam = bamHex_(String(body.phien || ''));
  CacheService.getScriptCache().remove('ph_' + bam);
  voiKhoa_(function () {
    xoaDongNeu_('PhienDangNhap', function (r) { return r.hashPhien === bam; });
  });
  return { daDangXuat: true };
}

// Xóa phiên hết hạn (gọi từ trigger định kỳ).
function donPhienHetHan_() {
  var bayGio = Date.now();
  xoaDongNeu_('PhienDangNhap', function (r) { return msCua_(r.hetHan) < bayGio; });
}
