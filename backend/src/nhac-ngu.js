// Nhắc ngủ: chủ chọn một vài người, từ 23:30 đến 7:00 sáng hôm sau (giờ Việt Nam) nếu người đó đang dùng web thì web hiện lời nhắc.
// Máy chủ không theo dõi gì thêm: chỉ trả "có hiện lời nhắc" khi chính người đó gọi, đúng giờ, và có trong danh sách của chủ.

var NHAC_NGU_LOI_MAC_DINH_ = 'Khuya rồi đó, ngủ đi cục cưng!';

// Phút trong ngày theo giờ Việt Nam (UTC+7, không có giờ mùa hè).
function phutVN_(ms) {
  var d = new Date(ms + 7 * 3600000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function trongGioNgu_(ms) {
  var p = phutVN_(ms);
  return p >= 23 * 60 + 30 || p < 7 * 60;
}

// Ghi một khóa cấu hình: sửa dòng có sẵn hoặc thêm dòng mới.
function datCauHinh_(khoa, giaTri, moTa) {
  var dong = docBang_('CauHinh').filter(function (r) { return r.khoa === khoa; })[0];
  if (dong) suaDong_('CauHinh', dong._dong, { giaTri: giaTri });
  else themDong_('CauHinh', { khoa: khoa, giaTri: giaTri, moTa: moTa || '' });
}

function docNhacNgu_() {
  var c = layCauHinh_();
  return {
    bat: String(c.nhacNguBat).toLowerCase() === 'true',
    emails: String(c.nhacNguEmails || '').split(',').map(function (e) { return chuanHoaEmail(e); }).filter(function (e) { return e !== ''; }),
    loiNhan: lamSachChu_(c.nhacNguLoi, 200) || NHAC_NGU_LOI_MAC_DINH_,
  };
}

// Mỗi người gọi cho chính mình. canHoi: người này có trong danh sách (web chỉ hỏi lại định kỳ khi true). hien: đang trong giờ ngủ.
function hdNhacNgu_(email) {
  var n = docNhacNgu_();
  var trongDs = n.bat && n.emails.indexOf(email) !== -1;
  var bayGio = Date.now();
  return { canHoi: trongDs, hien: trongDs && trongGioNgu_(bayGio), loiNhan: trongDs ? n.loiNhan : '', now: bayGio };
}

function hdNhacNguLay_() {
  var n = docNhacNgu_();
  return { bat: n.bat, emails: n.emails, loiNhan: n.loiNhan };
}

function hdNhacNguLuu_(email, tv, body) {
  var loiNhan = lamSachChu_(body.loiNhan, 200) || NHAC_NGU_LOI_MAC_DINH_;
  var ds = Array.isArray(body.emails) ? body.emails.map(chuanHoaEmail) : [];
  var hopLe = {};
  docBang_('ThanhVien').forEach(function (t) { if (t.trangThai === 'active') hopLe[chuanHoaEmail(t.email)] = true; });
  var chon = [];
  ds.forEach(function (e) { if (hopLe[e] && chon.indexOf(e) === -1) chon.push(e); });
  if (chon.length > 20) throw loi_('qua_nhieu', 'Tối đa 20 người.');
  var bat = body.bat === true;
  if (bat && !chon.length) throw loi_('thieu_nguoi', 'Hãy chọn ít nhất một người để nhắc.');
  return voiKhoa_(function () {
    datCauHinh_('nhacNguBat', bat ? 'TRUE' : 'FALSE', 'Bật nhắc ngủ (23:30 đến 7:00 giờ VN) cho các người trong nhacNguEmails');
    datCauHinh_('nhacNguEmails', chon.join(','), 'Danh sách email được nhắc ngủ, cách nhau bằng dấu phẩy');
    datCauHinh_('nhacNguLoi', loiNhan, 'Lời nhắc ngủ');
    ghiNhatKy_(email, 'nhacNguLuu', '', { bat: bat, soNguoi: chon.length });
    return { bat: bat, emails: chon, loiNhan: loiNhan };
  });
}
