// Các hàm thuần (không gọi API của Apps Script) để test bằng Vitest.

// Đọc GPA từ chuỗi người dùng gõ: chấp nhận dấu phẩy. Trả NaN nếu không hợp lệ.
function docGpa(giaTri) {
  var s = String(giaTri == null ? '' : giaTri).trim().replace(',', '.');
  if (s === '') return NaN;
  var n = Number(s);
  return isFinite(n) && n >= 0 && n <= 10 ? n : NaN;
}

function trungBinhGpa_(nhom) {
  if (nhom.length === 0) return 0;
  var tong = 0;
  nhom.forEach(function (p) { tong += p.gpa; });
  return tong / nhom.length;
}

// Chia nhóm kiểu rắn.
// danhSach: [{email, gpa, thuTu}]. Trả về mảng nhóm, mỗi nhóm là mảng người.
// Số nhóm = phần nguyên của (n / kichThuoc), tối thiểu 1.
// Người dư được thêm lần lượt vào nhóm có GPA trung bình thấp nhất trong các nhóm đang ít người nhất.
function chiaNhom(danhSach, kichThuoc) {
  var n = danhSach.length;
  if (n === 0) return [];
  var soNhom = Math.max(1, Math.floor(n / kichThuoc));
  var daSapXep = danhSach.slice().sort(function (a, b) {
    if (b.gpa !== a.gpa) return b.gpa - a.gpa;
    return (a.thuTu || 0) - (b.thuTu || 0);
  });

  var nhoms = [];
  for (var i = 0; i < soNhom; i++) nhoms.push([]);

  var soChinh = Math.min(n, soNhom * kichThuoc);
  for (var k = 0; k < soChinh; k++) {
    var vong = Math.floor(k / soNhom);
    var viTri = k % soNhom;
    var idx = vong % 2 === 0 ? viTri : soNhom - 1 - viTri;
    nhoms[idx].push(daSapXep[k]);
  }

  for (var j = soChinh; j < n; j++) {
    var nhoNhat = Math.min.apply(null, nhoms.map(function (g) { return g.length; }));
    var chon = -1;
    var gpaChon = Infinity;
    nhoms.forEach(function (g, vi) {
      if (g.length !== nhoNhat) return;
      var tb = trungBinhGpa_(g);
      if (tb < gpaChon) { gpaChon = tb; chon = vi; }
    });
    nhoms[chon].push(daSapXep[j]);
  }
  return nhoms;
}

// Độ lệch giữa GPA trung bình cao nhất và thấp nhất của các nhóm (dùng để kiểm tra cân bằng).
function doLechGpa(nhoms) {
  if (nhoms.length === 0) return 0;
  var tbs = nhoms.map(trungBinhGpa_);
  return Math.max.apply(null, tbs) - Math.min.apply(null, tbs);
}

// Chuẩn hóa email để so sánh.
function chuanHoaEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Chỉ nhận link bắt đầu bằng https://
function laLinkHopLe(link) {
  return /^https:\/\/[^\s<>"']+$/.test(String(link || '').trim());
}

if (typeof module !== 'undefined') {
  module.exports = { docGpa: docGpa, chiaNhom: chiaNhom, doLechGpa: doLechGpa, chuanHoaEmail: chuanHoaEmail, laLinkHopLe: laLinkHopLe };
}
