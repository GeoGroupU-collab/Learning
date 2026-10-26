import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const NGUOI = Array.from({ length: 8 }, (_, i) => `u${i}@x.vn`);
const MON = ['khoa-hoc-du-lieu', 'dia-chat-kien-truc', 'triet-hoc-mac-lenin'];

let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });

const taoBoCau = (ai) =>
  MON.flatMap((maMon) =>
    Array.from({ length: 5 }, (_, i) => ({
      maMon, maChuong: 'c1', trangNguon: `tr.${i}`, noiDung: `Câu của ${ai} môn ${maMon} số ${i}`,
      A: `a-${ai}-${i}`, B: `b-${ai}-${i}`, C: `c-${ai}-${i}`, D: `d-${ai}-${i}`, dapAn: 'A', giaiThich: '',
    }))
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 1 });
  goiAs(CHU, 'admin.chotChiaNhom', {
    nhoms: [{ tenNhom: 'A', thanhVien: NGUOI.slice(0, 4).map((email) => ({ email })) }, { tenNhom: 'B', thanhVien: NGUOI.slice(4).map((email) => ({ email })) }],
  });
  vi.setSystemTime(gio('2026-11-05T10:00:00'));
  NGUOI.forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
});
afterEach(() => vi.useRealTimers());

describe('hiệu năng: số lần đọc Sheet', () => {
  it('trang chủ gom vào một yêu cầu, trả đủ thông tin cá nhân, tuần và cấp', () => {
    const r = goiAs(NGUOI[0], 'trangChu');
    expect(r.ok).toBe(true);
    expect(r.data.me).toMatchObject({ email: NGUOI[0], vaiTro: 'member' });
    expect(r.data.me.nhom.tenNhom).toBe('A');
    expect(r.data.tuan.tuan.soTuan).toBe(1);
    expect(r.data.cap).toMatchObject({ level: 1, tenCapLon: 'Võ Sĩ' });
  });

  it('mỗi tab chỉ đọc nhiều nhất một lần trong một yêu cầu trang chủ', () => {
    goiAs(NGUOI[0], 'trangChu'); // làm nóng cache cấu hình
    mt.boNho.clear();
    mt.datLaiDem();
    goiAs(NGUOI[0], 'trangChu');
    const dem = mt.demDoc();
    Object.entries(dem).forEach(([tab, n]) => expect(n, `tab ${tab}`).toBeLessThanOrEqual(2)); // dữ liệu + tiêu đề
    ['CauHinh', 'HocKy', 'Tuan', 'ThanhVien', 'Nhom', 'NhomThanhVien', 'CauHoi'].forEach((tab) => expect(dem[tab], tab).toBeGreaterThan(0));
  });

  it('gom một yêu cầu rẻ hơn ba yêu cầu riêng lẻ', () => {
    const tong = (f) => { mt.boNho.clear(); mt.datLaiDem(); f(); return Object.values(mt.demDoc()).reduce((s, n) => s + n, 0); };
    const rieng = tong(() => { goiAs(NGUOI[0], 'me'); goiAs(NGUOI[0], 'tuanHienTai'); goiAs(NGUOI[0], 'xepHangCaNhan'); });
    const gom = tong(() => goiAs(NGUOI[0], 'trangChu'));
    expect(gom).toBeLessThan(rieng);
  });

  it('cache cấu hình: yêu cầu thứ hai trong vòng 30 giây không đọc lại CauHinh, HocKy, Mon, Tuan', () => {
    goiAs(NGUOI[0], 'trangChu');
    mt.datLaiDem();
    goiAs(NGUOI[1], 'trangChu');
    const dem = mt.demDoc();
    ['CauHinh', 'HocKy', 'Mon', 'Tuan'].forEach((tab) => expect(dem[tab] ?? 0, tab).toBe(0));
  });

  it('sau 30 giây cache hết hạn và đọc lại, nên chủ sửa tay trong Sheet có hiệu lực', () => {
    goiAs(NGUOI[0], 'trangChu');
    const sheet = mt.ss.getSheetByName('CauHinh');
    sheet.dong.find((r) => r[0] === 'soMonNopCauHoi')[1] = 5;
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.yeuCau.soMon).toBe(3); // còn trong cache
    vi.setSystemTime(Date.now() + 31000);
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.yeuCau.soMon).toBe(5);
  });

  it('chủ sửa qua web thì có hiệu lực ngay, không phải chờ cache', () => {
    goiAs(NGUOI[0], 'tuanHienTai'); // đưa Tuan vào cache
    expect(goiAs(CHU, 'admin.suaTuan', { soTuan: 1, hanNop: gio('2026-11-05T09:00:00'), moCua: gio('2026-11-06T00:00:00'), dongCua: gio('2026-11-09T00:00:00') }).ok).toBe(true); // web gửi mili giây dạng số
    const t = goiAs(NGUOI[0], 'tuanHienTai').data.tuan;
    expect(t.hanNop).toBe(gio('2026-11-05T09:00:00'));
    expect(t.trangThai).toBe('cho_mo_cua'); // bây giờ 10:00 ngày 5/11, đã quá hạn nộp mới
  });

  it('ghi xong đọc lại trong cùng yêu cầu vẫn thấy dữ liệu mới (bộ nhớ được làm mới sau khi ghi)', () => {
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const bd = goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) });
    expect(bd.ok).toBe(true);
    expect(mt.docTab('LuotThi')).toHaveLength(1);
    expect(goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) }).data.maPhienThi).toBe(bd.data.maPhienThi);
    expect(mt.docTab('LuotThi')).toHaveLength(1);
  });
});
