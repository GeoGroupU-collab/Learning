import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const NGUOI = ['a@x.vn', 'b@x.vn', 'c@x.vn'];
let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });
const luu = (body) => goiAs(CHU, 'admin.nhacNguLuu', body);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-03T10:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
});
afterEach(() => vi.useRealTimers());

describe('nhắc ngủ', () => {
  it('chỉ chủ cấu hình được; mặc định tắt', () => {
    expect(goiAs(NGUOI[0], 'admin.nhacNguLuu', { bat: true, emails: [NGUOI[0]] })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(NGUOI[0], 'admin.nhacNguLay')).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(CHU, 'admin.nhacNguLay').data).toMatchObject({ bat: false, emails: [] });
    vi.setSystemTime(gio('2026-11-03T23:45:00'));
    expect(goiAs(NGUOI[0], 'nhacNgu').data).toMatchObject({ canHoi: false, hien: false });
  });

  it('bật mà chưa chọn ai thì báo lỗi; email lạ và trùng bị bỏ', () => {
    expect(luu({ bat: true, emails: [] })).toMatchObject({ ok: false, error: 'thieu_nguoi' });
    expect(luu({ bat: true, emails: ['la@x.vn'] })).toMatchObject({ ok: false, error: 'thieu_nguoi' });
    const r = luu({ bat: true, emails: [NGUOI[0], NGUOI[0].toUpperCase(), 'la@x.vn'], loiNhan: '  Ngủ đi nha  ' });
    expect(r.data).toEqual({ bat: true, emails: [NGUOI[0]], loiNhan: 'Ngủ đi nha' });
  });

  it('chỉ hiện đúng người được chọn, đúng khung 23:30 đến 7:00 giờ Việt Nam', () => {
    luu({ bat: true, emails: [NGUOI[0]] });
    const hien = (email, t) => { vi.setSystemTime(gio(t)); return goiAs(email, 'nhacNgu').data; };
    expect(hien(NGUOI[0], '2026-11-03T23:29:00')).toMatchObject({ canHoi: true, hien: false });
    expect(hien(NGUOI[0], '2026-11-03T23:30:00')).toMatchObject({ canHoi: true, hien: true, loiNhan: 'Khuya rồi đó, ngủ đi cục cưng!' });
    expect(hien(NGUOI[0], '2026-11-04T00:15:00').hien).toBe(true);
    expect(hien(NGUOI[0], '2026-11-04T06:59:00').hien).toBe(true);
    expect(hien(NGUOI[0], '2026-11-04T07:00:00').hien).toBe(false);
    expect(hien(NGUOI[0], '2026-11-04T14:00:00').hien).toBe(false);
    expect(hien(NGUOI[1], '2026-11-04T00:15:00')).toMatchObject({ canHoi: false, hien: false, loiNhan: '' });
  });

  it('tắt thì không hiện nữa; trangChu mang kèm trạng thái nhắc ngủ của chính mình', () => {
    luu({ bat: true, emails: [NGUOI[0]] });
    vi.setSystemTime(gio('2026-11-03T23:50:00'));
    expect(goiAs(NGUOI[0], 'trangChu').data.nhacNgu.hien).toBe(true);
    expect(goiAs(NGUOI[1], 'trangChu').data.nhacNgu.hien).toBe(false);
    luu({ bat: false, emails: [NGUOI[0]] });
    expect(goiAs(NGUOI[0], 'trangChu').data.nhacNgu).toMatchObject({ canHoi: false, hien: false });
    expect(goiAs(CHU, 'admin.nhacNguLay').data.emails).toEqual([NGUOI[0]]); // vẫn nhớ danh sách để bật lại
  });

  it('ghi nhật ký; lưu lại nhiều lần không tạo dòng cấu hình trùng', () => {
    luu({ bat: true, emails: [NGUOI[0]] });
    luu({ bat: true, emails: [NGUOI[1]] });
    expect(mt.docTab('CauHinh').filter((r) => r.khoa === 'nhacNguEmails')).toHaveLength(1);
    expect(mt.docTab('NhatKy').some((n) => n.hanhDong === 'nhacNguLuu')).toBe(true);
  });
});
