import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const { rutDe, chamBai, diemCaNhan, diemNhomTuan, xepHangNhom, diemLuyKe } = createRequire(import.meta.url)('../src/logic.js');

// Bộ sinh số ngẫu nhiên có hạt giống để test tái lập được.
const taoRng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const taoPool = ({ soNguoi = 12, mon = ['m1', 'm2', 'm3'], soTuan = 1, moiMon = 5 } = {}) => {
  const pool = [];
  for (let u = 0; u < soNguoi; u++)
    for (const m of mon)
      for (let i = 0; i < moiMon; i++) pool.push({ id: `${u}-${m}-${soTuan}-${i}`, maMon: m, soTuan, tacGia: `u${u}@x.vn`, trangThai: 'active' });
  return pool;
};

describe('rutDe', () => {
  const pool = taoPool();
  const opts = { email: 'u0@x.vn', monChon: ['m1', 'm2'], soCauMoiMon: 20, soTuan: 1 };

  it('đủ số lượng, không trùng, không có câu của chính mình', () => {
    const kq = rutDe(pool, { ...opts, rng: taoRng(1) });
    expect(kq.ds).toHaveLength(40);
    expect(kq.thieu).toBe(0);
    const ids = kq.ds.map((c) => c.id);
    expect(new Set(ids).size).toBe(40);
    expect(ids.some((id) => id.startsWith('0-'))).toBe(false);
  });

  it('chỉ lấy câu của các môn đã chọn khi đủ câu', () => {
    const kq = rutDe(pool, { ...opts, rng: taoRng(2) });
    expect(kq.ds.every((c) => /-m[12]-/.test(c.id))).toBe(true);
    expect(kq.ds.filter((c) => c.id.includes('-m1-'))).toHaveLength(20);
  });

  it('thứ tự đáp án là một hoán vị của ABCD', () => {
    const kq = rutDe(pool, { ...opts, rng: taoRng(3) });
    kq.ds.forEach((c) => expect(c.tt.split('').sort().join('')).toBe('ABCD'));
  });

  it('cùng hạt giống thì cùng kết quả (tái lập)', () => {
    const a = rutDe(pool, { ...opts, rng: taoRng(7) });
    const b = rutDe(pool, { ...opts, rng: taoRng(7) });
    expect(a).toEqual(b);
  });

  it('loại câu suspended và removed', () => {
    const p = taoPool().map((c, i) => (i % 2 ? { ...c, trangThai: 'suspended' } : c));
    const kq = rutDe(p, { ...opts, rng: taoRng(4) });
    const sach = new Set(p.filter((c) => c.trangThai === 'active').map((c) => c.id));
    kq.ds.forEach((c) => expect(sach.has(c.id)).toBe(true));
  });

  it('thiếu câu tuần này thì nới sang tuần trước, vẫn không có câu của mình', () => {
    const p = [...taoPool({ soNguoi: 3, soTuan: 2, moiMon: 5 }), ...taoPool({ soNguoi: 6, soTuan: 1, moiMon: 5 })];
    const kq = rutDe(p, { ...opts, soTuan: 2, rng: taoRng(5) });
    expect(kq.ds).toHaveLength(40);
    expect(kq.canhBao.join(' ')).toContain('tuần khác');
    expect(kq.ds.some((c) => c.id.startsWith('0-'))).toBe(false);
  });

  it('vẫn thiếu thì giảm số câu, không lỗi, và báo', () => {
    const p = taoPool({ soNguoi: 2, mon: ['m1'], moiMon: 3 });
    const kq = rutDe(p, { ...opts, monChon: ['m1', 'm2'], soCauMoiMon: 20, rng: taoRng(6) });
    expect(kq.ds).toHaveLength(3);
    expect(kq.thieu).toBe(37);
    expect(kq.canhBao.length).toBeGreaterThan(0);
  });

  it('mọi người trong lớp không bao giờ nhận câu của mình', () => {
    for (let u = 0; u < 12; u++) {
      const kq = rutDe(pool, { ...opts, email: `u${u}@x.vn`, rng: taoRng(u + 10) });
      expect(kq.ds.some((c) => c.id.startsWith(`${u}-`))).toBe(false);
    }
  });
});

describe('chamBai', () => {
  const ds = [{ id: 'a', tt: 'CADB' }, { id: 'b', tt: 'ABCD' }, { id: 'c', tt: 'DCBA' }];
  const dapAn = { a: 'C', b: 'B', c: 'A' };
  it('chấm theo thứ tự đáp án đã xáo', () => {
    // a: hiển thị A = gốc C (đúng); b: hiển thị B = gốc B (đúng); c: hiển thị D = gốc A (đúng)
    expect(chamBai(ds, { a: 'A', b: 'B', c: 'D' }, dapAn)).toEqual({ soDung: 3, soCau: 3 });
  });
  it('câu bỏ trống hoặc sai không tính', () => {
    expect(chamBai(ds, { a: 'B', b: '' }, dapAn)).toEqual({ soDung: 0, soCau: 3 });
  });
});

describe('điểm', () => {
  it('điểm cá nhân thang 100, làm tròn 1 chữ số', () => {
    expect(diemCaNhan(30, 40)).toBe(75);
    expect(diemCaNhan(1, 3)).toBe(33.3);
    expect(diemCaNhan(0, 0)).toBe(0);
  });

  it('điểm nhóm: người vắng tính 0 và vẫn nằm trong mẫu số', () => {
    const r = diemNhomTuan([
      { email: 'a', mien: false, diem: 80, giay: 1000 },
      { email: 'b', mien: false, diem: 60, giay: 1200 },
      { email: 'c', mien: false, diem: null, giay: null },
    ]);
    expect(r.diem).toBeCloseTo(46.67, 2);
    expect(r.soTinh).toBe(3);
    expect(r.soThamGia).toBe(2);
    expect(r.giayTB).toBe(1100);
  });

  it('người được miễn bị loại khỏi mẫu số', () => {
    const r = diemNhomTuan([
      { email: 'a', mien: false, diem: 80, giay: 1 },
      { email: 'b', mien: true, diem: null, giay: null },
    ]);
    expect(r.diem).toBe(80);
    expect(r.soTinh).toBe(1);
  });

  it('cả nhóm được miễn thì điểm 0, không chia cho 0', () => {
    expect(diemNhomTuan([{ email: 'a', mien: true, diem: null, giay: null }]).diem).toBe(0);
  });

  it('điểm lũy kế là trung bình các tuần', () => {
    expect(diemLuyKe([80, 60, 70])).toBe(70);
    expect(diemLuyKe([])).toBe(0);
  });
});

describe('xếp hạng nhóm', () => {
  const nhom = (maNhom, diem, tiLeThamGia, giayTB) => ({ maNhom, diem, tiLeThamGia, giayTB });
  it('điểm cao hơn đứng trên', () => {
    const r = xepHangNhom([nhom('a', 50, 1, 100), nhom('b', 70, 0.5, 900)]);
    expect(r.map((x) => x.maNhom)).toEqual(['b', 'a']);
    expect(r.map((x) => x.hang)).toEqual([1, 2]);
  });
  it('bằng điểm: tỉ lệ tham gia cao hơn đứng trên', () => {
    const r = xepHangNhom([nhom('a', 60, 0.5, 100), nhom('b', 60, 1, 900)]);
    expect(r[0].maNhom).toBe('b');
  });
  it('vẫn bằng: thời gian bình quân ngắn hơn đứng trên', () => {
    const r = xepHangNhom([nhom('a', 60, 1, 900), nhom('b', 60, 1, 600)]);
    expect(r[0].maNhom).toBe('b');
    expect(r[0].hang).toBe(1);
  });
  it('bằng hoàn toàn thì cùng hạng', () => {
    const r = xepHangNhom([nhom('a', 60, 1, 600), nhom('b', 60, 1, 600), nhom('c', 10, 1, 600)]);
    expect(r.map((x) => x.hang)).toEqual([1, 1, 3]);
  });
});
