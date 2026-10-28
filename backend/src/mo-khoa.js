// Chủ mở khóa "tự tạo đề luyện tập" (vốn chỉ mở khi đã nộp đủ câu hỏi của tuần): cho cả lớp trải nghiệm đến hết tuần, hoặc đến khi chủ khóa lại,
// hoặc chỉ mở riêng cho một số người. Nộp câu hỏi vẫn bình thường, không bị ảnh hưởng.

// Thời điểm hết Chủ nhật 23:59:59.999 giờ Việt Nam của tuần chứa mốc ms (tuần tính từ Thứ Hai, giống tuần tính điểm luyện tập).
function cuoiTuanVN_(ms) {
  var d = new Date(ms + 7 * 3600000);
  var thu = (d.getUTCDay() + 6) % 7; // 0 là Thứ Hai, 6 là Chủ nhật
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + (6 - thu), 23, 59, 59, 999) - 7 * 3600000;
}

function docMoKhoa_(cauHinh) {
  var che = String(cauHinh.moKhoaTaoDeCheDo || 'khoa');
  if (['khoa', 'het_tuan', 'tat'].indexOf(che) === -1) che = 'khoa';
  return {
    cheDo: che,
    den: Number(cauHinh.moKhoaTaoDeDen) || 0,
    emails: String(cauHinh.moKhoaTaoDeEmails || '').split(',').map(function (e) { return chuanHoaEmail(e); }).filter(function (e) { return e !== ''; }),
  };
}

// Trả 'rieng' (mở riêng cho người này), 'chung' (mở cho cả lớp) hoặc '' (không mở).
function daMoKhoaTaoDe_(email, cauHinh, bayGio) {
  var m = docMoKhoa_(cauHinh);
  if (m.emails.indexOf(email) !== -1) return 'rieng';
  if (m.cheDo === 'tat') return 'chung';
  if (m.cheDo === 'het_tuan' && bayGio <= m.den) return 'chung';
  return '';
}

function hdMoKhoaLay_() {
  var m = docMoKhoa_(layCauHinh_());
  return { cheDo: m.cheDo, den: m.den, emails: m.emails, conHieuLuc: m.cheDo === 'tat' || (m.cheDo === 'het_tuan' && Date.now() <= m.den) };
}

function hdMoKhoaLuu_(email, tv, body) {
  var che = String(body.cheDo || '');
  if (['khoa', 'het_tuan', 'tat'].indexOf(che) === -1) throw loi_('che_do_sai', 'Chế độ chỉ là khoa, het_tuan hoặc tat.');
  var ds = Array.isArray(body.emails) ? body.emails.map(chuanHoaEmail) : [];
  var hopLe = {};
  docBang_('ThanhVien').forEach(function (t) { if (t.trangThai === 'active') hopLe[chuanHoaEmail(t.email)] = true; });
  var chon = [];
  ds.forEach(function (e) { if (hopLe[e] && chon.indexOf(e) === -1) chon.push(e); });
  if (chon.length > 200) throw loi_('qua_nhieu', 'Tối đa 200 người.');
  var den = che === 'het_tuan' ? cuoiTuanVN_(Date.now()) : 0;
  return voiKhoa_(function () {
    datCauHinh_('moKhoaTaoDeCheDo', che, 'khoa: khóa như thường lệ; het_tuan: mở cho cả lớp đến hết tuần; tat: mở cho cả lớp đến khi chủ khóa lại');
    datCauHinh_('moKhoaTaoDeDen', String(den), 'Mốc (mili giây) hết hiệu lực của chế độ het_tuan');
    datCauHinh_('moKhoaTaoDeEmails', chon.join(','), 'Người được mở khóa tự tạo đề riêng, cách nhau bằng dấu phẩy');
    ghiNhatKy_(email, 'moKhoaTaoDe', '', { cheDo: che, soNguoi: chon.length });
    return { cheDo: che, den: den, emails: chon, conHieuLuc: che === 'tat' || che === 'het_tuan' };
  });
}
