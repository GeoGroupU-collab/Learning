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

function dungSan() {
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  mt.themDong('ThanhVien', { email: TRO_LY, hoTen: 'Trợ lý', vaiTro: 'assistant', trangThai: 'active' });
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 1 }).ok).toBe(true);
  expect(goiAs(CHU, 'admin.chotChiaNhom', {
    nhoms: [
      { tenNhom: 'Nhóm A', thanhVien: NGUOI.slice(0, 4).map((email) => ({ email })) },
      { tenNhom: 'Nhóm B', thanhVien: NGUOI.slice(4).map((email) => ({ email })) },
    ],
  }).ok).toBe(true);
}

function nopHetCauHoi() {
  vi.setSystemTime(gio('2026-11-05T10:00:00'));
  NGUOI.forEach((e) => expect(goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }).ok).toBe(true));
}

// Cho một người thi: soDung câu đầu đúng, phần còn lại sai. Trả về dữ liệu bài.
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
  return { bd, ds, traLoi };
}

const tongDiem = (email) => mt.docTab('Diem').filter((d) => d.email === email).reduce((s, d) => s + Number(d.soDiem), 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-03T09:00:00'));
  dungSan();
});
afterEach(() => vi.useRealTimers());

describe('luyện tập ngoài sự kiện', () => {
  beforeEach(nopHetCauHoi);
  const luyen = (email, soTraLoi = 10) => {
    const bat = goiAs(email, 'luyenTap.bat', { maMon: MON[0] });
    expect(bat.ok, JSON.stringify(bat)).toBe(true);
    const traLoi = Object.fromEntries(bat.data.cauHoi.slice(0, soTraLoi).map((c) => [c.id, 'A']));
    return goiAs(email, 'luyenTap.nop', { maLuot: bat.data.maLuot, traLoi });
  };

  it('đề luyện tập: 10 câu một môn, không đáp án đúng, không có câu của mình', () => {
    vi.setSystemTime(gio('2026-11-03T09:00:00'));
    const bat = goiAs(NGUOI[0], 'luyenTap.bat', { maMon: MON[0] });
    expect(bat.data.cauHoi).toHaveLength(10);
    expect(JSON.stringify(bat.data)).not.toContain('"dung"');
    bat.data.cauHoi.forEach((c) => {
      expect(c.maMon).toBe(MON[0]);
      expect(c.noiDung).not.toContain(`Câu của ${NGUOI[0]}`);
    });
  });

  it('mỗi lượt +20 điểm; đang mở thì gọi lại trả đúng lượt đó', () => {
    const bat1 = goiAs(NGUOI[0], 'luyenTap.bat', { maMon: MON[0] });
    const bat2 = goiAs(NGUOI[0], 'luyenTap.bat', { maMon: MON[1] });
    expect(bat2.data.maLuot).toBe(bat1.data.maLuot);
    const nop = goiAs(NGUOI[0], 'luyenTap.nop', { maLuot: bat1.data.maLuot, traLoi: Object.fromEntries(bat1.data.cauHoi.map((c) => [c.id, 'A'])) });
    expect(nop.data.diemThuong).toBe(20);
    expect(nop.data.cap).toMatchObject({ tong: 20, level: 1 });
    expect(tongDiem(NGUOI[0])).toBe(20);
    // nộp lại không cộng thêm
    const lai = goiAs(NGUOI[0], 'luyenTap.nop', { maLuot: bat1.data.maLuot, traLoi: {} });
    expect(lai.data.diemThuong).toBe(20);
    expect(tongDiem(NGUOI[0])).toBe(20);
  });

  it('xem lại sau khi nộp có đáp án đúng và giải thích', () => {
    const r = luyen(NGUOI[0]);
    expect(r.data.cauHoi).toHaveLength(10);
    r.data.cauHoi.forEach((c) => {
      expect('ABCD').toContain(c.dung);
      expect(c.giaiThich).toContain('Giải thích');
      expect(c.laDung).toBe(c.chon === c.dung);
    });
  });

  it('trần 120 điểm mỗi tuần, sang tuần mới được cộng lại', () => {
    const diem = [];
    for (let i = 0; i < 7; i++) diem.push(luyen(NGUOI[1]).data.diemThuong);
    expect(diem).toEqual([20, 20, 20, 20, 20, 20, 0]);
    expect(tongDiem(NGUOI[1])).toBe(120);
    vi.setSystemTime(gio('2026-11-09T08:00:00')); // Thứ Hai tuần sau
    expect(luyen(NGUOI[1]).data.diemThuong).toBe(20);
    expect(tongDiem(NGUOI[1])).toBe(140);
  });

  it('trần tuần tính theo Thứ Hai đến Chủ nhật giờ Việt Nam', () => {
    vi.setSystemTime(gio('2026-11-08T23:00:00')); // Chủ nhật
    for (let i = 0; i < 6; i++) luyen(NGUOI[2]);
    vi.setSystemTime(gio('2026-11-08T23:59:00'));
    expect(luyen(NGUOI[2]).data.diemThuong).toBe(0);
  });

  it('trả lời ít hơn một nửa thì không được cộng điểm', () => {
    expect(luyen(NGUOI[3], 4).data.diemThuong).toBe(0);
    expect(tongDiem(NGUOI[3])).toBe(0);
    expect(luyen(NGUOI[3], 5).data.diemThuong).toBe(20);
  });

  it('chọn môn không có trong học kỳ bị từ chối', () => {
    expect(goiAs(NGUOI[0], 'luyenTap.bat', { maMon: 'khong-co' }).error).toBe('mon_sai');
  });

  it('thông tin luyện tập hiện điểm tuần này và cấp', () => {
    luyen(NGUOI[4]);
    const tt = goiAs(NGUOI[4], 'luyenTap.thongTin').data;
    expect(tt).toMatchObject({ diemTuanNay: 20, diemToiDaTuan: 120, diemMoiLuot: 20, soCauMoiLuot: 10 });
    expect(tt.cap.level).toBe(1);
    expect(tt.mon.length).toBeGreaterThan(0);
  });

  it('đủ 500 điểm thì lên Võ Sư (level 6)', () => {
    mt.themDong('Diem', { thoiGian: new Date(), email: NGUOI[5], loai: 'thuong_nhom_nhat', soDiem: 500, khoa: 'x1' });
    const c = goiAs(NGUOI[5], 'luyenTap.thongTin').data.cap;
    expect(c).toMatchObject({ level: 6, tenCapLon: 'Võ Sư' });
  });
});

describe('thưởng nhóm, danh hiệu và xếp hạng cá nhân sau khi chốt tuần', () => {
  function thiVaChot() {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    lamBai(NGUOI[0], 40, false);
    lamBai(NGUOI[1], 40, false);
    lamBai(NGUOI[3], 20, true);
    [4, 5, 6, 7].forEach((i) => lamBai(NGUOI[i], 30, true));
    // u0 nộp lúc 08:10, u1 nộp lúc 08:20 nên u0 nhanh hơn
    const luot = (e) => mt.docTab('LuotThi').find((l) => l.email === e);
    vi.setSystemTime(gio('2026-11-07T08:10:00'));
    const cau = Object.fromEntries(mt.docTab('CauHoi').map((c) => [c.id, c.dapAn]));
    const nopDung = (e) => {
      const l = luot(e);
      const ds = JSON.parse(l.dsCau).ds;
      const tl = Object.fromEntries(ds.map((c) => [c.id, 'ABCD'[c.tt.indexOf(cau[c.id])]]));
      expect(mt.goi({ action: 'thi.nop', maPhienThi: l.maPhien, traLoi: tl }).ok).toBe(true);
    };
    nopDung(NGUOI[0]);
    vi.setSystemTime(gio('2026-11-07T08:20:00'));
    nopDung(NGUOI[1]);
    vi.setSystemTime(gio('2026-11-09T01:00:00'));
    mt.chotTuanTuDong();
  }

  it('hạng 1 được +50, hạng 2 được +30, người vắng không được thưởng', () => {
    thiVaChot();
    // Nhóm B: 4 người 75 điểm => 75. Nhóm A: (100+100+0+50)/4 = 62.5
    const kq = mt.docTab('KetQuaTuan');
    expect(Number(kq.find((r) => r.maNhom === 'n2').hang)).toBe(1);
    [4, 5, 6, 7].forEach((i) => expect(tongDiem(NGUOI[i])).toBe(50));
    [0, 1, 3].forEach((i) => expect(tongDiem(NGUOI[i])).toBe(30));
    expect(tongDiem(NGUOI[2])).toBe(0);
  });

  it('chạy chốt lại không cộng trùng điểm', () => {
    thiVaChot();
    const truoc = mt.docTab('Diem').length;
    mt.chotTuanTuDong();
    expect(mt.docTab('Diem')).toHaveLength(truoc);
  });

  it('danh hiệu thuộc người cao điểm nhất, bằng điểm thì ai nộp nhanh hơn', () => {
    thiVaChot();
    const dh = mt.docTab('DanhHieu');
    expect(dh).toHaveLength(1);
    expect(dh[0]).toMatchObject({ email: NGUOI[0], danhHieu: 'Thiên Kiêu Tuần 1' });
    expect(Number(dh[0].diem)).toBe(100);
  });

  it('bảng cá nhân hiện tên, cấp, danh hiệu; không lộ email người khác', () => {
    thiVaChot();
    const r = goiAs(NGUOI[0], 'xepHangCaNhan').data;
    expect(r.vinhDanh.nguoi[0]).toMatchObject({ hoTen: 'Người 0', danhHieu: 'Thiên Kiêu Tuần 1' });
    expect(r.bang[0].tong).toBe(50);
    expect(r.bang.find((x) => x.laToi).hoTen).toBe('Người 0');
    expect(r.toi.cap.tong).toBe(30);
    expect(r.toi.danhHieu).toHaveLength(1);
    expect(JSON.stringify(r)).not.toContain('@x.vn');
  });

  it('luyện tập và thưởng nhóm cộng dồn vào cùng một tổng', () => {
    thiVaChot();
    vi.setSystemTime(gio('2026-11-10T09:00:00'));
    const bat = goiAs(NGUOI[4], 'luyenTap.bat', { maMon: MON[0] });
    goiAs(NGUOI[4], 'luyenTap.nop', { maLuot: bat.data.maLuot, traLoi: Object.fromEntries(bat.data.cauHoi.map((c) => [c.id, 'A'])) });
    expect(goiAs(NGUOI[4], 'xepHangCaNhan').data.toi.cap.tong).toBe(70);
  });
});

// Thêm một câu vào đề của người đã thi (nếu chưa có) để thử báo sai.
function ganCauVaoDe(email, id) {
  const sheet = mt.ss.getSheetByName('LuotThi');
  const tieuDe = sheet.dong[0];
  const dong = sheet.dong.findIndex((r, k) => k > 0 && r[tieuDe.indexOf('email')] === email);
  const idx = tieuDe.indexOf('dsCau');
  const dl = JSON.parse(sheet.dong[dong][idx]);
  if (!dl.ds.some((c) => c.id === id)) dl.ds.push({ id, tt: 'ABCD' });
  sheet.dong[dong][idx] = JSON.stringify(dl);
}

describe('báo sai', () => {
  let cauCuaNguoi0Gap;
  beforeEach(() => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    // Cho nhiều người thi để cùng gặp một số câu; rồi tìm một câu của người khác mà u1 và u2 đều gặp
    lamBai(NGUOI[1], 0, false);
    lamBai(NGUOI[2], 0, false);
    lamBai(NGUOI[3], 0, false);
    // Chọn cố định một câu của u0 và đảm bảo u1, u2, u3 đều đã gặp câu đó (tránh phụ thuộc rút ngẫu nhiên).
    cauCuaNguoi0Gap = mt.docTab('CauHoi').find((c) => c.tacGia === NGUOI[0]).id;
    [1, 2, 3].forEach((i) => ganCauVaoDe(NGUOI[i], cauCuaNguoi0Gap));
    expect(cauCuaNguoi0Gap).toBeTruthy();
  });
  const trangThaiCau = (id) => mt.docTab('CauHoi').find((c) => c.id === id).trangThai;

  it('một người báo thì câu vẫn dùng, hai người khác nhau thì bị tạm loại', () => {
    expect(goiAs(NGUOI[1], 'baoSai', { idCauHoi: cauCuaNguoi0Gap, lyDo: 'đáp án sai' }).ok).toBe(true);
    expect(trangThaiCau(cauCuaNguoi0Gap)).toBe('active');
    expect(goiAs(NGUOI[2], 'baoSai', { idCauHoi: cauCuaNguoi0Gap }).ok).toBe(true);
    expect(trangThaiCau(cauCuaNguoi0Gap)).toBe('suspended');
  });

  it('cùng một người báo hai lần không tính hai', () => {
    goiAs(NGUOI[1], 'baoSai', { idCauHoi: cauCuaNguoi0Gap });
    expect(goiAs(NGUOI[1], 'baoSai', { idCauHoi: cauCuaNguoi0Gap })).toMatchObject({ ok: false, error: 'da_bao' });
    expect(trangThaiCau(cauCuaNguoi0Gap)).toBe('active');
  });

  it('không báo sai được câu chưa gặp hoặc câu của mình', () => {
    const cauCuaU1 = mt.docTab('CauHoi').find((c) => c.tacGia === NGUOI[1]).id;
    expect(goiAs(NGUOI[1], 'baoSai', { idCauHoi: cauCuaU1 }).error).toBe('cua_minh');
    const u1Gap = new Set(JSON.parse(mt.docTab('LuotThi').find((l) => l.email === NGUOI[1]).dsCau).ds.map((c) => c.id));
    const chuaGap = mt.docTab('CauHoi').find((c) => !u1Gap.has(c.id) && c.tacGia !== NGUOI[1]).id;
    expect(goiAs(NGUOI[1], 'baoSai', { idCauHoi: chuaGap }).error).toBe('khong_gap');
  });

  it('năm người báo thì câu bị xóa; câu tạm loại không còn được rút cho đề mới', () => {
    [1, 2, 3].forEach((i) => goiAs(NGUOI[i], 'baoSai', { idCauHoi: cauCuaNguoi0Gap }));
    expect(trangThaiCau(cauCuaNguoi0Gap)).toBe('suspended');
    // luyện tập mới không chứa câu tạm loại
    for (let k = 0; k < 6; k++) {
      const bat = goiAs(NGUOI[5], 'luyenTap.bat', { maMon: MON[0] });
      expect(bat.data.cauHoi.some((c) => c.id === cauCuaNguoi0Gap)).toBe(false);
      goiAs(NGUOI[5], 'luyenTap.nop', { maLuot: bat.data.maLuot, traLoi: {} });
    }
  });

  it('năm người khác nhau báo thì câu bị xóa', () => {
    [4, 5].forEach((i) => {
      lamBai(NGUOI[i], 0, false);
      ganCauVaoDe(NGUOI[i], cauCuaNguoi0Gap);
    });
    [1, 2, 3, 4, 5].forEach((i) => expect(goiAs(NGUOI[i], 'baoSai', { idCauHoi: cauCuaNguoi0Gap }).ok).toBe(true));
    expect(trangThaiCau(cauCuaNguoi0Gap)).toBe('removed');
  });

  it('chủ khôi phục câu thì xóa các báo sai cũ', () => {
    goiAs(NGUOI[1], 'baoSai', { idCauHoi: cauCuaNguoi0Gap });
    goiAs(NGUOI[2], 'baoSai', { idCauHoi: cauCuaNguoi0Gap });
    expect(goiAs(CHU, 'admin.doiTrangThaiCau', { id: cauCuaNguoi0Gap, trangThai: 'active' }).ok).toBe(true);
    expect(trangThaiCau(cauCuaNguoi0Gap)).toBe('active');
    expect(mt.docTab('BaoSai').filter((b) => b.idCauHoi === cauCuaNguoi0Gap)).toHaveLength(0);
  });
});

describe('xem lại và câu khó nhất', () => {
  beforeEach(() => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    [0, 1, 2, 4, 5].forEach((i) => lamBai(NGUOI[i], 25, true));
  });

  it('chưa đóng cửa thì chưa xem lại được', () => {
    expect(goiAs(NGUOI[0], 'xemLai').data.cauHoi).toEqual([]);
    expect(goiAs(NGUOI[0], 'xemLai', { soTuan: 1 })).toMatchObject({ ok: false, error: 'chua_dong' });
    expect(goiAs(NGUOI[0], 'cauKhoNhat').data.cauHoi).toEqual([]);
  });

  it('sau khi đóng cửa: 40 câu kèm đáp án mình chọn, đáp án đúng, giải thích, chương, trang nguồn', () => {
    vi.setSystemTime(gio('2026-11-09T00:30:00'));
    const r = goiAs(NGUOI[0], 'xemLai').data;
    expect(r.soTuan).toBe(1);
    expect(r.cauHoi).toHaveLength(40);
    expect(r.soDung).toBe(25);
    expect(r.cauHoi.filter((c) => c.laDung)).toHaveLength(25);
    const c = r.cauHoi[0];
    expect(c).toMatchObject({ maChuong: 'c1' });
    expect(c.trangNguon).toMatch(/^tr\./);
    expect(c.giaiThich).toContain('Giải thích');
    expect('ABCD').toContain(c.dung);
  });

  it('người không thi thì không có bài để xem lại', () => {
    vi.setSystemTime(gio('2026-11-09T00:30:00'));
    const r = goiAs(NGUOI[6], 'xemLai').data;
    expect(r.cauHoi).toEqual([]);
  });

  it('câu khó nhất: tối đa 5 câu, tỉ lệ sai giảm dần, kèm đáp án và giải thích', () => {
    vi.setSystemTime(gio('2026-11-09T00:30:00'));
    const r = goiAs(NGUOI[3], 'cauKhoNhat').data;
    expect(r.cauHoi.length).toBeGreaterThan(0);
    expect(r.cauHoi.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < r.cauHoi.length; i++) expect(r.cauHoi[i - 1].tyLeSai).toBeGreaterThanOrEqual(r.cauHoi[i].tyLeSai);
    r.cauHoi.forEach((c) => {
      expect(c.soLuot).toBeGreaterThanOrEqual(3);
      expect('ABCD').toContain(c.dung);
      expect(c.giaiThich).toContain('Giải thích');
      expect(c.dapAn).toHaveLength(4);
    });
  });

  it('chủ tắt được câu khó nhất', () => {
    vi.setSystemTime(gio('2026-11-09T00:30:00'));
    const sheet = mt.ss.getSheetByName('CauHinh');
    const dong = sheet.dong.find((r) => r[0] === 'hienCauKhoNhat');
    dong[1] = false;
    mt.boNho.clear();
    expect(goiAs(NGUOI[3], 'cauKhoNhat').data.tat).toBe(true);
  });
});

describe('quản trị ngân hàng', () => {
  beforeEach(nopHetCauHoi);

  it('thành viên không vào được ngân hàng', () => {
    expect(goiAs(NGUOI[0], 'admin.nganHang')).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(NGUOI[0], 'admin.xuatNganHang')).toMatchObject({ ok: false, error: 'cam' });
  });

  it('lọc theo môn, tác giả, từ khóa và phân trang', () => {
    const tat = goiAs(CHU, 'admin.nganHang', {}).data;
    expect(tat.tong).toBe(8 * 15);
    expect(tat.cauHoi).toHaveLength(50);
    expect(goiAs(CHU, 'admin.nganHang', { maMon: MON[0] }).data.tong).toBe(8 * 5);
    expect(goiAs(CHU, 'admin.nganHang', { tacGia: 'u3@x.vn' }).data.tong).toBe(15);
    expect(goiAs(CHU, 'admin.nganHang', { tuKhoa: 'số 4' }).data.tong).toBe(8 * 3);
    expect(goiAs(CHU, 'admin.nganHang', { trang: 3 }).data.cauHoi).toHaveLength(20);
  });

  it('trợ lý tạm loại và khôi phục được nhưng không xóa, không sửa được', () => {
    const id = mt.docTab('CauHoi')[0].id;
    expect(goiAs(TRO_LY, 'admin.doiTrangThaiCau', { id, trangThai: 'suspended' }).ok).toBe(true);
    expect(goiAs(TRO_LY, 'admin.doiTrangThaiCau', { id, trangThai: 'removed' })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(TRO_LY, 'admin.suaCauHoi', { id, thayDoi: { A: 'x' } })).toMatchObject({ ok: false, error: 'cam' });
    expect(goiAs(TRO_LY, 'admin.doiTrangThaiCau', { id, trangThai: 'active' }).ok).toBe(true);
  });

  it('chủ sửa câu hỏi; sửa sai bị từ chối và không thay đổi gì', () => {
    const c = mt.docTab('CauHoi')[0];
    expect(goiAs(CHU, 'admin.suaCauHoi', { id: c.id, thayDoi: { noiDung: 'Nội dung mới', dapAn: 'B' } }).ok).toBe(true);
    const sau = mt.docTab('CauHoi')[0];
    expect(sau).toMatchObject({ noiDung: 'Nội dung mới', dapAn: 'B', A: c.A, tacGia: c.tacGia });
    const hong = goiAs(CHU, 'admin.suaCauHoi', { id: c.id, thayDoi: { B: sau.A } });
    expect(hong).toMatchObject({ ok: false, error: 'cau_hoi_sai' });
    expect(mt.docTab('CauHoi')[0].B).toBe(c.B);
  });

  it('xuất ngân hàng đủ trường kèm trang nguồn; nhập bản sửa có xem trước rồi áp dụng', () => {
    const xuat = goiAs(CHU, 'admin.xuatNganHang').data;
    expect(xuat).toHaveLength(120);
    expect(xuat[0]).toHaveProperty('trangNguon');
    expect(xuat[0]).toHaveProperty('giaiThich');

    const rows = xuat.slice(0, 4).map((r) => ({ ...r }));
    rows[0].giaiThich = 'Đã rà soát theo PDF';
    rows[1].dapAn = 'C';
    rows[2].A = rows[2].B; // hỏng: hai đáp án trùng nhau
    rows.push({ id: 'khong-ton-tai', noiDung: 'x' });

    const xem = goiAs(CHU, 'admin.xemTruocNhap', { rows }).data;
    expect(xem.thayDoi.map((t) => t.id)).toEqual([rows[0].id, rows[1].id]);
    expect(xem.loi.map((l) => l.id)).toEqual([rows[2].id]);
    expect(xem.khongCo).toEqual(['khong-ton-tai']);
    expect(xem.khongDoi).toBe(1);
    expect(xem.thayDoi[0].diff.giaiThich.den).toBe('Đã rà soát theo PDF');
    // xem trước chưa ghi gì
    expect(mt.docTab('CauHoi')[0].giaiThich).not.toBe('Đã rà soát theo PDF');

    const ap = goiAs(CHU, 'admin.nhapNganHang', { rows }).data;
    expect(ap).toMatchObject({ daSua: 2, boQuaViLoi: 1, khongCo: 1 });
    expect(mt.docTab('CauHoi')[0].giaiThich).toBe('Đã rà soát theo PDF');
    expect(mt.docTab('CauHoi')[1].dapAn).toBe('C');
    expect(mt.docTab('CauHoi')[2].A).toBe(xuat[2].A); // câu lỗi không bị ghi
  });

  it('nhập không thay đổi được trường tác giả hay id', () => {
    const xuat = goiAs(CHU, 'admin.xuatNganHang').data;
    const r = { ...xuat[0], tacGia: 'ke-gian@x.vn' };
    expect(goiAs(CHU, 'admin.xemTruocNhap', { rows: [r] }).data.thayDoi).toEqual([]);
  });

  it('mọi thao tác quản trị ghi vào nhật ký', () => {
    const id = mt.docTab('CauHoi')[0].id;
    goiAs(CHU, 'admin.suaCauHoi', { id, thayDoi: { giaiThich: 'g' } });
    goiAs(TRO_LY, 'admin.doiTrangThaiCau', { id, trangThai: 'suspended' });
    const nk = mt.docTab('NhatKy').map((n) => n.hanhDong);
    expect(nk).toContain('suaCauHoi');
    expect(nk).toContain('doiTrangThaiCau');
  });
});
