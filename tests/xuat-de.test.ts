import { describe, expect, it } from 'vitest';
import { csvDe, escHtml, htmlDe, htmlTongKet, jsonDe } from '../src/xuat-de';
import { docCsv } from '../src/csv';
import type { DeThiDayDu } from '../src/types';

const de: DeThiDayDu = {
  idDe: 'de-1',
  tenDe: 'Đề <chung> kết & "thử"',
  trangThai: 'nhap',
  cau: [
    { id: 'q1', soTuan: 1, maMon: 'kh', tenMon: 'Khoa học dữ liệu', maChuong: 'c1', trangNguon: 'tr. 5', noiDung: 'Cho x < 5 và y > 3, phát biểu nào đúng?', A: '<script>alert(1)</script>', B: 'b, có dấu phẩy', C: 'c "ngoặc kép"', D: 'd\ndòng mới', dapAn: 'B', giaiThich: 'Vì b.', tacGia: 'a@x.vn', tenTacGia: 'A', trangThai: 'active' },
    { id: 'q2', soTuan: 1, maMon: 'kh', tenMon: 'Khoa học dữ liệu', maChuong: 'c2', trangNguon: '', noiDung: 'Câu hai?', A: '1', B: '2', C: '3', D: '4', dapAn: 'D', giaiThich: '', tacGia: 'b@x.vn', tenTacGia: 'B', trangThai: 'active' },
  ],
};

describe('xuất đề', () => {
  it('escape HTML để nội dung câu hỏi không chèn được mã', () => {
    expect(escHtml('<b>"x"&\'</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&#39;&lt;/b&gt;');
    const html = htmlDe(de, false);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Đề &lt;chung&gt; kết &amp; &quot;thử&quot;');
  });

  it('bản đề không có đáp án đúng, có chỗ ghi họ tên và đủ câu', () => {
    const html = htmlDe(de, false);
    expect(html).toContain('Họ và tên');
    expect(html).toContain('Câu 1.');
    expect(html).toContain('Câu 2.');
    expect(html).not.toContain('ĐÁP ÁN');
    expect(html).not.toContain('Vì b.');
    expect(html).not.toContain('✓');
  });

  it('bản đáp án có bảng đáp án, dấu ✓, giải thích và trang nguồn', () => {
    const html = htmlDe(de, true);
    expect(html).toContain('ĐÁP ÁN');
    expect(html).toContain('<td class="dung">B</td>');
    expect(html).toContain('<td class="dung">D</td>');
    expect(html).toContain('✓');
    expect(html).toContain('Giải thích: Vì b.');
    expect(html).toContain('tr. 5');
  });

  it('chỉ chèn mã tự in khi yêu cầu in', () => {
    expect(htmlDe(de, false, false)).not.toContain('window.print()},400');
    expect(htmlDe(de, false, true)).toContain('window.print()');
  });

  it('CSV đọc lại được nguyên vẹn kể cả dấu phẩy, ngoặc kép và xuống dòng trong ô', () => {
    const rows = docCsv(csvDe(de));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ stt: '1', id: 'q1', B: 'b, có dấu phẩy', C: 'c "ngoặc kép"', D: 'd\ndòng mới', dapAn: 'B', trangNguon: 'tr. 5' });
    expect(rows[1].dapAn).toBe('D');
  });

  it('JSON có số câu và đáp án đúng', () => {
    const j = JSON.parse(jsonDe(de));
    expect(j.soCau).toBe(2);
    expect(j.cau[0]).toMatchObject({ stt: 1, mon: 'Khoa học dữ liệu', dapAnDung: 'B', trangNguon: 'tr. 5' });
    expect(j.cau[0].dapAn.A).toContain('script');
  });
});

describe('tổng kết học kỳ để in', () => {
  const tk = {
    maHocKy: 'hk1', tenHocKy: 'Học kỳ <1> & "một"', ngayTongKet: '', nhomVoDich: [{ tenNhom: 'Nhóm <A>', diem: 80 }],
    bangNhom: [{ maNhom: 'n1', tenNhom: 'Nhóm <A>', diem: 80, hang: 1 }], tuan: [{ soTuan: 1, soThamGia: 3, soTinh: 4, tiLe: 75 }], thamGiaTrungBinh: 75,
    topCaNhan: [{ hoTen: '<b>An</b>', diemTB: 90, soTuan: 1 }], topCapBac: [], danhHieu: [],
    thongKe: { soTuanDaChot: 1, soCauHoi: 10, soLuotThi: 3, soDeTuTao: 2, soThanhVien: 4 },
  };
  it('escape HTML, có nhóm vô địch và các bảng', () => {
    const html = htmlTongKet(tk);
    expect(html).not.toContain('<b>An</b>');
    expect(html).toContain('&lt;b&gt;An&lt;/b&gt;');
    expect(html).toContain('Nhóm &lt;A&gt; (80 điểm lũy kế)');
    expect(html).toContain('Học kỳ &lt;1&gt; &amp; &quot;một&quot;');
    expect(html).toContain('Tham gia theo tuần (trung bình 75%)');
    expect(html).toContain('<p>Chưa có</p>');
  });
});
