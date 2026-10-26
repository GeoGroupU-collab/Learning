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
      A: `a-${ai}-${i}`, B: `b-${ai}-${i}`, C: `c-${ai}-${i}`, D: `d-${ai}-${i}`, dapAn: 'ABCD'[i % 4], giaiThich: '',
    }))
  );

// Dựng sẵn: Sheet, 8 thành viên chia 2 nhóm, lịch 1 tuần bắt đầu Thứ Bảy 07/11/2026.
function dungSan() {
  mt = taoMoiTruong();
  mt.khoiTao();
  NGUOI.forEach((e, i) => mt.themDong('ThanhVien', { email: e, hoTen: `Người ${i}`, vaiTro: 'member', trangThai: 'active' }));
  expect(goiAs(CHU, 'admin.taoLichTuan', { thuBayDau: '2026-11-07', soTuan: 1 }).ok).toBe(true);
  const chot = goiAs(CHU, 'admin.chotChiaNhom', {
    nhoms: [
      { tenNhom: 'Nhóm A', thanhVien: NGUOI.slice(0, 4).map((email) => ({ email })) },
      { tenNhom: 'Nhóm B', thanhVien: NGUOI.slice(4).map((email) => ({ email })) },
    ],
  });
  expect(chot.ok).toBe(true);
}

function nopHetCauHoi() {
  vi.setSystemTime(gio('2026-11-05T10:00:00'));
  NGUOI.forEach((e) => {
    const r = goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) });
    expect(r.ok, JSON.stringify(r)).toBe(true);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(gio('2026-11-01T09:00:00'));
  dungSan();
});
afterEach(() => vi.useRealTimers());

describe('cổng đăng nhập', () => {
  it('email lạ bị chặn', () => {
    const r = goiAs('la@x.vn', 'me');
    expect(r).toMatchObject({ ok: false, error: 'chua_duyet' });
  });
  it('không có token bị chặn', () => {
    expect(mt.goi({ action: 'me' })).toMatchObject({ ok: false, error: 'unauthorized' });
  });
  it('thành viên vào được; chủ có vai trò owner', () => {
    expect(goiAs(NGUOI[0], 'me').data.vaiTro).toBe('member');
    expect(goiAs(CHU, 'me').data.vaiTro).toBe('owner');
  });
  it('thành viên không dùng được hành động quản trị', () => {
    expect(goiAs(NGUOI[0], 'admin.dsThanhVien')).toMatchObject({ ok: false, error: 'cam' });
  });
});

describe('phiên đăng nhập dài hạn', () => {
  it('đổi token lấy phiên, dùng phiên để gọi, đăng xuất thì hết hiệu lực', () => {
    const r = goiAs(NGUOI[0], 'dangNhap');
    expect(r.ok).toBe(true);
    const phien = r.data.phien;
    expect(mt.goi({ action: 'me', phien }).data.email).toBe(NGUOI[0]);
    mt.boNho.clear(); // phiên vẫn còn trong Sheet dù cache trống
    expect(mt.goi({ action: 'me', phien }).ok).toBe(true);
    expect(mt.goi({ action: 'dangXuat', phien }).ok).toBe(true);
    expect(mt.goi({ action: 'me', phien })).toMatchObject({ ok: false, error: 'phien_het_han' });
  });
  it('Sheet chỉ lưu bản băm, không lưu mã phiên', () => {
    const phien = goiAs(NGUOI[0], 'dangNhap').data.phien;
    const dong = JSON.stringify(mt.docTab('PhienDangNhap'));
    expect(dong).not.toContain(phien);
  });
  it('phiên hết hạn sau 30 ngày', () => {
    const phien = goiAs(NGUOI[0], 'dangNhap').data.phien;
    mt.boNho.clear();
    vi.setSystemTime(Date.now() + 31 * 86400000);
    expect(mt.goi({ action: 'me', phien })).toMatchObject({ ok: false, error: 'phien_het_han' });
  });
  it('thành viên bị gỡ mất quyền ngay dù còn phiên', () => {
    const phien = goiAs(NGUOI[1], 'dangNhap').data.phien;
    expect(goiAs(CHU, 'admin.goThanhVien', { email: NGUOI[1], loai: 'removed' }).ok).toBe(true);
    expect(mt.goi({ action: 'me', phien })).toMatchObject({ ok: false, error: 'chua_duyet' });
  });
  it('người chưa duyệt không lấy được phiên', () => {
    expect(goiAs('la@x.vn', 'dangNhap')).toMatchObject({ ok: false, error: 'chua_duyet' });
  });
});

describe('nộp câu hỏi và xin miễn', () => {
  it('nộp đủ thì mở khóa; nộp thiếu bị từ chối', () => {
    vi.setSystemTime(gio('2026-11-05T10:00:00'));
    const thieu = goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]).slice(0, 14) });
    expect(thieu).toMatchObject({ ok: false, error: 'cau_hoi_sai' });
    expect(goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) }).ok).toBe(true);
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.moKhoa).toBe(true);
  });
  it('sau hạn không nộp được', () => {
    vi.setSystemTime(gio('2026-11-07T00:00:01'));
    expect(goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) })).toMatchObject({ ok: false, error: 'het_han' });
  });
  it('trùng câu với người khác bị chặn', () => {
    vi.setSystemTime(gio('2026-11-05T10:00:00'));
    goiAs(NGUOI[0], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[0]) });
    const bo = taoBoCau(NGUOI[1]);
    bo[0].noiDung = taoBoCau(NGUOI[0])[0].noiDung.toUpperCase();
    expect(goiAs(NGUOI[1], 'nopCauHoi', { cauHoi: bo }).error).toBe('cau_hoi_sai');
  });
  it('xin miễn: tối đa một lượt, hủy được, người đã nộp không xin được', () => {
    vi.setSystemTime(gio('2026-11-05T10:00:00'));
    expect(goiAs(NGUOI[0], 'xinMien').ok).toBe(true);
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.mien).toBe(true);
    goiAs(NGUOI[0], 'huyMien');
    expect(goiAs(NGUOI[0], 'tuanHienTai').data.mien).toBe(false);
    goiAs(NGUOI[1], 'nopCauHoi', { cauHoi: taoBoCau(NGUOI[1]) });
    expect(goiAs(NGUOI[1], 'xinMien')).toMatchObject({ ok: false, error: 'da_nop' });
  });
});

describe('phòng thi', () => {
  it('chưa mở cửa hoặc chưa nộp đủ câu hỏi thì không thi được', () => {
    nopHetCauHoi();
    expect(goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) })).toMatchObject({ ok: false, error: 'chua_mo' });
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    mt.themDong('ThanhVien', { email: 'muon@x.vn', hoTen: 'Muộn', vaiTro: 'member', trangThai: 'active' });
    expect(goiAs('muon@x.vn', 'batDauThi', { monChon: MON.slice(0, 2) })).toMatchObject({ ok: false, error: 'chua_nop_cau' });
  });

  it('bắt đầu thi: 40 câu, không có đáp án đúng, không có câu của mình, gọi lại trả đúng lượt cũ', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const a = goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) });
    expect(a.ok, JSON.stringify(a)).toBe(true);
    expect(a.data.cauHoi).toHaveLength(40);
    expect(JSON.stringify(a.data)).not.toContain('"dapAn":"'); // đáp án đúng không xuống trình duyệt
    a.data.cauHoi.forEach((c) => {
      expect(c.noiDung).not.toContain(`Câu của ${NGUOI[0]}`);
      expect(c.dapAn.map((d) => d.k)).toEqual(['A', 'B', 'C', 'D']);
    });
    expect(new Set(a.data.cauHoi.map((c) => c.id)).size).toBe(40);
    expect(a.data.hetHanLuc - a.data.now).toBe(40 * 60000);

    vi.setSystemTime(gio('2026-11-07T08:05:00'));
    const b = goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(1, 3) });
    expect(b.data.maPhienThi).toBe(a.data.maPhienThi);
    expect(b.data.hetHanLuc).toBe(a.data.hetHanLuc);
    expect(b.data.cauHoi.map((c) => c.id)).toEqual(a.data.cauHoi.map((c) => c.id));
    expect(mt.docTab('LuotThi')).toHaveLength(1);
  });

  it('mỗi người chỉ có một lượt thi, kể cả gọi liên tiếp', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const ketQua = Array.from({ length: 5 }, () => goiAs(NGUOI[2], 'batDauThi', { monChon: MON.slice(0, 2) }));
    expect(new Set(ketQua.map((r) => r.data.maPhienThi)).size).toBe(1);
    expect(mt.docTab('LuotThi')).toHaveLength(1);
  });

  it('tự lưu và nộp bằng mã phiên thi, không cần token; chấm đúng; không thi lại được', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const bd = goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) }).data;
    const cau = mt.docTab('CauHoi');
    const dapAnGoc = Object.fromEntries(cau.map((c) => [c.id, c.dapAn]));
    const dsLuu = JSON.parse(mt.docTab('LuotThi')[0].dsCau).ds;

    // Trả lời đúng 30 câu đầu, sai phần còn lại.
    const traLoi = {};
    dsLuu.forEach((c, i) => {
      const goc = dapAnGoc[c.id];
      const hienThi = 'ABCD'[c.tt.indexOf(goc)]; // ô hiển thị chứa đáp án đúng
      traLoi[c.id] = i < 30 ? hienThi : 'ABCD'[(c.tt.indexOf(goc) + 1) % 4];
    });

    const luu = mt.goi({ action: 'thi.luu', maPhienThi: bd.maPhienThi, traLoi });
    expect(luu).toMatchObject({ ok: true });
    expect(luu.data.soDaTraLoi).toBe(40);

    vi.setSystemTime(gio('2026-11-07T08:30:00'));
    const nop = mt.goi({ action: 'thi.nop', maPhienThi: bd.maPhienThi, traLoi });
    expect(nop.data).toMatchObject({ trangThai: 'da_nop', soDung: 30, soCau: 40, diem: 75 });

    expect(mt.goi({ action: 'thi.nop', maPhienThi: bd.maPhienThi, traLoi: {} }).data.soDung).toBe(30); // nộp lại không đổi
    expect(mt.goi({ action: 'thi.luu', maPhienThi: bd.maPhienThi, traLoi: {} })).toMatchObject({ ok: false, error: 'da_nop' });
    expect(goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) }).data).toMatchObject({ trangThai: 'da_nop', diem: 75 });
  });

  it('mã phiên thi sai bị từ chối', () => {
    expect(mt.goi({ action: 'thi.luu', maPhienThi: 'x'.repeat(40), traLoi: {} })).toMatchObject({ ok: false, error: 'phien_thi_sai' });
  });

  it('quá hạn cộng thời gian ân hạn thì không nộp được, bài chấm theo bản tự lưu', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const bd = goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) }).data;
    mt.goi({ action: 'thi.luu', maPhienThi: bd.maPhienThi, traLoi: { [bd.cauHoi[0].id]: 'A' } });
    vi.setSystemTime(gio('2026-11-07T08:41:00'));
    expect(mt.goi({ action: 'thi.luu', maPhienThi: bd.maPhienThi, traLoi: {} })).toMatchObject({ ok: false, error: 'het_gio' });
    const nop = mt.goi({ action: 'thi.nop', maPhienThi: bd.maPhienThi, traLoi: {} });
    expect(nop.data.trangThai).toBe('da_nop');
    expect(nop.data.soCau).toBe(40);
  });

  it('bắt đầu trước giờ đóng cửa thì được làm hết thời lượng dù vượt giờ đóng', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-08T23:50:00'));
    const bd = goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) });
    expect(bd.ok).toBe(true);
    vi.setSystemTime(gio('2026-11-09T00:10:00'));
    expect(mt.goi({ action: 'thi.nop', maPhienThi: bd.data.maPhienThi, traLoi: {} }).data.trangThai).toBe('da_nop');
    vi.setSystemTime(gio('2026-11-09T00:20:00'));
    expect(goiAs(NGUOI[1], 'batDauThi', { monChon: MON.slice(0, 2) })).toMatchObject({ ok: false, error: 'chua_mo' });
  });

  it('người được miễn không thi được', () => {
    vi.setSystemTime(gio('2026-11-05T10:00:00'));
    goiAs(NGUOI[7], 'xinMien');
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    expect(goiAs(NGUOI[7], 'batDauThi', { monChon: MON.slice(0, 2) })).toMatchObject({ ok: false, error: 'da_mien' });
  });

  it('chọn sai môn bị từ chối', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    expect(goiAs(NGUOI[0], 'batDauThi', { monChon: [MON[0]] }).error).toBe('mon_sai');
    expect(goiAs(NGUOI[0], 'batDauThi', { monChon: [MON[0], MON[0]] }).error).toBe('mon_sai');
    expect(goiAs(NGUOI[0], 'batDauThi', { monChon: [MON[0], 'khong-co'] }).error).toBe('mon_sai');
  });
});

describe('chốt tuần và xếp hạng', () => {
  it('chốt tự động: chấm bài chưa nộp theo bản lưu, vắng tính 0, miễn bị loại khỏi mẫu số', () => {
    vi.setSystemTime(gio('2026-11-05T10:00:00'));
    goiAs(NGUOI[3], 'xinMien'); // thành viên nhóm A được miễn
    NGUOI.filter((e) => e !== NGUOI[3]).forEach((e) => goiAs(e, 'nopCauHoi', { cauHoi: taoBoCau(e) }));

    vi.setSystemTime(gio('2026-11-07T08:00:00'));
    const cau = Object.fromEntries(mt.docTab('CauHoi').map((c) => [c.id, c.dapAn]));
    const lamBai = (email, soDung, nop) => {
      const bd = goiAs(email, 'batDauThi', { monChon: MON.slice(0, 2) }).data;
      const luot = mt.docTab('LuotThi').find((l) => l.email === email);
      const ds = JSON.parse(luot.dsCau).ds;
      const traLoi = {};
      ds.forEach((c, i) => {
        const dung = 'ABCD'[c.tt.indexOf(cau[c.id])];
        traLoi[c.id] = i < soDung ? dung : 'ABCD'[(c.tt.indexOf(cau[c.id]) + 1) % 4];
      });
      mt.goi({ action: 'thi.luu', maPhienThi: bd.maPhienThi, traLoi });
      if (nop) mt.goi({ action: 'thi.nop', maPhienThi: bd.maPhienThi, traLoi });
    };
    lamBai(NGUOI[0], 40, true); // 100 điểm, nhóm A
    lamBai(NGUOI[1], 20, false); // 50 điểm, chưa nộp, chấm theo bản lưu
    // NGUOI[2] vắng; NGUOI[3] miễn
    lamBai(NGUOI[4], 40, true); // nhóm B: 100
    lamBai(NGUOI[5], 40, true); // 100
    lamBai(NGUOI[6], 40, true); // 100
    // NGUOI[7] vắng

    // Chưa đóng cửa thì chưa chốt.
    vi.setSystemTime(gio('2026-11-09T00:30:00'));
    // Còn người đang trong thời gian làm bài? Tất cả đã hết 40 phút từ lâu, nên chốt được.
    mt.chotTuanTuDong();
    const kq = mt.docTab('KetQuaTuan');
    expect(kq).toHaveLength(2);
    const nhomA = kq.find((r) => r.maNhom === 'n1');
    const nhomB = kq.find((r) => r.maNhom === 'n2');
    // Nhóm A: (100 + 50 + 0) / 3 (loại 1 người miễn) = 50
    expect(nhomA).toMatchObject({ soThanhVienTinh: 3, soThamGia: 2 });
    expect(Number(nhomA.diemNhom)).toBe(50);
    // Nhóm B: (100 + 100 + 100 + 0) / 4 = 75
    expect(Number(nhomB.diemNhom)).toBe(75);
    expect(Number(nhomB.hang)).toBe(1);
    expect(Number(nhomA.hang)).toBe(2);
    expect(mt.docTab('Tuan')[0].trangThai).toBe('da_chot');

    // Chạy lại không nhân đôi kết quả.
    mt.chotTuanTuDong();
    expect(mt.docTab('KetQuaTuan')).toHaveLength(2);

    const xh = goiAs(NGUOI[0], 'xepHang').data;
    expect(xh.vinhDanh.nhom[0].tenNhom).toBe('Nhóm B');
    expect(xh.luyKe.map((n) => n.hang)).toEqual([1, 2]);
    expect(xh.nhomToi).toBe('n1');
    // Chỉ lộ điểm nhóm, không lộ tên người
    expect(JSON.stringify(xh)).not.toContain('@x.vn');
  });

  it('chưa đóng cửa thì không chốt', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-08T12:00:00'));
    mt.chotTuanTuDong();
    expect(mt.docTab('KetQuaTuan')).toHaveLength(0);
  });

  it('còn người đang làm bài thì chờ rồi mới chốt', () => {
    nopHetCauHoi();
    vi.setSystemTime(gio('2026-11-08T23:50:00'));
    goiAs(NGUOI[0], 'batDauThi', { monChon: MON.slice(0, 2) });
    vi.setSystemTime(gio('2026-11-09T00:05:00'));
    mt.chotTuanTuDong();
    expect(mt.docTab('KetQuaTuan')).toHaveLength(0);
    vi.setSystemTime(gio('2026-11-09T00:40:00'));
    mt.chotTuanTuDong();
    expect(mt.docTab('KetQuaTuan')).toHaveLength(2);
  });

  it('trang Nhóm hiện trạng thái và điểm từng thành viên trong nhóm', () => {
    nopHetCauHoi();
    const r = goiAs(NGUOI[0], 'nhomCuaToi').data;
    expect(r.thanhVien).toHaveLength(4);
    expect(r.thanhVien.every((t) => t.tt === 'da_nop_cau')).toBe(true);
  });
});
