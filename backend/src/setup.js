// Khởi tạo Google Sheet. Chạy lại bao nhiêu lần cũng an toàn: không xóa dữ liệu,
// chỉ tạo tab còn thiếu, thêm cột còn thiếu và thêm khóa cấu hình còn thiếu.

function khoiTao() {
  datLaiBoNho_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var baoCao = [];

  TABS.forEach(function (tab) {
    baoCao.push(taoHoacBoSungTab_(ss, tab));
  });

  baoCao.push(themCauHinhConThieu_(ss));
  baoCao.push(themHocKyVaMonMau_(ss));
  baoCao.push(themChuVaoThanhVien_(ss));
  xoaTrangTinhMacDinh_(ss);
  datLaiBoNho_();
  xoaCacheTab_();

  var noiDung = baoCao.join('\n');
  Logger.log(noiDung);
  return noiDung;
}

function taoHoacBoSungTab_(ss, tab) {
  var sheet = ss.getSheetByName(tab.name);
  var daTao = false;
  if (!sheet) {
    sheet = ss.insertSheet(tab.name);
    daTao = true;
  }
  var soCot = sheet.getLastColumn();
  var hienCo = soCot > 0 ? sheet.getRange(1, 1, 1, soCot).getValues()[0] : [];
  var thieu = tab.headers.filter(function (h) { return hienCo.indexOf(h) === -1; });
  if (thieu.length > 0) {
    sheet.getRange(1, hienCo.length + 1, 1, thieu.length).setValues([thieu]);
    sheet.getRange(1, 1, 1, hienCo.length + thieu.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  if (daTao) return 'Đã tạo tab ' + tab.name;
  if (thieu.length > 0) return 'Đã thêm cột ' + thieu.join(', ') + ' vào tab ' + tab.name;
  return 'Tab ' + tab.name + ' đã đủ';
}

function themCauHinhConThieu_(ss) {
  var sheet = ss.getSheetByName('CauHinh');
  var lastRow = sheet.getLastRow();
  var cacKhoa = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  var moi = CAU_HINH_MAC_DINH.filter(function (d) { return cacKhoa.indexOf(d[0]) === -1; });
  if (moi.length > 0) {
    sheet.getRange(lastRow + 1, 1, moi.length, 3).setValues(moi);
  }
  return 'CauHinh: thêm ' + moi.length + ' khóa mới';
}

function themHocKyVaMonMau_(ss) {
  var hocKy = ss.getSheetByName('HocKy');
  var mon = ss.getSheetByName('Mon');
  var thongBao = [];
  if (hocKy.getLastRow() < 2) {
    hocKy.appendRow([HOC_KY_MAU.maHocKy, HOC_KY_MAU.tenHocKy, '', '', 'mo']);
    thongBao.push('Đã thêm học kỳ ' + HOC_KY_MAU.maHocKy);
  }
  if (mon.getLastRow() < 2) {
    MON_MAU.forEach(function (m) {
      mon.appendRow([HOC_KY_MAU.maHocKy, m.maMon, m.tenMon, m.mau, '[]']);
    });
    thongBao.push('Đã thêm ' + MON_MAU.length + ' môn mẫu (chương để trống, điền sau)');
  }
  return thongBao.length ? thongBao.join('; ') : 'HocKy và Mon đã có dữ liệu, giữ nguyên';
}

// Email chủ lấy từ Script Property OWNER_EMAIL, không ghi trong mã nguồn.
function themChuVaoThanhVien_(ss) {
  var email = (PropertiesService.getScriptProperties().getProperty('OWNER_EMAIL') || '').trim().toLowerCase();
  if (!email) return 'Chưa đặt OWNER_EMAIL trong Script Properties, bỏ qua bước thêm chủ';
  var sheet = ss.getSheetByName('ThanhVien');
  var lastRow = sheet.getLastRow();
  var cacEmail = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); }) : [];
  if (cacEmail.indexOf(email) !== -1) return 'Chủ đã có trong ThanhVien';
  sheet.appendRow([email, 'Lớp trưởng', 'owner', 'active', new Date(), '']);
  return 'Đã thêm chủ vào ThanhVien';
}

function xoaTrangTinhMacDinh_(ss) {
  ['Sheet1', 'Trang tính1', 'Trang tính 1'].forEach(function (ten) {
    var s = ss.getSheetByName(ten);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
}
