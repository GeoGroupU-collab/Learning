import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const NGUOI = Array.from({ length: 6 }, (_, i) => `u${i}@x.vn`);
const MON = ['khoa-hoc-du-lieu', 'dia-chat-kien-truc', 'triet-hoc-mac-lenin'];
const TU = ['khoáng vật nào cứng nhất', 'đá trầm tích hình thành ra sao', 'biến chất tiếp xúc ở đâu', 'magma kết tinh thế nào', 'đứt gãy thuận là gì'];
let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });
const boCau = (email) => MON.flatMap((maMon) => TU.map((tu, i) => ({ maMon, maChuong: 'c1', trangNguon: 'tr', noiDung: `${tu} (${email.split('@')[0]}, ${maMon})`, A: `a${i}`, B: `b${i}`, C: `c${i}`, D: `d${i}`, dapAn: 'A', giaiThich: '' })));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  mt.datCauHinh('khoaTaoDeKhiChuaNop', true);
  mt.themDong('ThanhVien', { email: CHU, hoTen: 'Chủ', vaiTro: 'owner', trangThai: 'active' });
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 2 }).ok).toBe(true);
  vi.setSystemTime(gio('2026-11-03T10:00:00'));
  // ngân hàng có sẵn câu của người khác (tuần 0, tác giả chung) để đủ câu tạo đề
  goiAs(CHU, 'admin.nhapCauMoi', { rows: TU.flatMap((tu, i) => Array.from({ length: 3 }, (_, k) => ({ maMon: MON[0], maChuong: 'c1', noiDung: `${tu} bản ${k}`, A: `a${i}${k}`, B: `b${i}${k}`, C: `c${i}${k}`, D: `d${i}${k}`, dapAn: 'A' }))) });
});
afterEach(() => vi.useRealTimers());

describe('khóa tự tạo đề khi chưa nộp đủ câu hỏi của tuần', () => {
  it('chưa nộp: thông tin báo khóa kèm số đã nộp, tạo đề bị từ chối', () => {
    const tt = goiAs(NGUOI[0], 'taoDe.thongTin').data;
    expect(tt.khoa).toMatchObject({ bi: true, daNop: 0, can: 15, soTuan: 1 });
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.khoaTaoDe).toBe(true); // để trang Bài học hiện thẻ khóa
    const r = goiAs(NGUOI[0], 'taoDe.bat', { maMon: MON[0] });
    expect(r).toMatchObject({ ok: false, error: 'khoa_tao_de' });
    expect(r.message).toContain('15');
  });

  it('nộp một phần thì vẫn khóa, đủ 15 câu thì mở khóa (kể cả khi câu còn chờ duyệt)', () => {
    mt.datCauHinh('duyetCauHoiTruoc', true);
    expect(goiAs(NGUOI[1], 'nopCauHoi', { cauHoi: boCau(NGUOI[1]) }).ok).toBe(true);
    expect(goiAs(NGUOI[1], 'taoDe.thongTin').data.khoa).toMatchObject({ bi: false, daNop: 15, can: 15 });
    expect(goiAs(NGUOI[1], 'tuanHienTai').data.khoaTaoDe).toBe(false);
    const r = goiAs(NGUOI[1], 'taoDe.bat', { maMon: MON[0] });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(goiAs(NGUOI[2], 'taoDe.bat', { maMon: MON[0] }).error).toBe('khoa_tao_de');
  });

  it('khóa cả đề do chủ phát hành', () => {
    const ids = goiAs(CHU, 'admin.xemTruocDeThi', { phanBo: [{ maMon: MON[0], soCau: 10 }] }).data.cau.map((c) => c.id);
    const idDe = goiAs(CHU, 'admin.luuDeThi', { tenDe: 'Đề ôn', dsIdCau: ids, trangThai: 'phat_hanh' }).data.idDe;
    expect(goiAs(NGUOI[0], 'taoDe.bat', { idDe }).error).toBe('khoa_tao_de');
  });

  it('chủ và người được miễn tuần không bị khóa', () => {
    expect(goiAs(CHU, 'taoDe.thongTin').data.khoa.bi).toBe(false);
    expect(goiAs(NGUOI[3], 'xinMien').ok).toBe(true);
    const tt = goiAs(NGUOI[3], 'taoDe.thongTin').data;
    expect(tt.khoa).toMatchObject({ bi: false, mien: true });
    expect(goiAs(NGUOI[3], 'taoDe.bat', { maMon: MON[0] }).ok).toBe(true);
  });

  it('đề đang làm dở vẫn làm tiếp được; tắt cấu hình thì không khóa', () => {
    mt.datCauHinh('khoaTaoDeKhiChuaNop', false);
    expect(goiAs(NGUOI[4], 'taoDe.bat', { maMon: MON[0] }).ok).toBe(true);
    mt.datCauHinh('khoaTaoDeKhiChuaNop', true);
    expect(goiAs(NGUOI[4], 'taoDe.bat', { maMon: MON[0] }).ok).toBe(true); // trả lại đề đang làm
    expect(goiAs(NGUOI[5], 'taoDe.thongTin').data.khoa.bi).toBe(true);
  });

  it('sang tuần mới phải nộp lại câu của tuần mới', () => {
    goiAs(NGUOI[1], 'nopCauHoi', { cauHoi: boCau(NGUOI[1]) });
    expect(goiAs(NGUOI[1], 'taoDe.thongTin').data.khoa.bi).toBe(false);
    vi.setSystemTime(gio('2026-11-10T10:00:00')); // tuần 1 đã đóng, tuần 2 đang nhận câu hỏi
    expect(goiAs(NGUOI[1], 'taoDe.thongTin').data.khoa).toMatchObject({ bi: true, daNop: 0, soTuan: 2 });
  });
});
