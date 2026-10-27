import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const { docGpa, chiaNhom, doLechGpa, laLinkHopLe } = createRequire(import.meta.url)('../src/logic.js');

const taoNguoi = (n, gpaFn) =>
  Array.from({ length: n }, (_, i) => ({ email: `u${i}@x.vn`, gpa: gpaFn(i), thuTu: i }));

describe('docGpa', () => {
  it('chấp nhận dấu phẩy và dấu chấm', () => {
    expect(docGpa('3,25')).toBe(3.25);
    expect(docGpa(' 3.8 ')).toBe(3.8);
  });
  it('thang 4: 0 đến 4, điểm thang 10 bị từ chối', () => {
    expect(docGpa('4')).toBe(4);
    expect(docGpa('0')).toBe(0);
    expect(docGpa('4.01')).toBeNaN();
    expect(docGpa('7.8')).toBeNaN();
  });
  it('từ chối giá trị sai', () => {
    expect(docGpa('')).toBeNaN();
    expect(docGpa('abc')).toBeNaN();
    expect(docGpa('11')).toBeNaN();
    expect(docGpa('-1')).toBeNaN();
  });
});

describe('chiaNhom', () => {
  it('37 người, nhóm 6: 6 nhóm, đúng một nhóm 7 người', () => {
    const nhoms = chiaNhom(taoNguoi(37, (i) => 4 - i * 0.05), 6);
    expect(nhoms).toHaveLength(6);
    const co = nhoms.map((g) => g.length).sort();
    expect(co).toEqual([6, 6, 6, 6, 6, 7]);
  });

  it('người dư vào nhóm có GPA trung bình thấp nhất', () => {
    const nguoi = taoNguoi(13, (i) => 4 - i * 0.1);
    const nhoms = chiaNhom(nguoi, 6);
    expect(nhoms).toHaveLength(2);
    const lon = nhoms.find((g) => g.length === 7);
    const nho = nhoms.find((g) => g.length === 6);
    const tb = (g) => g.reduce((s, p) => s + p.gpa, 0) / g.length;
    const lonKhiBoDu = lon.filter((p) => p.email !== 'u12@x.vn');
    expect(tb(lonKhiBoDu)).toBeLessThanOrEqual(tb(nho));
  });

  it('mọi người xuất hiện đúng một lần', () => {
    const nguoi = taoNguoi(40, (i) => 2 + (i * 7) % 20 / 10);
    const emails = chiaNhom(nguoi, 6).flat().map((p) => p.email).sort();
    expect(emails).toEqual(nguoi.map((p) => p.email).sort());
  });

  it('cân bằng: độ lệch GPA trung bình giữa các nhóm nhỏ', () => {
    const nguoi = taoNguoi(36, (i) => 3.9 - i * 0.04);
    expect(doLechGpa(chiaNhom(nguoi, 6))).toBeLessThan(0.1);
  });

  it('ít hơn một nhóm đầy thì chỉ một nhóm', () => {
    expect(chiaNhom(taoNguoi(4, () => 3), 6)).toHaveLength(1);
  });

  it('danh sách rỗng', () => {
    expect(chiaNhom([], 6)).toEqual([]);
  });

  it('17 người nhóm 6: 2 nhóm, chênh lệch số người tối đa 1', () => {
    const nhoms = chiaNhom(taoNguoi(17, (i) => 3.5 - i * 0.02), 6);
    expect(nhoms).toHaveLength(2);
    expect(Math.abs(nhoms[0].length - nhoms[1].length)).toBeLessThanOrEqual(1);
  });
});

describe('laLinkHopLe', () => {
  it('chỉ nhận https', () => {
    expect(laLinkHopLe('https://zalo.me/g/abc')).toBe(true);
    expect(laLinkHopLe('http://zalo.me/g/abc')).toBe(false);
    expect(laLinkHopLe('javascript:alert(1)')).toBe(false);
  });
});
