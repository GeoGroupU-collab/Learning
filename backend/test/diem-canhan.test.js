import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const L = createRequire(import.meta.url)('../src/logic.js');

describe('cấp và level', () => {
  it('mỗi 100 điểm là 1 level, bắt đầu từ level 1', () => {
    expect(L.capTuDiem(0, 100)).toMatchObject({ level: 1, diemTrongLevel: 0, tenCapLon: 'Gỗ' });
    expect(L.capTuDiem(99, 100).level).toBe(1);
    expect(L.capTuDiem(100, 100).level).toBe(2);
    expect(L.capTuDiem(250, 100)).toMatchObject({ level: 3, diemTrongLevel: 50 });
  });
  it('đổi cấp lớn đúng ở biên', () => {
    expect(L.capTuDiem(400, 100).tenCapLon).toBe('Gỗ'); // level 5
    expect(L.capTuDiem(500, 100).tenCapLon).toBe('Sắt'); // level 6
    expect(L.capTuDiem(1000, 100).tenCapLon).toBe('Đồng'); // level 11
    expect(L.capTuDiem(2500, 100).tenCapLon).toBe('Bạch Kim'); // level 26
    expect(L.capTuDiem(8900, 100).tenCapLon).toBe('Đại Cao Thủ'); // level 90
    expect(L.capTuDiem(9000, 100).tenCapLon).toBe('Thách Đấu'); // level 91
  });
  it('cho biết còn bao nhiêu level đến cấp kế', () => {
    const c = L.capTuDiem(300, 100); // level 4, Gỗ (1-5)
    expect(c.capKe).toBe('Sắt');
    expect(c.levelConLaiDenCapKe).toBe(2);
  });
  it('cấp cuối không có giới hạn', () => {
    const c = L.capTuDiem(999999, 100);
    expect(c.tenCapLon).toBe('Thách Đấu');
    expect(c.capKe).toBeNull();
  });
  it('các cấp lớn liền nhau, không hở không chồng', () => {
    for (let i = 1; i < L.CAP_LON.length; i++) expect(L.CAP_LON[i].tu).toBe(L.CAP_LON[i - 1].den + 1);
  });
  it('điểm âm hoặc rỗng coi như 0', () => {
    expect(L.capTuDiem(-5, 100).level).toBe(1);
    expect(L.capTuDiem(undefined, 100).level).toBe(1);
  });
});

describe('điểm luyện tập', () => {
  it('mỗi lượt +20, không vượt trần 120 mỗi tuần', () => {
    expect(L.diemThuongLuyenTap(0, 20, 120)).toBe(20);
    expect(L.diemThuongLuyenTap(100, 20, 120)).toBe(20);
    expect(L.diemThuongLuyenTap(110, 20, 120)).toBe(10);
    expect(L.diemThuongLuyenTap(120, 20, 120)).toBe(0);
    expect(L.diemThuongLuyenTap(500, 20, 120)).toBe(0);
  });
  it('tuần ISO theo giờ Việt Nam, đổi tuần vào 00:00 Thứ Hai', () => {
    const vn = (s) => Date.parse(s + '+07:00');
    expect(L.tuanKeVN(vn('2026-11-02T00:00:00'))).toBe('2026-W45'); // Thứ Hai
    expect(L.tuanKeVN(vn('2026-11-08T23:59:59'))).toBe('2026-W45'); // Chủ nhật
    expect(L.tuanKeVN(vn('2026-11-09T00:00:00'))).toBe('2026-W46');
    expect(L.tuanKeVN(vn('2026-01-01T10:00:00'))).toBe('2026-W01');
    expect(L.tuanKeVN(vn('2027-01-01T10:00:00'))).toBe('2026-W53');
  });
});

describe('thưởng nhóm', () => {
  it('50 cho hạng 1, 30 cho hạng 2, 10 cho các hạng còn lại', () => {
    const b = [50, 30, 10];
    expect(L.diemThuongNhom(1, b)).toBe(50);
    expect(L.diemThuongNhom(2, b)).toBe(30);
    expect(L.diemThuongNhom(3, b)).toBe(10);
    expect(L.diemThuongNhom(9, b)).toBe(10);
  });
  it('đọc cấu hình, sai thì dùng mặc định', () => {
    expect(L.docBangDiemNhom('50, 30, 10')).toEqual([50, 30, 10]);
    expect(L.docBangDiemNhom('abc')).toEqual([50, 30, 10]);
    expect(L.docBangDiemNhom('60,20')).toEqual([60, 20]);
  });
});

describe('danh hiệu và xếp hạng cá nhân', () => {
  it('điểm cao nhất thắng, bằng điểm thì thời gian ngắn hơn', () => {
    const r = L.chonDanhHieuCaNhan([
      { email: 'a', diem: 90, giay: 900 },
      { email: 'b', diem: 95, giay: 1500 },
      { email: 'c', diem: 95, giay: 1200 },
    ]);
    expect(r.map((x) => x.email)).toEqual(['c']);
  });
  it('bằng cả điểm lẫn thời gian thì cùng nhận', () => {
    const r = L.chonDanhHieuCaNhan([{ email: 'a', diem: 90, giay: 600 }, { email: 'b', diem: 90, giay: 600 }]);
    expect(r).toHaveLength(2);
  });
  it('không có ai thi thì không có danh hiệu', () => {
    expect(L.chonDanhHieuCaNhan([])).toEqual([]);
  });
  it('xếp hạng cá nhân, bằng điểm cùng hạng', () => {
    const r = L.xepHangCaNhan([{ email: 'a', tong: 50 }, { email: 'b', tong: 120 }, { email: 'c', tong: 50 }]);
    expect(r.map((x) => [x.email, x.hang])).toEqual([['b', 1], ['a', 2], ['c', 2]]);
  });
});

describe('câu khó nhất', () => {
  const luot = (traLoi) => ({ ds: [{ id: 'q1', tt: 'ABCD' }, { id: 'q2', tt: 'ABCD' }], traLoi });
  const dapAn = { q1: 'A', q2: 'B' };
  it('xếp theo tỉ lệ sai, bỏ câu quá ít lượt, câu bỏ trống tính sai', () => {
    const ls = [luot({ q1: 'A', q2: 'A' }), luot({ q1: 'B', q2: 'A' }), luot({ q1: 'A' })];
    const r = L.cauKhoNhat(ls, dapAn, 3, 5);
    expect(r.map((x) => x.id)).toEqual(['q2', 'q1']);
    expect(r[0].tyLeSai).toBe(1);
    expect(r[1].tyLeSai).toBeCloseTo(1 / 3);
    expect(L.cauKhoNhat(ls, dapAn, 4, 5)).toEqual([]);
  });
  it('tính theo thứ tự đáp án đã xáo', () => {
    // tt='BADC': hiển thị A = gốc B. Đáp án gốc là B nên chọn hiển thị A là đúng.
    const ls = [{ ds: [{ id: 'q', tt: 'BADC' }], traLoi: { q: 'A' } }];
    expect(L.cauKhoNhat(ls, { q: 'B' }, 1, 5)[0].soSai).toBe(0);
  });
  it('giới hạn số câu trả về', () => {
    const ds = Array.from({ length: 8 }, (_, i) => ({ id: 'c' + i, tt: 'ABCD' }));
    const r = L.cauKhoNhat([{ ds, traLoi: {} }], Object.fromEntries(ds.map((d) => [d.id, 'A'])), 1, 5);
    expect(r).toHaveLength(5);
  });
});

describe('báo sai', () => {
  it('2 người thì tạm loại, 5 người thì xóa', () => {
    expect(L.trangThaiTheoBaoSai(1, 2, 5, 'active')).toBe('active');
    expect(L.trangThaiTheoBaoSai(2, 2, 5, 'active')).toBe('suspended');
    expect(L.trangThaiTheoBaoSai(4, 2, 5, 'suspended')).toBe('suspended');
    expect(L.trangThaiTheoBaoSai(5, 2, 5, 'suspended')).toBe('removed');
    expect(L.trangThaiTheoBaoSai(9, 2, 5, 'removed')).toBe('removed');
  });
});

describe('sửa câu hỏi hàng loạt', () => {
  const cau = { noiDung: 'Hỏi?', A: 'a', B: 'b', C: 'c', D: 'd', dapAn: 'A', trangThai: 'active', giaiThich: '', trangNguon: 'tr.1', maChuong: 'c1' };
  it('câu hợp lệ', () => {
    expect(L.kiemTraMotCau(cau)).toEqual([]);
  });
  it('bắt lỗi', () => {
    expect(L.kiemTraMotCau({ ...cau, A: '' }).join()).toContain('thiếu A');
    expect(L.kiemTraMotCau({ ...cau, dapAn: 'E' }).join()).toContain('đáp án đúng');
    expect(L.kiemTraMotCau({ ...cau, B: 'A' }).join()).toContain('khác nhau');
    expect(L.kiemTraMotCau({ ...cau, trangThai: 'xyz' }).join()).toContain('trạng thái');
  });
  it('so sánh chỉ ra trường đã đổi, bỏ qua trường không có trong bản mới và khoảng trắng thừa', () => {
    expect(L.soSanhCauHoi(cau, { noiDung: ' Hỏi? ', A: 'a2' })).toEqual({ A: { tu: 'a', den: 'a2' } });
    expect(L.soSanhCauHoi(cau, {})).toEqual({});
    expect(L.soSanhCauHoi(cau, { tacGia: 'x', id: 'y' })).toEqual({});
  });
});
