import { describe, it, expect, beforeEach } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const CHU = 'chu@x.vn';
const NGUOI = ['a@x.vn', 'b@x.vn'];
const MON = 'khoa-hoc-du-lieu';
let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });

const cau = (n, rieng = {}) => ({
  maMon: MON, maChuong: 'Chương 2', trangNguon: 'Đề C2A-05', noiDung: `Câu số ${n}: đoạn code in ra gì?\n\`\`\`\nprint(${n})\n\`\`\``,
  A: `${n}`, B: `${n + 1}`, C: `${n + 2}`, D: `${n + 3}`, dapAn: 'a', giaiThich: 'In ra giá trị n.', ...rieng,
});

beforeEach(() => {
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
});

describe('chủ thêm câu mới vào ngân hàng', () => {
  it('chỉ chủ mới thêm được', () => {
    expect(goiAs(NGUOI[0], 'admin.nhapCauMoi', { rows: [cau(1)] })).toMatchObject({ ok: false, error: 'cam' });
  });

  it('thêm câu đang dùng, tuần 0, tác giả chung; giữ nguyên xuống dòng và khối code; đáp án chữ thường được chuẩn hóa', () => {
    const r = goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(1), cau(5)] });
    expect(r.data).toEqual({ daThem: 2, soTrung: 0 });
    const ds = mt.docTab('CauHoi');
    expect(ds).toHaveLength(2);
    expect(ds[0]).toMatchObject({ maMon: MON, maChuong: 'Chương 2', trangThai: 'active', tacGia: 'ngan-hang-chung', soTuan: 0, dapAn: 'A' });
    expect(ds[0].noiDung).toContain('```\nprint(1)\n```');
    expect(goiAs(CHU, 'admin.nganHang', {}).data.tong).toBe(2);
  });

  it('chiXem không ghi gì và báo số câu hợp lệ, trùng, lỗi', () => {
    goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(1)] });
    const r = goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(1), cau(2), cau(3, { dapAn: 'Z' })], chiXem: true }).data;
    expect(r).toMatchObject({ soHopLe: 1, soTrung: 1, soLoi: 1 });
    expect(mt.docTab('CauHoi')).toHaveLength(1);
  });

  it('có dòng lỗi thì không thêm câu nào', () => {
    const r = goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(1), cau(2, { A: 'x', B: 'x' }), cau(3, { maMon: 'mon-la' })] });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('cau_sai');
    expect(r.message).toContain('Câu 2');
    expect(r.message).toContain('Câu 3');
    expect(mt.docTab('CauHoi')).toHaveLength(0);
  });

  it('đáp án chỉ khác nhau ở khoảng trắng vẫn hợp lệ (câu về code), trùng chữ thì bị chặn', () => {
    expect(goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(1, { A: '[   An][8.5]', B: '[An   ][8.5]', C: '[   An][8.4]', D: '[An   ][8.4]' })] }).ok).toBe(true);
    expect(goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(2, { A: 'a', B: 'a', C: 'c', D: 'd' })] }).ok).toBe(false);
  });

  it('giới hạn độ dài và số lượng', () => {
    expect(goiAs(CHU, 'admin.nhapCauMoi', { rows: [cau(1, { noiDung: 'x'.repeat(601) })] }).ok).toBe(false);
    expect(goiAs(CHU, 'admin.nhapCauMoi', { rows: [] })).toMatchObject({ ok: false, error: 'du_lieu_sai' });
    expect(goiAs(CHU, 'admin.nhapCauMoi', { rows: Array.from({ length: 501 }, (_, i) => cau(i)) })).toMatchObject({ ok: false, error: 'du_lieu_sai' });
  });

  it('câu chung vào đề của mọi thành viên (không ai là tác giả) và không bị loại khi dọn câu', () => {
    goiAs(CHU, 'admin.nhapCauMoi', { rows: Array.from({ length: 12 }, (_, i) => cau(i * 10)) });
    mt.datCauHinh('anCauTuanChuaDong', true);
    const r = goiAs(NGUOI[0], 'taoDe.bat', { maMon: MON });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.data.cauHoi).toHaveLength(12);
    expect(JSON.stringify(r.data)).not.toContain('"dapAn":"A"'); // không lộ đáp án đúng khi đang làm
  });
});
