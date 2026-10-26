import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const { taoLichTuan, trangThaiTuan, chonTuanHienTai, mocKeTiep, chuanHoaChu, kiemTraBoCauHoi } =
  createRequire(import.meta.url)('../src/logic.js');

const vn = (s) => Date.parse(s + '+07:00');

describe('lịch tuần', () => {
  const lich = taoLichTuan('2026-11-07', 5);
  it('sinh 5 tuần, mỗi tuần cách nhau 7 ngày', () => {
    expect(lich).toHaveLength(5);
    expect(lich[1].moCua - lich[0].moCua).toBe(7 * 86400000);
  });
  it('giờ mặc định: hạn 23:59:59 Thứ Sáu, mở 00:00 Thứ Bảy, đóng 23:59:59 Chủ nhật', () => {
    expect(lich[0].hanNop).toBe(vn('2026-11-06T23:59:59'));
    expect(lich[0].moCua).toBe(vn('2026-11-07T00:00:00'));
    expect(lich[0].dongCua).toBe(vn('2026-11-08T23:59:59'));
  });
  it('ngày sai thì không sinh lịch', () => {
    expect(taoLichTuan('abc', 5)).toEqual([]);
  });
});

describe('trạng thái tuần', () => {
  const t = taoLichTuan('2026-11-07', 1)[0];
  it('theo từng khung giờ', () => {
    expect(trangThaiTuan(t, vn('2026-11-02T10:00:00'))).toBe('nop_cau_hoi');
    expect(trangThaiTuan(t, t.hanNop)).toBe('nop_cau_hoi');
    expect(trangThaiTuan(t, t.hanNop + 1)).toBe('cho_mo_cua');
    expect(trangThaiTuan(t, t.moCua)).toBe('mo');
    expect(trangThaiTuan(t, t.dongCua)).toBe('mo');
    expect(trangThaiTuan(t, t.dongCua + 1)).toBe('dong');
  });
  it('mốc đếm ngược', () => {
    expect(mocKeTiep(t, t.hanNop - 5).luc).toBe(t.hanNop);
    expect(mocKeTiep(t, t.moCua + 5).luc).toBe(t.dongCua);
    expect(mocKeTiep(t, t.dongCua + 5)).toBeNull();
  });
  it('chọn tuần hiện tại', () => {
    const lich = taoLichTuan('2026-11-07', 3);
    expect(chonTuanHienTai(lich, vn('2026-11-01T00:00:00')).soTuan).toBe(1);
    expect(chonTuanHienTai(lich, vn('2026-11-09T12:00:00')).soTuan).toBe(2);
    expect(chonTuanHienTai(lich, vn('2027-01-01T00:00:00')).soTuan).toBe(3);
    expect(chonTuanHienTai([], 0)).toBeNull();
  });
});

describe('kiểm tra bộ câu hỏi', () => {
  const cau = (maMon, i, ghiDe = {}) => ({
    maMon, maChuong: 'c1', trangNguon: 'tr.' + i, noiDung: `Nội dung ${maMon} số ${i}`,
    A: `a${i}`, B: `b${i}`, C: `c${i}`, D: `d${i}`, dapAn: 'A', giaiThich: '', ...ghiDe,
  });
  const boDu = () => ['m1', 'm2', 'm3'].flatMap((m) => [1, 2, 3, 4, 5].map((i) => cau(m, i)));
  const opts = { soMon: 3, soCauMoiMon: 5, daCo: {}, chuongCuaMon: {} };

  it('bộ hợp lệ', () => {
    expect(kiemTraBoCauHoi(boDu(), opts)).toEqual({ ok: true, loi: [] });
  });
  it('thiếu câu một môn', () => {
    const b = boDu().slice(0, 14);
    const kq = kiemTraBoCauHoi(b, opts);
    expect(kq.ok).toBe(false);
    expect(kq.loi.join(' ')).toContain('m3');
  });
  it('sai số môn', () => {
    const b = ['m1', 'm2'].flatMap((m) => [1, 2, 3, 4, 5].map((i) => cau(m, i)));
    expect(kiemTraBoCauHoi(b, opts).ok).toBe(false);
  });
  it('bỏ trống trường bắt buộc', () => {
    const b = boDu();
    b[0].A = '';
    b[1].dapAn = '';
    b[2].trangNguon = ' ';
    const loi = kiemTraBoCauHoi(b, opts).loi.join('|');
    expect(loi).toContain('Câu 1: thiếu đáp án A');
    expect(loi).toContain('Câu 2: chưa chọn đáp án đúng');
    expect(loi).toContain('Câu 3: thiếu trang');
  });
  it('bốn đáp án trùng nhau sau chuẩn hóa', () => {
    const b = boDu();
    b[0].B = ' A0 ';
    b[0].A = 'a0.';
    const kq = kiemTraBoCauHoi(b, opts);
    expect(kq.loi.join(' ')).toContain('Câu 1: bốn đáp án phải khác nhau');
  });
  it('trùng trong bộ của mình', () => {
    const b = boDu();
    b[1].noiDung = '  nội dung m1 SỐ 1!! ';
    expect(kiemTraBoCauHoi(b, opts).loi.join(' ')).toContain('Câu 2: trùng với câu 1');
  });
  it('trùng với ngân hàng', () => {
    const daCo = { [chuanHoaChu('Nội dung m2 số 3')]: true };
    const kq = kiemTraBoCauHoi(boDu(), { ...opts, daCo });
    expect(kq.loi.join(' ')).toContain('Câu 8: đã có trong ngân hàng');
  });
  it('yêu cầu chọn chương khi môn có danh sách chương', () => {
    const b = boDu();
    b[0].maChuong = '';
    const kq = kiemTraBoCauHoi(b, { ...opts, chuongCuaMon: { m1: ['c1', 'c2'] } });
    expect(kq.loi.join(' ')).toContain('Câu 1: chưa chọn chương');
  });
  it('nội dung quá dài', () => {
    const b = boDu();
    b[0].noiDung = 'x'.repeat(601);
    expect(kiemTraBoCauHoi(b, opts).loi.join(' ')).toContain('quá dài');
  });
});
