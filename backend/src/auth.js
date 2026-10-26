// Xác minh ID token của Google và chặn cổng theo tab ThanhVien.

var THOI_GIAN_CACHE_TOKEN_ = 50 * 60; // giây

// Trả về email đã xác minh, hoặc ném lỗi token_expired / unauthorized.
function xacMinhToken_(idToken) {
  if (!idToken) throw loi_('unauthorized', 'Chưa đăng nhập.');
  var cache = CacheService.getScriptCache();
  var khoaCache = 'tok_' + bamHex_(idToken);
  var daCo = cache.get(khoaCache);
  if (daCo) return daCo;

  var clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) throw loi_('cau_hinh', 'Chưa đặt GOOGLE_CLIENT_ID trong Script Properties.');

  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw loi_('token_expired', 'Phiên đăng nhập hết hạn.');

  var t = JSON.parse(res.getContentText());
  if (t.aud !== clientId) throw loi_('unauthorized', 'Token không dành cho ứng dụng này.');
  if (String(t.email_verified) !== 'true') throw loi_('unauthorized', 'Email chưa được Google xác minh.');
  var conLai = Number(t.exp) - Math.floor(Date.now() / 1000);
  if (!(conLai > 0)) throw loi_('token_expired', 'Phiên đăng nhập hết hạn.');

  var email = chuanHoaEmail(t.email);
  cache.put(khoaCache, email, Math.min(THOI_GIAN_CACHE_TOKEN_, conLai));
  return email;
}

// Tìm thành viên theo email. Trả null nếu không có.
function timThanhVien_(email) {
  var ds = docBang_('ThanhVien');
  for (var i = 0; i < ds.length; i++) {
    if (chuanHoaEmail(ds[i].email) === email) return ds[i];
  }
  return null;
}

// Cổng chính: phải là thành viên đang active.
function canThanhVienActive_(email) {
  var tv = timThanhVien_(email);
  if (!tv || tv.trangThai !== 'active') throw loi_('chua_duyet', 'Email này chưa được duyệt, liên hệ lớp trưởng.');
  return tv;
}

function canVaiTro_(tv, cacVaiTro) {
  if (cacVaiTro.indexOf(tv.vaiTro) === -1) throw loi_('cam', 'Bạn không có quyền làm việc này.');
}
