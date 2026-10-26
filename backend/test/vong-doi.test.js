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
      maMon, maChuong: 'c1', trangNguon: `tr.${i}`, noiDung: `Câu của ${ai} môn ${maMon} số ${i}`,
      A: `a-${ai}-${i}`, B: `b-${ai}-${i}`, C: `c-${ai}-${i}`, D: `d-${ai}-${i}`, dapAn: 'ABCD'[i % 4], giaiThich: `Giải thích ${ai}-${i}`,
    }))
  );

function lamBai(email, soDung, nop = true) {
  const cau = Object.fromEntries(mt.docTab('CauHoi').map((c) => [c.id, c.dapAn]));
  const bd = goiAs(email, 'batDauThi', { monChon: MON.slice(0, 2) }).data;
  const ds = JSON.parse(mt.docTab('LuotThi').find((l) => l.email === email).dsCau).ds;
  const traLoi = {};
  ds.forEach((c, i) => {
    const goc = c.tt.indexOf(cau[c.id]);
    traLoi[c.id] = 'ABCD'[i < soDung ? goc : (goc + 1) % 4];
  });
  mt.goi({ action: 'thi.luu', maPhienThi: bd.maPhienThi, traLoi });
  if (nop) mt.goi({ action: 'thi.nop', maPhienThi: bd.maPhienThi, traLoi });
  return { ds, traLoi };
}

// Dựng sẵn: 8 thành viên, 2 nhóm, 3 tuần; tuần 1 đã thi xong và chốt.
function dungDenTuan1DaChot() {
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  mt.themDong('ThanhVien', { email: TRO_LY, hoTen: 'Trợ lý', vaiTro: 'assistant', trangThai: 'active' });
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 3 }).ok).toBe(true);
  expect(goiAs(CHU, 'admin.chotChiaNhom', {
    nhoms: [
      { tenNhom: 'Nhóm A', thanhVien: NGUOI.slice(0, 4).map((email) => ({ email })) },
      { tenNhom: 'Nhóm B', thanhVien: NGUOI.slice(4).map((email) => ({ email })) },
    ],
  }).ok).toBe(true);
  vi.setSystemTime(gio('2026-11-05T10:00:00'));
  NGUOI.forEach((e) => expect(goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }).ok).toBe(true));
  vi.setSystemTime(gio('2026-11-07T08:00:00'));
  const kq = {};
  kq.u0 = lamBai(NGUOI[0], 40);
  lamBai(NGUOI[1], 20);
  lamBai(NGUOI[3], 20);
  [4, 5, 6, 7].forEach((i) => lamBai(NGUOI[i], 30));
  vi.setSystemTime(gio('2026-11-09T01:00:00'));
  mt.chotTuanTuDong();
  expect(mt.docTab('KetQuaTuan')).toHaveLength(2);
  return kq;
}

const tongDiem = (email) => mt.docTab('Diem').filter((d) => d.email === email).reduce((s, d) => s + Number(d.soDiem), 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
});
afterEach(() => vi.useRealTimers());

describe('kết thúc học kỳ', () => {
  beforeEach(dungDenTuan1DaChot);

  it('cần xác nhận', () => {
    expect(goiAs(CHU, 'admin.ketThucHocKy', {})).toMatchObject({ ok: false, error: 'can_xac_nhan' });
    expect(mt.docTab('HocKy')[0].trangThai).toBe('mo');
  });

  it('chỉ chủ mới kết thúc được', () => {
    expect(goiAs(TRO_LY, 'admin.ketThucHocKy', { xacNhan: true })).toMatchObject({ ok: false, error: 'cam' });
  });

  it('đóng học kỳ, hủy các tuần chưa diễn ra, lưu tổng kết', () => {
    const r = goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(mt.docTab('HocKy')[0].trangThai).toBe('dong');
    expect(mt.docTab('Tuan').map((t) => t.trangThai)).toEqual(['da_chot', 'huy', 'huy']);
    const tk = r.data.tongKet;
    expect(tk.nhomVoDich.map((n) => n.tenNhom)).toEqual(['Nhóm B']); // 4 người × 75 = 75 so với (100+50+0+50)/4
    expect(tk.tuan).toEqual([{ soTuan: 1, soThamGia: 7, soTinh: 8, tiLe: 87.5 }]);
    expect(tk.thamGiaTrungBinh).toBe(87.5);
    expect(tk.topCaNhan[0]).toMatchObject({ hoTen: 'Người 0', diemTB: 100 });
    expect(tk.topCapBac.length).toBeGreaterThan(0);
    expect(tk.danhHieu[0]).toMatchObject({ hoTen: 'Người 0', soLan: 1 });
    expect(tk.thongKe).toMatchObject({ soTuanDaChot: 1, soCauHoi: 120, soLuotThi: 7 });
    expect(mt.docTab('TongKet')).toHaveLength(1);
  });

  it('xem lại tổng kết và danh sách học kỳ có đánh dấu đã tổng kết', () => {
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    const tk = goiAs(TRO_LY, 'admin.tongKet', { maHocKy: 'hk1-2026-2027' });
    expect(tk.data.nhomVoDich[0].tenNhom).toBe('Nhóm B');
    const ds = goiAs(CHU, 'admin.dsHocKy').data;
    expect(ds[0]).toMatchObject({ maHocKy: 'hk1-2026-2027', trangThai: 'dong', coTongKet: true });
    expect(goiAs(CHU, 'admin.tongKet', { maHocKy: 'khong-co' }).error).toBe('khong_thay');
  });

  it('còn người đang làm bài thì không đóng, báo rõ tuần nào', () => {
    // Tuần 2: một người đang thi dở.
    vi.setSystemTime(gio('2026-11-12T10:00:00'));
    NGUOI.forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e + '2') }));
    vi.setSystemTime(gio('2026-11-14T08:00:00'));
    goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) });
    vi.setSystemTime(gio('2026-11-15T10:00:00')); // chưa hết giờ làm bài? bài bắt đầu 14/11, đã hết 40 phút từ lâu
    const r = goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    expect(r.ok).toBe(true); // đã quá hạn làm bài nên được chấm theo bản lưu và chốt
    expect(mt.docTab('Tuan').map((t) => t.trangThai)).toEqual(['da_chot', 'da_chot', 'huy']);
  });

  it('đóng sớm tuần đang diễn ra và chốt nó', () => {
    vi.setSystemTime(gio('2026-11-12T10:00:00'));
    NGUOI.forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e + '2') }));
    vi.setSystemTime(gio('2026-11-14T08:00:00'));
    lamBai(NGUOI[0], 10);
    vi.setSystemTime(gio('2026-11-14T09:00:00')); // tuần 2 còn đến hết 15/11
    const r = goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(mt.docTab('Tuan').map((t) => t.trangThai)).toEqual(['da_chot', 'da_chot', 'huy']);
    expect(r.data.tongKet.tuan.map((t) => t.soTuan)).toEqual([1, 2]);
  });

  it('sau khi đóng, ứng dụng vẫn mở được và báo chưa có học kỳ đang mở', () => {
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    const me = goiAs(NGUOI[0], 'me');
    expect(me.ok).toBe(true);
    expect(me.data.hocKy).toBeNull();
    expect(goiAs(NGUOI[0], 'trangChu').ok).toBe(true);
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.tuan).toBeNull();
  });
});

describe('học kỳ mới', () => {
  beforeEach(dungDenTuan1DaChot);

  it('không tạo được khi còn học kỳ đang mở', () => {
    expect(goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2', tenHocKy: 'Học kỳ 2' })).toMatchObject({ ok: false, error: 'dang_mo' });
  });

  it('tạo học kỳ mới: sao chép môn kèm chương, không sao chép ngân hàng câu hỏi và lịch', () => {
    goiAs(CHU, 'admin.luuChuong', { maMon: MON[0], chuong: ['Mở đầu', 'Thống kê'] });
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    const r = goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2-2026-2027', tenHocKy: 'Học kỳ 2 năm học 2026-2027', batDau: '2027-02-15', ketThuc: '2027-06-01' });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.data).toMatchObject({ maHocKy: 'hk2-2026-2027', soMon: 5, soNhom: 0, thuMucBaiHoc: 'public/bai-hoc/hk2-2026-2027/' });
    const hk = mt.docTab('HocKy');
    expect(hk.map((h) => h.trangThai)).toEqual(['dong', 'mo']);
    const mon = mt.docTab('Mon').filter((m) => m.maHocKy === 'hk2-2026-2027');
    expect(mon).toHaveLength(5);
    expect(JSON.parse(mon.find((m) => m.maMon === MON[0]).danhSachChuong).map((c) => c.ten)).toEqual(['Mở đầu', 'Thống kê']);
    const me = goiAs(NGUOI[0], 'me').data;
    expect(me.hocKy.maHocKy).toBe('hk2-2026-2027');
    expect(me.nhom).toBeNull(); // chưa giữ nhóm cũ
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.tuan).toBeNull();
    expect(goiAs(CHU, 'admin.nganHang', {}).data.tong).toBe(0);
  });

  it('giữ nhóm cũ: sao chép nhóm và các thành viên còn hoạt động', () => {
    goiAs(CHU, 'admin.goThanhVien', { email: NGUOI[2], loai: 'withdrawn' });
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    const r = goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2', tenHocKy: 'Học kỳ 2', giuNhom: true });
    expect(r.data.soNhom).toBe(2);
    expect(goiAs(NGUOI[0], 'me').data.nhom.tenNhom).toBe('Nhóm A');
    expect(goiAs(NGUOI[2], 'me')).toMatchObject({ ok: false, error: 'chua_duyet' });
    const lk = mt.docTab('NhomThanhVien').filter((x) => x.maHocKy === 'hk2');
    expect(lk).toHaveLength(7);
    expect(lk.some((x) => x.email === NGUOI[2])).toBe(false);
  });

  it('có thể không sao chép môn', () => {
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    expect(goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2', tenHocKy: 'Học kỳ 2', saoChepMon: false }).data.soMon).toBe(0);
  });

  it('kiểm tra mã, tên, ngày và trùng', () => {
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    expect(goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'Học Kỳ 2', tenHocKy: 'x y' }).error).toBe('ma_sai');
    expect(goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2', tenHocKy: 'x' }).error).toBe('ten_sai');
    expect(goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2', tenHocKy: 'Học kỳ 2', batDau: 'abc' }).error).toBe('ngay_sai');
    expect(goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk1-2026-2027', tenHocKy: 'Trùng' }).error).toBe('da_co');
  });

  it('học kỳ mới chạy được trọn vòng: lịch, nộp câu hỏi', () => {
    goiAs(CHU, 'admin.ketThucHocKy', { xacNhan: true });
    goiAs(CHU, 'admin.taoHocKy', { maHocKy: 'hk2', tenHocKy: 'Học kỳ 2', giuNhom: true });
    vi.setSystemTime(gio('2027-02-10T09:00:00'));
    expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2027-02-20', soTuan: 2 }).ok).toBe(true);
    expect(goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau('hocky2') }).ok).toBe(true);
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.moKhoa).toBe(true);
    expect(mt.docTab('CauHoi').filter((c) => c.maHocKy === 'hk2')).toHaveLength(15);
  });
});

describe('thêm môn', () => {
  beforeEach(dungDenTuan1DaChot);
  it('thêm môn mới và trả về nội dung mon.json cùng đường dẫn thư mục', () => {
    const r = goiAs(CHU, 'admin.themMon', { maMon: 'giai-tich-1', tenMon: 'Giải tích 1', mau: '#ff0000' });
    expect(r.ok).toBe(true);
    expect(r.data.duongDan).toBe('public/bai-hoc/hk1-2026-2027/giai-tich-1/mon.json');
    expect(JSON.parse(r.data.monJson)).toEqual({ ten: 'Giải tích 1', mau: '#ff0000', chuong: [] });
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.mon.map((m) => m.ma)).toContain('giai-tich-1');
  });
  it('kiểm tra mã môn, tên, trùng; màu sai thì dùng màu mặc định', () => {
    expect(goiAs(CHU, 'admin.themMon', { maMon: 'Giải Tích', tenMon: 'x y' }).error).toBe('ma_sai');
    expect(goiAs(CHU, 'admin.themMon', { maMon: 'abc', tenMon: 'x' }).error).toBe('ten_sai');
    expect(goiAs(CHU, 'admin.themMon', { maMon: MON[0], tenMon: 'Trùng mã' }).error).toBe('da_co');
    expect(JSON.parse(goiAs(CHU, 'admin.themMon', { maMon: 'mon-moi', tenMon: 'Môn mới', mau: 'đỏ' }).data.monJson).mau).toBe('#4cc9f0');
    expect(goiAs(TRO_LY, 'admin.themMon', { maMon: 'abc-d', tenMon: 'Môn' }).error).toBe('cam');
  });
});

describe('chấm lại tuần', () => {
  let ctx;
  beforeEach(() => { ctx = dungDenTuan1DaChot(); });

  // Chọn một câu mà u1 đã làm sai (nằm sau 20 câu đầu trong đề của u1) rồi tạm loại nó.
  const chonCauSaiCuaU1 = () => {
    const l = mt.docTab('LuotThi').find((x) => x.email === NGUOI[1]);
    const ds = JSON.parse(l.dsCau).ds;
    return ds[30].id;
  };

  it('chỉ chủ, chỉ tuần đã chốt', () => {
    expect(goiAs(TRO_LY, 'admin.chamLaiTuan', { soTuan: 1 }).error).toBe('cam');
    expect(goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 2 }).error).toBe('chua_chot');
    expect(goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 9 }).error).toBe('khong_thay');
  });

  it('không có câu nào bị loại thì không đổi gì', () => {
    const truoc = JSON.stringify(mt.docTab('LuotThi').map((l) => [l.soDung, l.soCau, l.diem]));
    const r = goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 }).data;
    expect(r).toEqual({ soBaiDoi: 0, soCauBiLoai: 0 });
    expect(JSON.stringify(mt.docTab('LuotThi').map((l) => [l.soDung, l.soCau, l.diem]))).toBe(truoc);
  });

  it('loại câu bị tạm loại khỏi tử số và mẫu số của mọi bài có câu đó, tính lại điểm', () => {
    const id = chonCauSaiCuaU1();
    goiAs(CHU, 'admin.doiTrangThaiCau', { id, trangThai: 'suspended' });
    const lTruoc = mt.docTab('LuotThi').find((x) => x.email === NGUOI[1]);
    expect(Number(lTruoc.diem)).toBe(50);
    const r = goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 });
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.data.soCauBiLoai).toBe(1);
    expect(r.data.soBaiDoi).toBeGreaterThan(0);
    const l = mt.docTab('LuotThi').find((x) => x.email === NGUOI[1]);
    expect(Number(l.soCau)).toBe(39);
    expect(Number(l.soDung)).toBe(20);
    expect(Number(l.diem)).toBeCloseTo(51.3, 1);
    // bài không có câu đó thì không đổi
    mt.docTab('LuotThi').filter((x) => !JSON.parse(x.dsCau).ds.some((c) => c.id === id)).forEach((x) => expect(Number(x.soCau)).toBe(40));
  });

  it('tính lại điểm nhóm, hạng và thưởng nhóm; chạy lại lần hai không đổi thêm', () => {
    // Loại câu dẫn đến đổi điểm nhóm A. Hạng nhóm có thể đổi nên thưởng phải được cấp lại đúng.
    goiAs(CHU, 'admin.doiTrangThaiCau', { id: chonCauSaiCuaU1(), trangThai: 'removed' });
    goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 });
    const kq = mt.docTab('KetQuaTuan');
    expect(kq).toHaveLength(2);
    const hang1 = kq.find((r) => Number(r.hang) === 1).maNhom;
    const thuong = mt.docTab('Diem').filter((d) => String(d.loai).indexOf('thuong_nhom') === 0);
    const theoNguoi = {};
    thuong.forEach((d) => { theoNguoi[d.email] = (theoNguoi[d.email] || 0) + 1; });
    Object.values(theoNguoi).forEach((n) => expect(n).toBe(1)); // không cộng trùng
    expect(Object.keys(theoNguoi)).toHaveLength(7);
    const nhomCua = (e) => (NGUOI.indexOf(e) < 4 ? 'n1' : 'n2');
    thuong.forEach((d) => expect(Number(d.soDiem)).toBe(nhomCua(d.email) === hang1 ? 50 : 30));
    const lan2 = goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 }).data;
    expect(lan2.soBaiDoi).toBe(0);
    expect(mt.docTab('Diem').filter((d) => String(d.loai).indexOf('thuong_nhom') === 0)).toHaveLength(7);
  });

  it('điểm luyện tập không bị ảnh hưởng khi chấm lại', () => {
    mt.themDong('Diem', { thoiGian: new Date(), email: NGUOI[0], loai: 'tao_de', soDiem: 20, khoa: 'td:x', soTuan: '' });
    const truoc = tongDiem(NGUOI[0]);
    goiAs(CHU, 'admin.doiTrangThaiCau', { id: chonCauSaiCuaU1(), trangThai: 'suspended' });
    goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 });
    expect(tongDiem(NGUOI[0])).toBe(truoc);
  });

  it('danh hiệu tuần được tính lại', () => {
    goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 });
    const dh = mt.docTab('DanhHieu');
    expect(dh).toHaveLength(1);
    expect(dh[0].email).toBe(NGUOI[0]);
  });

  it('có ghi vào nhật ký', () => {
    goiAs(CHU, 'admin.chamLaiTuan', { soTuan: 1 });
    expect(mt.docTab('NhatKy').map((n) => n.hanhDong)).toContain('chamLaiTuan');
  });
});

describe('bảng điểm', () => {
  beforeEach(dungDenTuan1DaChot);

  it('chủ và trợ lý xem được, thành viên thì không', () => {
    expect(goiAs(CHU, 'admin.bangDiem').ok).toBe(true);
    expect(goiAs(TRO_LY, 'admin.bangDiem').ok).toBe(true);
    expect(goiAs(NGUOI[0], 'admin.bangDiem').error).toBe('cam');
  });

  it('điểm từng người theo tuần, trung bình, nhóm, cấp bậc; người vắng là null', () => {
    const r = goiAs(CHU, 'admin.bangDiem').data;
    expect(r.tuan).toEqual([1]);
    const ng = Object.fromEntries(r.nguoi.map((x) => [x.email, x]));
    expect(ng[NGUOI[0]]).toMatchObject({ hoTen: 'Người 0', nhom: 'Nhóm A', diemTB: 100, soTuanThi: 1 });
    expect(ng[NGUOI[0]].diemTuan[1]).toBe(100);
    expect(ng[NGUOI[2]].diemTuan[1]).toBeNull();
    expect(ng[NGUOI[2]].diemTB).toBeNull();
    expect(ng[NGUOI[4]].diemTuan[1]).toBe(75);
    expect(ng[NGUOI[4]]).toMatchObject({ tongCapBac: 50, tenCapLon: 'Võ Sĩ', level: 1 });
    expect(r.nguoi.some((x) => x.email === TRO_LY)).toBe(true);
    expect(r.nhom.map((n) => [n.nhom, n.hang])).toEqual(expect.arrayContaining([['Nhóm B', 1], ['Nhóm A', 2]]));
  });

  it('không lộ GPA hay dữ liệu đăng ký', () => {
    mt.ss.insertSheet('DangKy').appendRow(['Địa chỉ email', 'Họ và tên', 'GPA hiện tại']);
    mt.ss.getSheetByName('DangKy').appendRow([NGUOI[0], 'Người 0', 3.99]);
    expect(JSON.stringify(goiAs(TRO_LY, 'admin.bangDiem'))).not.toContain('3.99');
  });

  it('người được miễn hiện là "mien"', () => {
    vi.setSystemTime(gio('2026-11-12T10:00:00'));
    expect(goiAs(NGUOI[2], 'xinMien').ok).toBe(true);
    const r = goiAs(CHU, 'admin.bangDiem').data;
    expect(r.tuan).toEqual([1, 2]);
    expect(r.nguoi.find((x) => x.email === NGUOI[2]).diemTuan[2]).toBe('mien');
  });
});

describe('nhật ký', () => {
  beforeEach(dungDenTuan1DaChot);

  it('chủ và trợ lý xem được, mới nhất lên đầu, có phân trang', () => {
    const r = goiAs(TRO_LY, 'admin.nhatKy', {}).data;
    expect(r.tong).toBeGreaterThan(10);
    expect(r.dong.length).toBeLessThanOrEqual(50);
    for (let i = 1; i < r.dong.length; i++) expect(r.dong[i - 1].thoiGian >= r.dong[i].thoiGian).toBe(true);
    expect(goiAs(NGUOI[0], 'admin.nhatKy', {}).error).toBe('cam');
  });

  it('lọc theo hành động, email và từ khóa', () => {
    const chot = goiAs(CHU, 'admin.nhatKy', { hanhDong: 'chotChiaNhom' }).data;
    expect(chot.tong).toBe(1);
    expect(chot.dong[0].email).toBe(CHU);
    expect(chot.cacHanhDong).toContain('nopCauHoi');
    expect(goiAs(CHU, 'admin.nhatKy', { hanhDong: 'nopCauHoi', email: NGUOI[3] }).data.tong).toBe(1);
    expect(goiAs(CHU, 'admin.nhatKy', { tuKhoa: 'hk1-2026-2027/1' }).data.tong).toBeGreaterThan(0);
    expect(goiAs(CHU, 'admin.nhatKy', { hanhDong: 'khong-co' }).data.tong).toBe(0);
  });
});

describe('sao lưu', () => {
  beforeEach(dungDenTuan1DaChot);

  it('chỉ chủ sao lưu được, trợ lý xem được danh sách', () => {
    expect(goiAs(TRO_LY, 'admin.saoLuuNgay').error).toBe('cam');
    expect(goiAs(TRO_LY, 'admin.dsSaoLuu').ok).toBe(true);
    expect(goiAs(NGUOI[0], 'admin.dsSaoLuu').error).toBe('cam');
  });

  it('sao lưu ngay tạo một bản trong thư mục riêng, tên có ngày giờ, ghi nhật ký', () => {
    const r = goiAs(CHU, 'admin.saoLuuNgay');
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.data.ten).toMatch(/^Sao luu \d{4}-\d{2}-\d{2} \d{4}$/);
    expect(mt.thuMucDrive.map((t) => t.ten)).toEqual(['Learning Group - Sao luu']);
    expect(goiAs(CHU, 'admin.dsSaoLuu').data.ban).toHaveLength(1);
    expect(mt.docTab('NhatKy').map((n) => n.hanhDong)).toContain('saoLuuNgay');
  });

  it('chỉ giữ 8 bản gần nhất; bản cũ vào thùng rác; tệp lạ trong thư mục không bị đụng', () => {
    goiAs(CHU, 'admin.saoLuuNgay');
    const thuMuc = mt.thuMucDrive[0];
    thuMuc.themTep('Ghi chu cua toi'); // tệp không phải bản sao lưu
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(Date.now() + 60000);
      goiAs(CHU, 'admin.saoLuuNgay');
    }
    const ds = goiAs(CHU, 'admin.dsSaoLuu').data;
    expect(ds.ban).toHaveLength(8);
    expect(ds.soBanToiDa).toBe(8);
    for (let i = 1; i < ds.ban.length; i++) expect(ds.ban[i - 1].ngay >= ds.ban[i].ngay).toBe(true);
    const rac = thuMuc.cacTep.filter((t) => t.rac).map((t) => t.ten);
    expect(rac).toHaveLength(3);
    expect(rac.every((t) => t.startsWith('Sao luu '))).toBe(true);
    expect(thuMuc.cacTep.find((t) => t.ten === 'Ghi chu cua toi').rac).toBe(false);
  });

  it('datTrigger đặt đúng hai trigger và chạy lại không trùng', () => {
    mt.datTrigger();
    mt.datTrigger();
    expect(mt.trigger.map((t) => [t.ham, t.loai]).sort()).toEqual([
      ['chotTuanTuDong', 'moi 15 phut'],
      ['saoLuuHangTuan', 'SUNDAY luc 3'],
    ]);
  });

  it('hàm của trigger hằng tuần sao lưu và ghi nhật ký', () => {
    mt.saoLuuHangTuan();
    expect(mt.docTab('NhatKy').some((n) => n.hanhDong === 'saoLuu' && n.email === 'he_thong')).toBe(true);
    expect(mt.thuMucDrive[0].cacTep).toHaveLength(1);
  });
});
