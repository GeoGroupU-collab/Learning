// Tiện ích dùng chung cho Apps Script: đọc ghi Sheet, cấu hình, nhật ký.

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function loi_(ma, thongBao) {
  var e = new Error(thongBao || ma);
  e.ma = ma;
  return e;
}

// Bộ nhớ theo từng yêu cầu: mỗi tab chỉ đọc từ Sheet một lần trong một lần chạy, các lần sau lấy từ bộ nhớ.
// Mọi hàm ghi (themDong_, suaDong_, xoaDongNeu_...) tự làm mới tab đó. datLaiBoNho_() xóa hết, gọi đầu mỗi
// yêu cầu và ngay sau khi lấy được khóa (vì lúc chờ khóa có thể người khác đã ghi).
var BO_NHO_ = { bang: {}, tieuDe: {} };

// Các tab nhỏ, ít đổi, được cache thêm 30 giây giữa các yêu cầu. Sửa tay trong Sheet có hiệu lực sau tối đa 30 giây.
var TAB_CACHE_ = { CauHinh: true, HocKy: true, Mon: true, Tuan: true };
var GIAY_CACHE_TAB_ = 30;

function datLaiBoNho_() {
  BO_NHO_ = { bang: {}, tieuDe: {} };
}

function lamMoiBang_(ten) {
  delete BO_NHO_.bang[ten];
  if (ten === 'CauHoi') {
    // Đổi số phiên bản để các bản lưu tạm suy ra từ tab này (xem demCauNopTheoTuan_) tự hết hiệu lực.
    try { CacheService.getScriptCache().put('pb_CauHoi', String(Date.now()) + '.' + Math.floor(Math.random() * 1e6), 21600); } catch (e) { /* bỏ qua */ }
  }
  if (TAB_CACHE_[ten]) {
    try { CacheService.getScriptCache().remove('bang_' + ten); } catch (e) { /* bỏ qua */ }
  }
}

function xoaCacheTab_() {
  var cache = CacheService.getScriptCache();
  Object.keys(TAB_CACHE_).forEach(function (t) { cache.remove('bang_' + t); });
}

// Đọc cả tab thành mảng đối tượng, mỗi đối tượng có thêm _dong (số dòng trong Sheet).
function docBang_(ten) {
  var coSan = BO_NHO_.bang[ten];
  if (coSan) return coSan.slice();
  var kq = null;
  if (TAB_CACHE_[ten]) {
    try {
      var c = CacheService.getScriptCache().get('bang_' + ten);
      if (c) kq = JSON.parse(c);
    } catch (e) { kq = null; }
  }
  if (!kq) {
    kq = docBangTho_(ten);
    if (TAB_CACHE_[ten]) {
      try {
        var chuoi = JSON.stringify(kq);
        if (chuoi.length < 90000) CacheService.getScriptCache().put('bang_' + ten, chuoi, GIAY_CACHE_TAB_);
      } catch (e) { /* cache đầy hoặc lỗi thì bỏ qua */ }
    }
  }
  BO_NHO_.bang[ten] = kq;
  return kq.slice();
}

function docBangTho_(ten) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  if (!sheet) throw loi_('thieu_tab', 'Thiếu tab ' + ten + '. Hãy chạy khoiTao().');
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var gt = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var tieuDe = gt[0];
  var kq = [];
  for (var i = 1; i < gt.length; i++) {
    var o = { _dong: i + 1 };
    for (var c = 0; c < tieuDe.length; c++) o[tieuDe[c]] = gt[i][c];
    kq.push(o);
  }
  return kq;
}

function tieuDeTab_(sheet) {
  var ten = sheet.getName();
  if (BO_NHO_.tieuDe[ten]) return BO_NHO_.tieuDe[ten].slice();
  var lastCol = sheet.getLastColumn();
  var tieuDe = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  BO_NHO_.tieuDe[ten] = tieuDe;
  return tieuDe.slice();
}

function themDong_(ten, obj) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  var tieuDe = tieuDeTab_(sheet);
  sheet.appendRow(tieuDe.map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
  lamMoiBang_(ten);
}

// Sửa một dòng bằng một lần đọc và một lần ghi (nhanh hơn ghi từng ô).
function suaDong_(ten, soDong, thayDoi) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  var tieuDe = tieuDeTab_(sheet);
  var hienCo = sheet.getRange(soDong, 1, 1, tieuDe.length).getValues()[0];
  var moi = tieuDe.map(function (h, i) { return thayDoi[h] !== undefined ? thayDoi[h] : hienCo[i]; });
  sheet.getRange(soDong, 1, 1, tieuDe.length).setValues([moi]);
  lamMoiBang_(ten);
}

// Xóa các dòng thỏa điều kiện (xóa từ dưới lên để số dòng không lệch).
function xoaDongNeu_(ten, dieuKien) {
  var cacDong = docBang_(ten).filter(dieuKien).map(function (o) { return o._dong; });
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  cacDong.sort(function (a, b) { return b - a; }).forEach(function (d) { sheet.deleteRow(d); });
  if (cacDong.length) lamMoiBang_(ten);
  return cacDong.length;
}

function layCauHinh_() {
  var kq = {};
  docBang_('CauHinh').forEach(function (r) { kq[r.khoa] = r.giaTri; });
  return kq;
}

function hocKyDangMo_() {
  var ds = docBang_('HocKy').filter(function (h) { return h.trangThai === 'mo'; });
  return ds.length ? ds[0] : null;
}

function ghiNhatKy_(email, hanhDong, doiTuong, chiTiet) {
  themDong_('NhatKy', {
    thoiGian: new Date(),
    email: email,
    hanhDong: hanhDong,
    doiTuong: doiTuong || '',
    chiTiet: typeof chiTiet === 'string' ? chiTiet : JSON.stringify(chiTiet || ''),
  });
}

function bamHex_(chuoi) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, chuoi, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// Chống ghi đồng thời. Hết 20 giây không lấy được khóa thì báo bận.
function voiKhoa_(viec) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw loi_('ban', 'Hệ thống đang bận, thử lại sau vài giây.');
  datLaiBoNho_(); // trong lúc chờ khóa có thể đã có người ghi, nên đọc lại từ đầu
  try {
    return viec();
  } finally {
    lock.releaseLock();
  }
}

// Đọc đúng một dòng của tab theo số dòng (nhanh hơn đọc cả tab).
function docMotDong_(ten, soDong) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  var lastCol = sheet.getLastColumn();
  var tieuDe = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var gt = sheet.getRange(soDong, 1, 1, lastCol).getValues()[0];
  var o = { _dong: soDong };
  for (var i = 0; i < tieuDe.length; i++) o[tieuDe[i]] = gt[i];
  return o;
}
