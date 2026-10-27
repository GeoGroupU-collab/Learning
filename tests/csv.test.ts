import { describe, expect, it } from 'vitest';
import { docCsv, taoCsv } from '../src/csv';

describe('CSV an toàn khi mở bằng Excel', () => {
  it('ô chữ bắt đầu bằng = + - @ được thêm dấu nháy để Excel không chạy công thức', () => {
    const csv = taoCsv([{ ten: '=HYPERLINK("http://x","bấm")', diem: -5, ghiChu: '@SUM(A1)' }], ['ten', 'diem', 'ghiChu']);
    const dong = csv.replace(/^\uFEFF/, '').split('\r\n')[1];
    expect(dong.startsWith(`"'=HYPERLINK`)).toBe(true);
    expect(dong).toContain(',-5,'); // số âm giữ nguyên
    expect(dong.endsWith(`'@SUM(A1)`)).toBe(true);
  });

  it('xuất rồi nhập lại vẫn đúng chữ gốc', () => {
    const goc = [{ noiDung: '=1+1 là mấy?', A: '-2', B: 'bình thường', C: "'đã có nháy", D: '+3' }];
    const lai = docCsv(taoCsv(goc, ['noiDung', 'A', 'B', 'C', 'D']));
    expect(lai).toEqual(goc);
  });
});
