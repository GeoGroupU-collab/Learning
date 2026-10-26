// Sao lưu: mỗi tuần sao chép cả Google Sheet sang một thư mục Drive, giữ 8 bản gần nhất.

var TEN_THU_MUC_SAO_LUU_ = 'Learning Group - Sao luu';
var TIEN_TO_BAN_SAO_ = 'Sao luu ';
var SO_BAN_SAO_LUU_ = 8;

function layThuMucSaoLuu_() {
  var it = DriveApp.getFoldersByName(TEN_THU_MUC_SAO_LUU_);
  return it.hasNext() ? it.next() : DriveApp.createFolder(TEN_THU_MUC_SAO_LUU_);
}

function cacBanSaoLuu_(thuMuc) {
  var ds = [];
  var it = thuMuc.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf(TIEN_TO_BAN_SAO_) === 0) ds.push(f);
  }
  return ds.sort(function (a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
}

// Sao lưu ngay. Cũng là hàm trigger hằng tuần (saoLuuHangTuan).
function saoLuuNgay() {
  var thuMuc = layThuMucSaoLuu_();
  var ten = TIEN_TO_BAN_SAO_ + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HHmm');
  var file = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).makeCopy(ten, thuMuc);
  var ban = cacBanSaoLuu_(thuMuc);
  var daXoa = 0;
  // Chỉ chuyển vào thùng rác các bản cũ do chính hệ thống tạo (tên bắt đầu bằng "Sao luu ").
  ban.slice(SO_BAN_SAO_LUU_).forEach(function (f) { f.setTrashed(true); daXoa++; });
  return { ten: ten, url: file.getUrl(), soBanHienCo: Math.min(ban.length, SO_BAN_SAO_LUU_), daXoa: daXoa };
}

function saoLuuHangTuan() {
  datLaiBoNho_();
  try {
    var kq = saoLuuNgay();
    ghiNhatKy_('he_thong', 'saoLuu', kq.ten, { daXoa: kq.daXoa });
  } catch (e) {
    ghiNhatKy_('he_thong', 'saoLuuLoi', '', String(e && e.message ? e.message : e));
    throw e;
  }
}

function hdSaoLuuNgay_(email) {
  var kq = saoLuuNgay();
  ghiNhatKy_(email, 'saoLuuNgay', kq.ten, '');
  return kq;
}

function hdDsSaoLuu_() {
  var thuMuc = layThuMucSaoLuu_();
  return {
    thuMuc: TEN_THU_MUC_SAO_LUU_,
    url: thuMuc.getUrl(),
    soBanToiDa: SO_BAN_SAO_LUU_,
    ban: cacBanSaoLuu_(thuMuc).map(function (f) { return { ten: f.getName(), ngay: f.getDateCreated().toISOString(), url: f.getUrl() }; }),
  };
}
