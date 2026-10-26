// Máy chủ giả để xem giao diện khi chưa có Google. Chỉ được nạp khi chạy `npm run dev:mock`.
import { LoiApi } from './api';
import type { ThanhVienDs, NhomXemTruoc, NguoiGpa } from './types';

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
