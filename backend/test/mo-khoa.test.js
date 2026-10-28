import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const NGUOI = ['a@x.vn', 'b@x.vn', 'c@x.vn'];
const MON = 'khoa-hoc-du-lieu';
let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });
const luu = (body) => goiAs(CHU, 'admin.moKhoaLuu', body);
const khoa = (email) => goiAs(email, 'taoDe.thongTin').data.khoa;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  mt.datCauHinh('khoaTaoDeKhiChuaNop', true);
  mt.themDong('ThanhVien', { email: CHU, hoTen: 'Chủ', vaiTro: 'owner', trangThai: 'active' });
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 3 }).ok).toBe(true);
  vi.setSystemTime(gio('2026-11-03T10:00:00')); // Thứ Ba
  goiAs(CHU, 'admin.nhapCauMoi', { rows: Array.from({ length: 12 }, (_, i) => ({ maMon: MON, maChuong: 'c1', noiDung: `Câu ngân hàng số ${i} về khoáng vật ${'x'.repeat(i)}`, A: `a${i}`, B: `b${i}`, C: `c${i}`, D: `d${i}`, dapAn: 'A' })) });
});
afterEach(() => vi.useRealTimers());

describe('chủ mở khóa tự tạo đề', () => {
  it('chỉ chủ cấu hình được; mặc định khóa', () => {
    expect(goiAs(NGUOI[0], 'admin.moKhoaLuu', { cheDo: 'tat' })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(NGUOI[0], 'admin.moKhoaLay')).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(CHU, 'admin.moKhoaLay').data).toMatchObject({ cheDo: 'khoa', emails: [], conHieuLuc: false });
    expect(khoa(NGUOI[0]).bi).toBe(true);
    expect(luu({ cheDo: 'la' })).toMatchObject({ ok: false, error: 'che_do_sai' });
  });

  it('mở riêng cho một số người: chỉ họ được tạo đề, bỏ tick thì khóa lại', () => {
    expect(luu({ cheDo: 'khoa', emails: [NGUOI[0], NGUOI[0].toUpperCase(), 'la@x.vn'] }).data.emails).toEqual([NGUOI[0]]);
    expect(khoa(NGUOI[0])).toMatchObject({ bi: false, moBoi: 'rieng' });
    expect(khoa(NGUOI[1]).bi).toBe(true);
    expect(goiAs(NGUOI[0], 'taoDe.bat', { maMon: MON }).ok).toBe(true);
    expect(goiAs(NGUOI[1], 'taoDe.bat', { maMon: MON }).error).toBe('khoa_tao_de');
    luu({ cheDo: 'khoa', emails: [] });
    goiAs(NGUOI[0], 'taoDe.huy');
    expect(khoa(NGUOI[0]).bi).toBe(true);
  });

  it('mở cho cả lớp đến hết tuần: hết Chủ nhật 23:59 giờ Việt Nam thì tự khóa lại', () => {
    const r = luu({ cheDo: 'het_tuan', emails: [] }).data;
    expect(r.den).toBe(gio('2026-11-08T23:59:59') + 999);
    expect(khoa(NGUOI[1])).toMatchObject({ bi: false, moBoi: 'chung' });
    expect(goiAs(NGUOI[2], 'taoDe.bat', { maMon: MON }).ok).toBe(true);
    vi.setSystemTime(gio('2026-11-08T23:58:00'));
    expect(khoa(NGUOI[1]).bi).toBe(false);
    vi.setSystemTime(gio('2026-11-09T00:01:00')); // Thứ Hai tuần sau
    expect(khoa(NGUOI[1]).bi).toBe(true);
    expect(goiAs(CHU, 'admin.moKhoaLay').data.conHieuLuc).toBe(false);
  });

  it('mở cho cả lớp cho đến khi chủ khóa lại', () => {
    luu({ cheDo: 'tat', emails: [] });
    vi.setSystemTime(gio('2026-11-20T10:00:00'));
    expect(khoa(NGUOI[1]).bi).toBe(false);
    luu({ cheDo: 'khoa', emails: [] });
    expect(khoa(NGUOI[1]).bi).toBe(true);
  });

  it('mở khóa không ảnh hưởng việc nộp câu hỏi; cờ khoaTaoDe cho trang Bài học theo đúng chế độ', () => {
    luu({ cheDo: 'tat', emails: [] });
    expect(goiAs(NGUOI[1], 'tuanHienTai').data.khoaTaoDe).toBe(false);
    const bo = ['khoa-hoc-du-lieu', 'dia-chat-kien-truc', 'triet-hoc-mac-lenin'].flatMap((m) => ['a', 'b', 'c', 'd', 'e'].map((k, i) => ({ maMon: m, maChuong: 'c1', trangNguon: 't', noiDung: `Câu nộp ${k} ${m} khoáng vật ${'y'.repeat(i)}`, A: `1${i}`, B: `2${i}`, C: `3${i}`, D: `4${i}`, dapAn: 'A' })));
    expect(goiAs(NGUOI[1], 'nopCauHoi', { cauHoi: bo }).ok).toBe(true);
    luu({ cheDo: 'khoa', emails: [] });
    expect(goiAs(NGUOI[2], 'tuanHienTai').data.khoaTaoDe).toBe(true);
  });

  it('ghi nhật ký', () => {
    luu({ cheDo: 'het_tuan', emails: [NGUOI[0]] });
    expect(mt.docTab('NhatKy').some((n) => n.hanhDong === 'moKhoaTaoDe')).toBe(true);
    expect(mt.docTab('CauHinh').filter((r) => r.khoa === 'moKhoaTaoDeCheDo')).toHaveLength(1);
  });
});
