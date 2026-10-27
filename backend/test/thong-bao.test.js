import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const NGUOI = ['a@x.vn', 'b@x.vn', 'c@x.vn', 'd@x.vn'];
const HK = 'hk1-2026-2027';

let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-03T10:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  mt.themDong('Nhom', { maHocKy: HK, maNhom: 'n1', tenNhom: 'Nhóm 1' });
  mt.themDong('Nhom', { maHocKy: HK, maNhom: 'n2', tenNhom: 'Nhóm 2' });
  [[NGUOI[0], 'n1'], [NGUOI[1], 'n1'], [NGUOI[2], 'n2']].forEach(([e, n]) => mt.themDong('NhomThanhVien', { maHocKy: HK, maNhom: n, email: e }));
});
afterEach(() => vi.useRealTimers());

const gui = (body) => goiAs(CHU, 'admin.guiThongBao', { tieuDe: 'Họp lớp', noiDung: 'Tối thứ Sáu 20h.', ...body });
const tieuDeCuaToi = (e) => goiAs(e, 'thongBao').data.map((t) => t.tieuDe);

describe('gửi thông báo', () => {
  it('chỉ chủ mới gửi, xem danh sách và xóa được', () => {
    expect(goiAs(NGUOI[0], 'admin.guiThongBao', { tieuDe: 'x', noiDung: 'y', loai: 'all' })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(NGUOI[0], 'admin.dsThongBao')).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(NGUOI[0], 'admin.xoaThongBao', { id: 'tb-1' })).toMatchObject({ ok: false, error: 'cam' });
  });

  it('thiếu tiêu đề, nội dung hoặc đối tượng sai thì báo lỗi', () => {
    expect(gui({ loai: 'all', tieuDe: '  ' })).toMatchObject({ ok: false, error: 'thieu_tieu_de' });
    expect(gui({ loai: 'all', noiDung: '' })).toMatchObject({ ok: false, error: 'thieu_noi_dung' });
    expect(gui({ loai: 'khac' })).toMatchObject({ ok: false, error: 'loai_sai' });
    expect(gui({ loai: 'nhom', maNhom: 'khong-co' })).toMatchObject({ ok: false, error: 'nhom_khong_co' });
    expect(gui({ loai: 'nguoi', dsEmail: ['ai-do@x.vn'] })).toMatchObject({ ok: false, error: 'thieu_nguoi' });
  });

  it('cả lớp: mọi người đều thấy', () => {
    expect(gui({ loai: 'all' }).ok).toBe(true);
    NGUOI.forEach((e) => expect(tieuDeCuaToi(e)).toEqual(['Họp lớp']));
  });

  it('theo nhóm: chỉ người trong nhóm đó thấy', () => {
    gui({ loai: 'nhom', maNhom: 'n1' });
    expect(tieuDeCuaToi(NGUOI[0])).toEqual(['Họp lớp']);
    expect(tieuDeCuaToi(NGUOI[1])).toEqual(['Họp lớp']);
    expect(tieuDeCuaToi(NGUOI[2])).toEqual([]);
    expect(tieuDeCuaToi(NGUOI[3])).toEqual([]); // chưa có nhóm
  });

  it('theo từng người: chỉ người được chọn thấy; bỏ qua email lạ và trùng', () => {
    gui({ loai: 'nguoi', dsEmail: [NGUOI[3], NGUOI[3].toUpperCase(), 'la@x.vn'] });
    expect(tieuDeCuaToi(NGUOI[3])).toEqual(['Họp lớp']);
    NGUOI.slice(0, 3).forEach((e) => expect(tieuDeCuaToi(e)).toEqual([]));
    const ds = goiAs(CHU, 'admin.dsThongBao').data;
    expect(ds[0].nguoiNhan).toBe('Người 3');
  });

  it('thành viên không thấy danh sách người nhận; mới nhất lên đầu', () => {
    gui({ loai: 'all', tieuDe: 'Cũ' });
    vi.setSystemTime(gio('2026-11-03T11:00:00'));
    gui({ loai: 'nguoi', dsEmail: [NGUOI[0]], tieuDe: 'Mới' });
    const r = goiAs(NGUOI[0], 'thongBao').data;
    expect(r.map((t) => t.tieuDe)).toEqual(['Mới', 'Cũ']);
    expect(r[0].rieng).toBe(true);
    expect(r[1].rieng).toBe(false);
    expect(JSON.stringify(r)).not.toContain('@x.vn');
  });

  it('nội dung độc hại chỉ là chữ: giữ nguyên, cắt độ dài', () => {
    gui({ loai: 'all', tieuDe: '<b>Đậm</b>'.padEnd(300, 'x') });
    const t = goiAs(NGUOI[0], 'thongBao').data[0];
    expect(t.tieuDe.length).toBe(100);
    expect(t.tieuDe.startsWith('<b>')).toBe(true); // giao diện luôn hiển thị bằng textContent
  });
});

describe('chấm báo chưa đọc và xóa', () => {
  it('trangChu trả thời điểm thông báo mới nhất cho từng người', () => {
    expect(goiAs(NGUOI[0], 'trangChu').data.tbMoiNhat).toBe(0);
    gui({ loai: 'nhom', maNhom: 'n1' });
    const tbMoi = Date.now();
    mt.datLaiDem();
    expect(goiAs(NGUOI[0], 'trangChu').data.tbMoiNhat).toBe(tbMoi);
    expect(goiAs(NGUOI[2], 'trangChu').data.tbMoiNhat).toBe(0);
  });

  it('chủ xóa thì mọi người không còn thấy', () => {
    const id = gui({ loai: 'all' }).data.id;
    expect(goiAs(CHU, 'admin.xoaThongBao', { id }).ok).toBe(true);
    expect(tieuDeCuaToi(NGUOI[0])).toEqual([]);
    expect(goiAs(CHU, 'admin.xoaThongBao', { id })).toMatchObject({ ok: false, error: 'khong_thay' });
  });

  it('ghi nhật ký gửi và xóa', () => {
    const id = gui({ loai: 'all' }).data.id;
    goiAs(CHU, 'admin.xoaThongBao', { id });
    const nk = mt.docTab('NhatKy').map((n) => n.hanhDong);
    expect(nk).toContain('guiThongBao');
    expect(nk).toContain('xoaThongBao');
  });
});

describe('tổng quan quản trị', () => {
  it('chỉ chủ gọi được và trả số câu chờ duyệt', () => {
    expect(goiAs(NGUOI[0], 'admin.tongQuan')).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(CHU, 'admin.tongQuan').data).toEqual({ choDuyet: 0 });
  });
});
