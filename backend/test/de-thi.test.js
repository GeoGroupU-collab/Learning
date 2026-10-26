import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const TRO_LY = 'troly@x.vn';
const NGUOI = Array.from({ length: 8 }, (_, i) => `u${i}@x.vn`);
const MON = ['khoa-hoc-du-lieu', 'dia-chat-kien-truc', 'triet-hoc-mac-lenin'];

let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });

const taoBoCau = (ai) =>
  MON.flatMap((maMon) =>
    Array.from({ length: 5 }, (_, i) => ({
      maMon, maChuong: i < 3 ? 'c1' : 'c2', trangNguon: `tr.${i}`, noiDung: `Câu của ${ai} môn ${maMon} số ${i}`,
      A: `a-${ai}-${i}`, B: `b-${ai}-${i}`, C: `c-${ai}-${i}`, D: `d-${ai}-${i}`, dapAn: 'ABCD'[i % 4], giaiThich: `Giải thích ${ai}-${i}`,
    }))
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  mt.themDong('ThanhVien', { email: TRO_LY, hoTen: 'Trợ lý', vaiTro: 'assistant', trangThai: 'active' });
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 2 }).ok).toBe(true);
  vi.setSystemTime(gio('2026-11-03T10:00:00'));
  NGUOI.forEach((e) => expect(goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }).ok).toBe(true));
});
afterEach(() => vi.useRealTimers());

const xemTruoc = (body) => goiAs(CHU, 'admin.xemTruocDeThi', body);
const luu = (ids, ten = 'Đề thử', tt = 'nhap') => goiAs(CHU, 'admin.luuDeThi', { tenDe: ten, dsIdCau: ids, trangThai: tt });

describe('xây đề từ ngân hàng', () => {
  it('chỉ chủ mới dùng được', () => {
    expect(goiAs(TRO_LY, 'admin.xemTruocDeThi', { phanBo: [{ maMon: MON[0], soCau: 5 }] })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(NGUOI[0], 'admin.dsDeThi')).toMatchObject({ ok: false, error: 'cam' });
  });

  it('rút đúng số câu theo từng môn, không trùng, kèm đáp án để chủ xem', () => {
    const r = xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 10 }, { maMon: MON[1], soCau: 7 }] }).data;
    expect(r.cau).toHaveLength(17);
    expect(r.cau.filter((c) => c.maMon === MON[0])).toHaveLength(10);
    expect(new Set(r.cau.map((c) => c.id)).size).toBe(17);
    expect(r.cau[0]).toHaveProperty('dapAn');
    expect(r.thieu).toEqual([]);
  });

  it('lọc theo chương, loại trừ tác giả, chỉ lấy câu đang dùng', () => {
    const c2 = xemTruoc({ phanBo: [{ maMon: MON[0], chuong: ['c2'], soCau: 100 }] }).data;
    expect(c2.cau).toHaveLength(8 * 2);
    c2.cau.forEach((c) => expect(c.maChuong).toBe('c2'));
    const tru = xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 100 }], loc: { truTacGia: [NGUOI[0], NGUOI[1]] } }).data;
    expect(tru.cau).toHaveLength(6 * 5);
    tru.cau.forEach((c) => expect([NGUOI[0], NGUOI[1]]).not.toContain(c.tacGia));
    const id = mt.docTab('CauHoi')[0].id;
    goiAs(CHU, 'admin.doiTrangThaiCau', { id, trangThai: 'suspended' });
    expect(xemTruoc({ phanBo: [{ maMon: mt.docTab('CauHoi')[0].maMon, soCau: 100 }] }).data.cau.some((c) => c.id === id)).toBe(false);
  });

  it('báo thiếu khi ngân hàng không đủ câu', () => {
    const r = xemTruoc({ phanBo: [{ maMon: MON[0], chuong: ['c2'], soCau: 30 }] }).data;
    expect(r.cau).toHaveLength(16);
    expect(r.thieu).toEqual([{ maMon: MON[0], can: 30, co: 16 }]);
  });

  it('chương so khớp không phân biệt hoa thường và khoảng trắng', () => {
    expect(xemTruoc({ phanBo: [{ maMon: MON[0], chuong: [' C2 '], soCau: 100 }] }).data.cau).toHaveLength(16);
  });

  it('thiếu phân bổ thì báo lỗi', () => {
    expect(xemTruoc({ phanBo: [] })).toMatchObject({ ok: false, error: 'thieu_phan_bo' });
  });

  it('thay một câu: cùng môn và chương, không trùng câu đang có', () => {
    const co = xemTruoc({ phanBo: [{ maMon: MON[0], chuong: ['c2'], soCau: 15 }] }).data.cau;
    const r = goiAs(CHU, 'admin.thayCauDe', { maMon: MON[0], chuong: ['c2'], loaiTruId: co.map((c) => c.id) }).data;
    expect(r.cau.maMon).toBe(MON[0]);
    expect(r.cau.maChuong).toBe('c2');
    expect(co.map((c) => c.id)).not.toContain(r.cau.id);
    const het = goiAs(CHU, 'admin.thayCauDe', { maMon: MON[0], chuong: ['c2'], loaiTruId: [...co.map((c) => c.id), r.cau.id] }).data;
    expect(het.cau).toBeNull();
  });

  it('tránh câu đã dùng trong đề trước', () => {
    const a = xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 30 }] }).data.cau.map((c) => c.id);
    expect(luu(a, 'Đề 1').ok).toBe(true);
    const b = xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 40 }], loc: { tranhDaDung: true } }).data;
    expect(b.cau).toHaveLength(10);
    b.cau.forEach((c) => expect(a).not.toContain(c.id));
  });
});

describe('lưu và quản lý đề', () => {
  const ids = () => xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 12 }] }).data.cau.map((c) => c.id);

  it('lưu đề, liệt kê, lấy lại đủ nội dung theo đúng thứ tự', () => {
    const d = ids();
    const r = luu(d, '  Đề   ôn  giữa kỳ ');
    expect(r.ok).toBe(true);
    const ds = goiAs(CHU, 'admin.dsDeThi').data;
    expect(ds).toHaveLength(1);
    expect(ds[0]).toMatchObject({ tenDe: 'Đề ôn giữa kỳ', soCau: 12, trangThai: 'nhap', tuanGan: null });
    const day = goiAs(CHU, 'admin.layDeThi', { idDe: r.data.idDe }).data;
    expect(day.cau.map((c) => c.id)).toEqual(d);
    expect(day.cau[0]).toMatchObject({ trangNguon: expect.stringMatching(/^tr\./), giaiThich: expect.stringContaining('Giải thích') });
  });

  it('kiểm tra dữ liệu: tên, số câu, câu không tồn tại, bỏ trùng id', () => {
    expect(luu(ids(), 'x')).toMatchObject({ ok: false, error: 'ten_sai' });
    expect(luu([], 'Đề rỗng')).toMatchObject({ ok: false, error: 'so_cau_sai' });
    expect(luu(['khong-co'], 'Đề lỗi')).toMatchObject({ ok: false, error: 'cau_khong_co' });
    const d = ids();
    const r = luu([...d, ...d], 'Đề trùng');
    expect(goiAs(CHU, 'admin.layDeThi', { idDe: r.data.idDe }).data.cau).toHaveLength(12);
  });

  it('sửa đề và đổi trạng thái', () => {
    const r = luu(ids(), 'Đề A').data;
    expect(goiAs(CHU, 'admin.luuDeThi', { idDe: r.idDe, tenDe: 'Đề A (sửa)', dsIdCau: ids().slice(0, 8) }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.dsDeThi').data[0]).toMatchObject({ tenDe: 'Đề A (sửa)', soCau: 8 });
    expect(goiAs(CHU, 'admin.doiTrangThaiDe', { idDe: r.idDe, trangThai: 'phat_hanh' }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.doiTrangThaiDe', { idDe: r.idDe, trangThai: 'xyz' }).error).toBe('trang_thai_sai');
  });
});

describe('đề cố định cho sự kiện', () => {
  let idDe;
  let dsId;
  beforeEach(() => {
    dsId = xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 15 }, { maMon: MON[1], soCau: 15 }] }).data.cau.map((c) => c.id);
    idDe = luu(dsId, 'Đề chung kết').data.idDe;
  });

  it('gán và gỡ đề cho tuần trước giờ mở cửa; hiện trong danh sách', () => {
    expect(goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.dsDeThi').data[0].tuanGan).toBe(1);
    expect(goiAs(CHU, 'admin.dsTuan').data.tuan[0].idDe).toBe(idDe);
    expect(goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe: '' }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.dsDeThi').data[0].tuanGan).toBeNull();
  });

  it('sau giờ mở cửa không đổi đề được nữa; không sửa danh sách câu của đề đang dùng', () => {
    goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe });
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    expect(goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe: '' })).toMatchObject({ ok: false, error: 'da_mo' });
    expect(goiAs(CHU, 'admin.luuDeThi', { idDe, tenDe: 'Đề chung kết', dsIdCau: dsId.slice(0, 10) })).toMatchObject({ ok: false, error: 'dang_dung' });
    expect(goiAs(CHU, 'admin.luuDeThi', { idDe, tenDe: 'Đề chung kết (đổi tên)', dsIdCau: dsId }).ok).toBe(true);
  });

  it('mọi người thi cùng bộ câu nhưng thứ tự khác nhau, không cần chọn môn', () => {
    goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe });
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const tt = goiAs(NGUOI[0], 'tuanHienTai').data;
    expect(tt.deCoDinh).toMatchObject({ soCau: 30, tenDe: 'Đề chung kết' });
    const a = goiAs(NGUOI[0], 'batDauThi', {});
    const b = goiAs(NGUOI[1], 'batDauThi', { monChon: ['bat-ky'] });
    expect(a.ok, JSON.stringify(a)).toBe(true);
    expect(b.ok).toBe(true);
    const idA = a.data.cauHoi.map((c) => c.id);
    const idB = b.data.cauHoi.map((c) => c.id);
    expect(new Set(idA)).toEqual(new Set(dsId));
    expect(new Set(idB)).toEqual(new Set(dsId));
    expect(idA).not.toEqual(idB); // thứ tự khác nhau (xác suất trùng quá nhỏ)
    expect(JSON.stringify(a.data)).not.toContain('"dung"');
  });

  it('người là tác giả một câu trong đề vẫn nhận câu đó (đề cố định không loại câu của mình)', () => {
    goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe });
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const cau = Object.fromEntries(mt.docTab('CauHoi').map((c) => [c.id, c]));
    const tacGia = cau[dsId[0]].tacGia;
    const r = goiAs(tacGia, 'batDauThi', {});
    expect(r.data.cauHoi).toHaveLength(30);
  });

  it('chấm đúng theo đề cố định và câu bị xóa khỏi ngân hàng được bỏ qua', () => {
    goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe });
    goiAs(CHU, 'admin.doiTrangThaiCau', { id: dsId[0], trangThai: 'removed' });
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const bd = goiAs(NGUOI[2], 'batDauThi', {}).data;
    expect(bd.cauHoi).toHaveLength(29);
    expect(bd.cauHoi.some((c) => c.id === dsId[0])).toBe(false);
    const nop = mt.goi({ action: 'thi.nop', maPhienThi: bd.maPhienThi, traLoi: {} });
    expect(nop.data).toMatchObject({ soCau: 29, soDung: 0 });
  });

  it('đề gán cho tuần không tồn tại hoặc quá ít câu bị từ chối', () => {
    expect(goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 9, idDe })).toMatchObject({ ok: false, error: 'khong_thay' });
    const nho = luu(dsId.slice(0, 3), 'Đề nhỏ').data.idDe;
    expect(goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe: nho })).toMatchObject({ ok: false, error: 'it_cau' });
  });

  it('chủ chỉnh được thời gian làm bài của một tuần', () => {
    const t = goiAs(CHU, 'admin.dsTuan').data.tuan[0];
    expect(goiAs(CHU, 'admin.suaTuan', { soTuan: 1, hanNop: t.hanNop, moCua: t.moCua, dongCua: t.dongCua, thoiGianPhut: 60 }).ok).toBe(true);
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.thi.thoiGianPhut).toBe(60);
    expect(goiAs(CHU, 'admin.suaTuan', { soTuan: 1, hanNop: t.hanNop, moCua: t.moCua, dongCua: t.dongCua, thoiGianPhut: 2 })).toMatchObject({ ok: false, error: 'phut_sai' });
  });
});

describe('phát hành đề cho thành viên', () => {
  let idDe;
  beforeEach(() => {
    const ds = xemTruoc({ phanBo: [{ maMon: MON[2], soCau: 20 }] }).data.cau.map((c) => c.id);
    idDe = luu(ds, 'Đề ôn Triết', 'phat_hanh').data.idDe;
  });
  const lam = (email, soTraLoi = 20) => {
    const bat = goiAs(email, 'taoDe.bat', { idDe });
    expect(bat.ok, JSON.stringify(bat)).toBe(true);
    const traLoi = Object.fromEntries(bat.data.cauHoi.slice(0, soTraLoi).map((c) => [c.id, 'A']));
    return { bat, nop: goiAs(email, 'taoDe.nop', { maLuot: bat.data.maLuot, traLoi }) };
  };

  it('thành viên thấy đề đã phát hành, đề nháp thì không', () => {
    luu(xemTruoc({ phanBo: [{ maMon: MON[0], soCau: 10 }] }).data.cau.map((c) => c.id), 'Đề nháp', 'nhap');
    const tt = goiAs(NGUOI[0], 'taoDe.thongTin').data;
    expect(tt.dePhatHanh).toEqual([{ idDe, tenDe: 'Đề ôn Triết', soCau: 20, daLam: null }]);
  });

  it('làm đề phát hành: cùng bộ câu, +20 điểm lần đầu, các lần sau không cộng thêm', () => {
    const { bat, nop } = lam(NGUOI[0]);
    expect(bat.data.tenMon).toBe('Đề: Đề ôn Triết');
    expect(bat.data.cauHoi).toHaveLength(20);
    expect(nop.data.diemThuong).toBe(20);
    const lan2 = lam(NGUOI[0]);
    expect(lan2.nop.data.diemThuong).toBe(0);
    expect(mt.docTab('Diem').filter((d) => d.email === NGUOI[0])).toHaveLength(1);
    const tt = goiAs(NGUOI[0], 'taoDe.thongTin').data;
    expect(tt.dePhatHanh[0].daLam).toMatchObject({ soCau: 20 });
    // người khác vẫn được +20 cho cùng đề
    expect(lam(NGUOI[1]).nop.data.diemThuong).toBe(20);
  });

  it('điểm đề phát hành tính vào trần 120 điểm mỗi tuần cùng đề tự tạo', () => {
    for (let i = 0; i < 5; i++) {
      const bat = goiAs(NGUOI[3], 'taoDe.bat', { maMon: MON[0] });
      goiAs(NGUOI[3], 'taoDe.nop', { maLuot: bat.data.maLuot, traLoi: Object.fromEntries(bat.data.cauHoi.map((c) => [c.id, 'A'])) });
    }
    expect(lam(NGUOI[3]).nop.data.diemThuong).toBe(20);
    const tong = mt.docTab('Diem').filter((d) => d.email === NGUOI[3]).reduce((s, d) => s + Number(d.soDiem), 0);
    expect(tong).toBe(120);
  });

  it('gỡ phát hành thì không làm được nữa', () => {
    goiAs(CHU, 'admin.doiTrangThaiDe', { idDe, trangThai: 'luu_tru' });
    expect(goiAs(NGUOI[0], 'taoDe.bat', { idDe })).toMatchObject({ ok: false, error: 'khong_thay' });
    expect(goiAs(NGUOI[0], 'taoDe.thongTin').data.dePhatHanh).toEqual([]);
  });

  it('câu bị tạm loại sau khi phát hành không còn xuất hiện trong đề', () => {
    const cau = mt.docTab('CauHoi').find((c) => c.maMon === MON[2]);
    goiAs(CHU, 'admin.doiTrangThaiCau', { id: cau.id, trangThai: 'suspended' });
    const bat = goiAs(NGUOI[0], 'taoDe.bat', { idDe });
    expect(bat.data.cauHoi.some((c) => c.id === cau.id)).toBe(false);
  });
});
