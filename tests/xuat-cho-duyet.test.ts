import { describe, expect, it } from 'vitest';
import { taoMarkdownChoDuyet } from '../src/xuat-cho-duyet';
import type { DotChoDuyet } from '../src/types';

const dot: DotChoDuyet = {
  meta: { ngayXuat: '2026-11-07T03:00:00.000Z', maHocKy: 'hk1-2026-2027', soChoDuyet: 2, soThamKhao: 1, soNghiTrung: 1, huongDan: '' },
  cho: [
    {
      id: 'c1', maHocKy: 'hk1-2026-2027', soTuan: 1, maMon: 'triet', tenMon: 'Triết học', maChuong: 'c2', trangNguon: 'tr.12',
      noiDung: 'Vật chất là gì?', A: 'a', B: 'b', C: 'c', D: 'd', dapAn: 'B', giaiThich: 'Theo slide 12.', maTacGia: 'T01',
      nghiTrung: [{ id: 'k1', doGiong: 0.83 }], quyetDinh: '', ghiChuDuyet: '',
    },
    {
      id: 'c2', maHocKy: 'hk1-2026-2027', soTuan: 1, maMon: 'triet', tenMon: 'Triết học', maChuong: '', trangNguon: '',
      noiDung: 'Ý thức là gì?', A: 'a', B: 'b', C: 'c', D: 'd', dapAn: 'A', giaiThich: '', maTacGia: 'T02', nghiTrung: [], quyetDinh: '', ghiChuDuyet: '',
    },
  ],
  thamKhao: [{ id: 'k1', maMon: 'triet', maChuong: 'c2', noiDung: 'Vật chất là gì theo Lênin?', A: 'a', B: 'b', C: 'c', D: 'd', dapAn: 'A', maTacGia: 'T03' }],
};

describe('taoMarkdownChoDuyet', () => {
  const md = taoMarkdownChoDuyet(dot);

  it('có tiêu đề, số liệu và hướng dẫn trả kết quả', () => {
    expect(md).toContain('# Đợt chờ duyệt hk1-2026-2027 (2026-11-07)');
    expect(md).toContain('Số câu chờ duyệt: 2');
    expect(md).toContain('`duyet`');
    expect(md).toContain('`tu_choi`');
  });

  it('mỗi câu có id, đáp án đúng được đánh dấu, người nộp chỉ hiện bằng mã', () => {
    expect(md).toContain('id: `c1` · tuần 1 · người nộp T01');
    expect(md).toContain('- B. b ✔');
    expect(md).toContain('- A. a ✔'); // câu c2
    expect(md).not.toMatch(/@/); // không lộ email
  });

  it('câu nghi trùng kèm id, độ giống và nội dung câu kia', () => {
    expect(md).toContain('`k1` (giống 83%): Vật chất là gì theo Lênin?');
  });

  it('có phần câu đã duyệt để so trùng; bỏ phần đó khi không có', () => {
    expect(md).toContain('## Câu đã duyệt');
    expect(taoMarkdownChoDuyet({ ...dot, thamKhao: [] })).not.toContain('## Câu đã duyệt');
  });
});
