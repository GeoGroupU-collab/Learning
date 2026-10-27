import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taoMoiTruong } from './gia-lap-appsscript.js';

const gio = (s) => Date.parse(s + '+07:00');
const CHU = 'chu@x.vn';
const TRO_LY = 'troly@x.vn';
const NGUOI = Array.from({ length: 4 }, (_, i) => `u${i}@x.vn`);
const MON = ['khoa-hoc-du-lieu', 'dia-chat-kien-truc', 'triet-hoc-mac-lenin'];

const TU = ['khoáng vật nào cứng nhất theo thang Mohs', 'đá trầm tích hình thành bằng cách nào', 'biến chất tiếp xúc xảy ra ở đâu', 'magma kết tinh phân đoạn cho khoáng gì trước', 'đứt gãy thuận khác nghịch ở điểm nào'];

let mt;
const goiAs = (email, action, payload = {}) => mt.goi({ action, idToken: mt.datToken(email), ...payload });

const taoBoCau = (email, tien = 'Câu') => {
  const ai = email.split('@')[0];
  return MON.flatMap((maMon) =>
    Array.from({ length: 5 }, (_, i) => ({
      maMon, maChuong: 'c1', trangNguon: `tr.${i}`, noiDung: `${tien} ${TU[i]} (${ai}, ${maMon})`,
      A: `a-${ai}-${i}`, B: `b-${ai}-${i}`, C: `c-${ai}-${i}`, D: `d-${ai}-${i}`, dapAn: 'ABCD'[i % 4], giaiThich: `Giải thích ${ai}-${i}`,
    }))
  );
};

const trangThaiDem = () => {
  const kq = {};
  mt.docTab('CauHoi').forEach((c) => { kq[c.trangThai] = (kq[c.trangThai] || 0) + 1; });
  return kq;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  mt = taoMoiTruong();
  mt.khoiTao();
  mt.datCauHinh('duyetCauHoiTruoc', true);
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  mt.themDong('ThanhVien', { email: TRO_LY, hoTen: 'Trợ lý', vaiTro: 'assistant', trangThai: 'active' });
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 2 }).ok).toBe(true);
  vi.setSystemTime(gio('2026-11-03T10:00:00'));
});
afterEach(() => vi.useRealTimers());

describe('nộp câu hỏi chờ duyệt', () => {
  it('câu mới nộp ở trạng thái chờ duyệt và vẫn mở khóa quyền thi cho người nộp', () => {
    const r = goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) });
    expect(r.ok).toBe(true);
    expect(r.data).toMatchObject({ soCau: 15, moKhoa: true, choDuyet: true });
    expect(trangThaiDem()).toEqual({ cho_duyet: 15 });
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.duyetTruoc).toBe(true);
  });

  it('tắt cấu hình duyệt thì vào ngân hàng ngay', () => {
    mt.datCauHinh('duyetCauHoiTruoc', false);
    goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) });
    expect(trangThaiDem()).toEqual({ active: 15 });
  });

  it('câu chờ duyệt chưa vào đề, duyệt xong mới vào', () => {
    NGUOI.forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
    const rut = () => goiAs(CHU, 'admin.xemTruocDeThi', { phanBo: [{ maMon: MON[0], soCau: 100 }] }).data.cau.length;
    expect(rut()).toBe(0);
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', loc: { maMon: MON[0] } });
    expect(rut()).toBe(4 * 5);
  });

  it('người nộp thấy lý do khi câu bị từ chối', () => {
    goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) });
    const id = mt.docTab('CauHoi')[0].id;
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'tu_choi', ids: [id], lyDo: 'Trùng câu có sẵn' });
    const mine = goiAs(NGUOI[0], 'cauHoiCuaToi').data;
    const ds = Array.isArray(mine) ? mine : mine.cau || mine.ds;
    const c = ds.find((x) => x.id === id);
    expect(c).toMatchObject({ trangThai: 'tu_choi', ghiChuDuyet: 'Trùng câu có sẵn' });
  });
});

describe('duyệt hàng loạt', () => {
  beforeEach(() => {
    NGUOI.slice(0, 3).forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
  });

  it('chỉ chủ duyệt được, thành viên và vai trò trợ lý cũ thì không', () => {
    expect(goiAs(NGUOI[0], 'admin.duyetCau', { quyetDinh: 'duyet', loc: {} })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(TRO_LY, 'admin.duyetCau', { quyetDinh: 'duyet', loc: {} })).toMatchObject({ ok: false, error: 'cam' });
    const r = goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', loc: { maMon: MON[1] } });
    expect(r.data).toMatchObject({ soCau: 15, trangThai: 'active' });
    expect(trangThaiDem()).toEqual({ cho_duyet: 30, active: 15 });
  });

  it('duyệt theo tác giả, theo danh sách id, và bỏ qua câu không còn chờ duyệt', () => {
    const r1 = goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', loc: { tacGia: NGUOI[0] } });
    expect(r1.data.soCau).toBe(15);
    const dongKhac = mt.docTab('CauHoi').filter((c) => c.trangThai === 'cho_duyet').slice(0, 3).map((c) => c.id);
    const r2 = goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', ids: [...dongKhac, mt.docTab('CauHoi')[0].id] });
    expect(r2.data.soCau).toBe(3); // câu đầu đã duyệt từ trước
    expect(trangThaiDem()).toEqual({ active: 18, cho_duyet: 27 });
  });

  it('quyết định không hợp lệ hoặc thiếu điều kiện thì báo lỗi', () => {
    expect(goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'xoa', loc: {} })).toMatchObject({ ok: false, error: 'quyet_dinh_sai' });
    expect(goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet' })).toMatchObject({ ok: false, error: 'thieu_dieu_kien' });
  });

  it('số câu chờ duyệt hiện trên trang chủ của quản trị và cập nhật sau khi duyệt', () => {
    expect(goiAs(CHU, 'trangChu').data.choDuyet).toBe(45);
    expect(goiAs(NGUOI[0], 'trangChu').data.choDuyet).toBeUndefined();
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', loc: { maMon: MON[0] } });
    expect(goiAs(CHU, 'trangChu').data.choDuyet).toBe(30);
    expect(goiAs(CHU, 'admin.nganHang', {}).data.soChoDuyet).toBe(30);
  });

  it('ghi nhật ký', () => {
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'tu_choi', loc: { maMon: MON[2] }, lyDo: 'Yếu' });
    expect(mt.docTab('NhatKy').some((n) => n.hanhDong === 'tuChoiCau')).toBe(true);
  });
});

describe('xuất đợt chờ duyệt', () => {
  it('chỉ chủ xuất được; tác giả đổi thành mã, không lộ email', () => {
    NGUOI.slice(0, 2).forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
    expect(goiAs(TRO_LY, 'admin.xuatChoDuyet', {})).toMatchObject({ ok: false, error: 'cam' });
    const r = goiAs(CHU, 'admin.xuatChoDuyet', {}).data;
    expect(r.meta).toMatchObject({ soChoDuyet: 30, soThamKhao: 0 });
    expect(r.cho).toHaveLength(30);
    expect(new Set(r.cho.map((c) => c.maTacGia))).toEqual(new Set(['T01', 'T02']));
    expect(JSON.stringify(r)).not.toContain('@x.vn');
    expect(r.cho[0]).toMatchObject({ quyetDinh: '', ghiChuDuyet: '' });
    expect(r.cho[0]).toHaveProperty('dapAn');
  });

  it('gợi ý câu nghi trùng trong đợt và với câu đã duyệt', () => {
    goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) });
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', loc: {} });
    // người thứ hai nộp câu gần như giống hệt người thứ nhất (hệ thống không cho nộp trùng tuyệt đối)
    const bo = taoBoCau(NGUOI[0]).map((c, i) => ({ ...c, noiDung: c.noiDung + ' nữa', A: `x${i}`, B: `y${i}`, C: `z${i}`, D: `w${i}` }));
    goiAs(NGUOI[1], 'nopCauHoi', { cauHoi: bo });
    const r = goiAs(CHU, 'admin.xuatChoDuyet', {}).data;
    expect(r.meta.soThamKhao).toBe(15);
    expect(r.cho).toHaveLength(15);
    expect(r.meta.soNghiTrung).toBe(15);
    r.cho.forEach((c) => expect(c.nghiTrung[0].doGiong).toBeGreaterThanOrEqual(0.7));
    const khong = goiAs(CHU, 'admin.xuatChoDuyet', { kemThamKhao: false }).data;
    expect(khong.thamKhao).toHaveLength(0);
    expect(khong.meta.soNghiTrung).toBe(0);
  });
});

describe('nhập kết quả rà soát', () => {
  beforeEach(() => {
    goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) });
  });

  it('quyetDinh duyệt hoặc từ chối trong file đổi trạng thái, xem trước có đếm', () => {
    const ds = mt.docTab('CauHoi');
    const rows = [
      { id: ds[0].id, quyetDinh: 'duyet' },
      { id: ds[1].id, quyetDinh: 'duyet', noiDung: 'Nội dung đã sửa lại cho rõ nghĩa hơn' },
      { id: ds[2].id, quyetDinh: 'tu_choi', ghiChuDuyet: 'Sai đáp án' },
      { id: ds[3].id, quyetDinh: '' },
    ];
    const xt = goiAs(CHU, 'admin.xemTruocNhap', { rows }).data;
    expect(xt).toMatchObject({ soDuyet: 2, soTuChoi: 1, khongDoi: 1 });
    expect(trangThaiDem()).toEqual({ cho_duyet: 15 }); // xem trước chưa ghi gì
    const nhap = goiAs(CHU, 'admin.nhapNganHang', { rows }).data;
    expect(nhap.daSua).toBe(3);
    const sau = mt.docTab('CauHoi');
    expect(sau[0].trangThai).toBe('active');
    expect(sau[1]).toMatchObject({ trangThai: 'active', noiDung: 'Nội dung đã sửa lại cho rõ nghĩa hơn' });
    expect(sau[2]).toMatchObject({ trangThai: 'tu_choi', ghiChuDuyet: 'Sai đáp án' });
    expect(sau[3].trangThai).toBe('cho_duyet');
  });

  it('duyệt một câu bị sửa hỏng định dạng thì bị chặn', () => {
    const id = mt.docTab('CauHoi')[0].id;
    const xt = goiAs(CHU, 'admin.xemTruocNhap', { rows: [{ id, quyetDinh: 'duyet', dapAn: 'Z' }] }).data;
    expect(xt.loi).toHaveLength(1);
    expect(xt.soDuyet).toBe(0);
  });
});

describe('dọn câu bị từ chối', () => {
  it('chỉ chủ, cần xác nhận, chỉ xóa câu bị từ chối của tuần đã đóng', () => {
    NGUOI.slice(0, 2).forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'duyet', loc: { tacGia: NGUOI[0] } });
    goiAs(CHU, 'admin.duyetCau', { quyetDinh: 'tu_choi', loc: { maMon: MON[0], tacGia: NGUOI[1] }, lyDo: 'Dở' });
    expect(trangThaiDem()).toEqual({ active: 15, tu_choi: 5, cho_duyet: 10 });
    expect(goiAs(TRO_LY, 'admin.donCauTuChoi', { xacNhan: true })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(CHU, 'admin.donCauTuChoi', {})).toMatchObject({ ok: false, error: 'can_xac_nhan' });
    // tuần 1 chưa đóng: giữ lại câu bị từ chối để người nộp vẫn đủ 15 câu, không mất quyền thi
    expect(goiAs(CHU, 'admin.donCauTuChoi', { xacNhan: true }).data).toEqual({ soCau: 0, giuLai: 5 });
    expect(goiAs(NGUOI[1], 'tuanHienTai').data.moKhoa).toBe(true);
    vi.setSystemTime(gio('2026-11-09T08:00:00')); // sau khi phòng thi tuần 1 đóng
    expect(goiAs(CHU, 'admin.donCauTuChoi', { xacNhan: true }).data).toEqual({ soCau: 5, giuLai: 0 });
    expect(trangThaiDem()).toEqual({ active: 15, cho_duyet: 10 });
    // các câu còn lại vẫn đọc được bình thường
    expect(goiAs(CHU, 'admin.nganHang', {}).data.soChoDuyet).toBe(10);
  });
});
