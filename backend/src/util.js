// Tiện ích dùng chung cho Apps Script: đọc ghi Sheet, cấu hình, nhật ký.

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function loi_(ma, thongBao) {
  var e = new Error(thongBao || ma);
  e.ma = ma;
  return e;
}

// Đọc cả tab thành mảng đối tượng, mỗi đối tượng có thêm _dong (số dòng trong Sheet).
function docBang_(ten) {
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
  var lastCol = sheet.getLastColumn();
  return lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
}

function themDong_(ten, obj) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  var tieuDe = tieuDeTab_(sheet);
  sheet.appendRow(tieuDe.map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
}

function suaDong_(ten, soDong, thayDoi) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  var tieuDe = tieuDeTab_(sheet);
  Object.keys(thayDoi).forEach(function (khoa) {
    var cot = tieuDe.indexOf(khoa);
    if (cot !== -1) sheet.getRange(soDong, cot + 1).setValue(thayDoi[khoa]);
  });
}

// Xóa các dòng thỏa điều kiện (xóa từ dưới lên để số dòng không lệch).
function xoaDongNeu_(ten, dieuKien) {
  var cacDong = docBang_(ten).filter(dieuKien).map(function (o) { return o._dong; });
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ten);
  cacDong.sort(function (a, b) { return b - a; }).forEach(function (d) { sheet.deleteRow(d); });
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
  try {
    return viec();
  } finally {
    lock.releaseLock();
  }
}
