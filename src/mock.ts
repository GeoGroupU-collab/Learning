// Máy chủ giả để xem giao diện khi chưa có Google. Chỉ được nạp khi chạy `npm run dev:mock`.
import { LoiApi } from './api';
import type { ThanhVienDs, NhomXemTruoc, NguoiGpa, BanNhap, CauCuaToi } from './types';

const vai = (new URLSearchParams(location.search).get('vai') ?? 'owner') as 'owner' | 'assistant' | 'member';
const EMAIL_TOI = 'toi@example.test';

const ten = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Thảo'];
const thanhVien: ThanhVienDs[] = [
  { email: EMAIL_TOI, hoTen: 'Lớp trưởng (thử)', vaiTro: vai, trangThai: 'active', ngayThamGia: '2026-10-28' },
  ...ten.map((t, i) => ({
    email: `sv${i}@example.test`,
    hoTen: `${t} (thử)`,
    vaiTro: 'member' as const,
    trangThai: 'active' as const,
    ngayThamGia: '2026-10-28',
  })),
];
const gpa = (i: number): number => Math.round((3.8 - i * 0.12) * 100) / 100;
const nguoiGpa = (): NguoiGpa[] => thanhVien.map((t, i) => ({ email: t.email, hoTen: t.hoTen, gpa: gpa(i) }));

let nhoms: NhomXemTruoc[] = [];
let linkZalo = '';

function chiaThu(soNhom: number): NhomXemTruoc[] {
  const kq: NhomXemTruoc[] = Array.from({ length: soNhom }, (_, i) => ({ maNhom: `n${i + 1}`, tenNhom: `Nhóm ${i + 1}`, thanhVien: [] }));
  nguoiGpa().forEach((p, k) => {
    const vong = Math.floor(k / soNhom);
    const v = k % soNhom;
    kq[vong % 2 === 0 ? v : soNhom - 1 - v].thanhVien.push(p);
  });
  return kq;
}

// Dữ liệu giả cho sự kiện. ?tt=nop (mặc định), cho, mo, dong chọn trạng thái tuần.
const trangThaiGia = (new URLSearchParams(location.search).get('tt') ?? 'nop') as 'nop' | 'cho' | 'mo' | 'dong';
const MON_GIA = [
  { ma: 'khoa-hoc-du-lieu', ten: 'Khoa học dữ liệu', mau: '#4cc9f0', chuong: [{ ma: 'c1', ten: 'Chương 1' }, { ma: 'c2', ten: 'Chương 2' }] },
  { ma: 'dia-chat-kien-truc', ten: 'Địa chất kiến trúc', mau: '#f4a261', chuong: [] },
  { ma: 'triet-hoc-mac-lenin', ten: 'Triết học Mác-Lênin', mau: '#e5383b', chuong: [] },
  { ma: 'khoang-vat-thach-hoc', ten: 'Khoáng vật thạch học', mau: '#b5179e', chuong: [] },
];
let nhapGia: BanNhap | null = null;
let cauDaNop: CauCuaToi[] = [];
let mienGia = false;

function tuanGia() {
  const now = Date.now();
  const gio = 3600000;
  const moc = { nop: [now + 50 * gio, now + 51 * gio, now + 99 * gio], cho: [now - 2 * gio, now + 5 * gio, now + 53 * gio], mo: [now - 30 * gio, now - 6 * gio, now + 18 * gio], dong: [now - 90 * gio, now - 66 * gio, now - 42 * gio] }[trangThaiGia];
  const [hanNop, moCua, dongCua] = moc;
  const tt = trangThaiGia === 'nop' ? 'nop_cau_hoi' : trangThaiGia === 'cho' ? 'cho_mo_cua' : trangThaiGia === 'mo' ? 'mo' : 'dong';
  const keTiep = tt === 'nop_cau_hoi' ? { nhan: 'Hạn nộp câu hỏi', luc: hanNop } : tt === 'cho_mo_cua' ? { nhan: 'Phòng thi mở cửa', luc: moCua } : tt === 'mo' ? { nhan: 'Phòng thi đóng cửa', luc: dongCua } : null;
  return {
    now,
    tuan: { soTuan: 1, hanNop, moCua, dongCua, trangThai: tt, moc: keTiep },
    mon: MON_GIA,
    yeuCau: { soMon: 3, soCauMoiMon: 5 },
    soMienToiDa: 1,
    soCauDaNop: cauDaNop.length,
    soCauCanNop: 15,
    moKhoa: cauDaNop.length >= 15,
    mien: mienGia,
    soMienDaDung: mienGia ? 1 : 0,
  };
}

const tre = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function mockGoi(action: string, payload: Record<string, unknown>): Promise<unknown> {
  await tre();
  const admin = vai === 'owner' || vai === 'assistant';
  if (action.startsWith('admin.') && !admin) throw new LoiApi('cam', 'Bạn không có quyền làm việc này.');
  if (action.startsWith('admin.') && action !== 'admin.dsThanhVien' && vai !== 'owner') throw new LoiApi('cam', 'Bạn không có quyền làm việc này.');

  const tuiTrong = () => nhoms.find((n) => n.thanhVien.some((t) => t.email === EMAIL_TOI));
  switch (action) {
    case 'me': {
      const n = tuiTrong();
      return {
        email: EMAIL_TOI,
        hoTen: 'Lớp trưởng (thử)',
        vaiTro: vai,
        hocKy: { maHocKy: 'hk1-2026-2027', tenHocKy: 'Học kỳ 1 năm học 2026-2027' },
        nhom: n ? { maNhom: n.maNhom, tenNhom: n.tenNhom } : null,
      };
    }
    case 'nhomCuaToi': {
      const n = tuiTrong();
      return n ? { maNhom: n.maNhom, tenNhom: n.tenNhom, linkZalo, thanhVien: n.thanhVien.map((t) => ({ email: t.email, hoTen: t.hoTen, trangThai: 'active' })) } : null;
    }
    case 'capNhatLinkZalo':
      if (payload.link && !String(payload.link).startsWith('https://')) throw new LoiApi('link_sai', 'Link phải bắt đầu bằng https://');
      linkZalo = String(payload.link ?? '');
      return { linkZalo };
    case 'doiTenNhom': {
      const n = tuiTrong();
      if (n) n.tenNhom = String(payload.tenNhom);
      return { tenNhom: payload.tenNhom };
    }
    case 'tuanHienTai':
      return tuanGia();
    case 'nhapLay':
      return { duLieu: nhapGia };
    case 'nhapLuu':
      nhapGia = payload.duLieu as BanNhap;
      return { daLuu: true };
    case 'nopCauHoi': {
      const ds = payload.cauHoi as (CauCuaToi & { maMon: string; noiDung: string })[];
      if (ds.some((c) => !String(c.noiDung).trim())) throw new LoiApi('cau_hoi_sai', 'Câu 1: thiếu nội dung câu hỏi.\nCâu 2: thiếu nội dung câu hỏi.');
      cauDaNop = ds.map((c, i) => ({ ...c, id: String(i), soTuan: 1, tenMon: MON_GIA.find((m) => m.ma === c.maMon)?.ten ?? c.maMon, trangThai: 'active', soBaoSai: 0 }));
      nhapGia = null;
      return { soCau: ds.length, moKhoa: true };
    }
    case 'xinMien':
      mienGia = true;
      return { mien: true };
    case 'huyMien':
      mienGia = false;
      return { mien: false };
    case 'cauHoiCuaToi':
      return cauDaNop;
    case 'admin.dsTuan':
      return { maHocKy: 'hk1-2026-2027', tuan: [1, 2, 3, 4, 5].map((i) => ({ soTuan: i, hanNop: Date.now() + i * 86400000, moCua: Date.now() + (i + 1) * 86400000, dongCua: Date.now() + (i + 3) * 86400000, trangThai: 'nop_cau_hoi' })) };
    case 'admin.taoLichTuan':
    case 'admin.suaTuan':
      return { soTuan: 5 };
    case 'admin.dsThanhVien':
      return thanhVien;
    case 'admin.nhapDangKy':
      return { them: 0, daCo: thanhVien.length, tongDangKy: thanhVien.length };
    case 'admin.xemTruocChiaNhom':
      return { kichThuoc: 6, doLech: 0.05, thieuGpa: [], nhoms: chiaThu(Math.max(1, Math.floor(thanhVien.length / 6))) };
    case 'admin.chotChiaNhom':
      nhoms = (payload.nhoms as NhomXemTruoc[]).map((g, i) => ({
        tenNhom: g.tenNhom,
        maNhom: `n${i + 1}`,
        thanhVien: g.thanhVien.map((t) => nguoiGpa().find((p) => p.email === t.email)!),
      }));
      return { soNhom: nhoms.length };
    case 'admin.nhomHienTai':
      return { nhoms, chuaCoNhom: [] };
    case 'admin.chuyenNguoi': {
      let nguoi: NguoiGpa | undefined;
      nhoms.forEach((n) => {
        const i = n.thanhVien.findIndex((t) => t.email === payload.email);
        if (i !== -1) nguoi = n.thanhVien.splice(i, 1)[0];
      });
      nhoms.find((n) => n.maNhom === payload.maNhom)?.thanhVien.push(nguoi!);
      return {};
    }
    case 'admin.themThanhVien':
      thanhVien.push({ email: String(payload.email), hoTen: String(payload.hoTen), vaiTro: 'member', trangThai: 'active', ngayThamGia: '2026-10-30' });
      return {};
    case 'admin.doiVaiTro':
    case 'admin.goThanhVien':
    case 'admin.moLaiThanhVien': {
      const t = thanhVien.find((x) => x.email === payload.email);
      if (t && action === 'admin.doiVaiTro') t.vaiTro = payload.vaiTro as ThanhVienDs['vaiTro'];
      if (t && action === 'admin.goThanhVien') t.trangThai = payload.loai as ThanhVienDs['trangThai'];
      if (t && action === 'admin.moLaiThanhVien') t.trangThai = 'active';
      return {};
    }
    default:
      throw new LoiApi('khong_biet', 'Hành động không hợp lệ.');
  }
}
