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
let cauDaNop: CauCuaToi[] = trangThaiGia === 'nop' ? [] : Array.from({ length: 15 }, (_, i) => ({ id: String(i), soTuan: 1, tenMon: 'Khoa học dữ liệu', maChuong: '', noiDung: `Câu mẫu ${i}`, A: 'a', B: 'b', C: 'c', D: 'd', dapAn: 'A', trangNguon: 'tr.1', giaiThich: '', trangThai: 'active', soBaoSai: 0 }));
let luotGia: null | { maPhienThi: string; hetHanLuc: number; traLoi: Record<string, string>; daNop: boolean; soDung: number } = null;
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
    thi: { soMonThi: 2, soCauMoiMonThi: 20, thoiGianPhut: 40 },
    luotThi: luotGia ? (luotGia.daNop ? { trangThai: 'da_nop', soDung: luotGia.soDung, soCau: 40, diem: luotGia.soDung * 2.5, giayLam: 600 } : { trangThai: 'dang_lam', hetHanLuc: luotGia.hetHanLuc }) : null,
  };
}

let tongDiemGia = 230;
let diemLuyenTapTuan = 40;
const capGia = () => {
  const level = Math.floor(tongDiemGia / 100) + 1;
  return { tong: tongDiemGia, level, diemTrongLevel: tongDiemGia % 100, diemMoiLevel: 100, tenCapLon: level <= 5 ? 'Võ Sĩ' : 'Võ Sư', levelDauCap: 1, levelCuoiCap: 5, capKe: 'Võ Sư', levelConLaiDenCapKe: Math.max(0, 6 - level) };
};
const cauXemLaiGia = (n: number) => Array.from({ length: n }, (_, i) => ({
  id: 'q' + i, tenMon: 'Khoa học dữ liệu', maChuong: 'c1', trangNguon: 'tr.' + (i + 3),
  noiDung: `Câu hỏi mẫu số ${i + 1}: chọn đáp án đúng nhất.`,
  dapAn: ['A', 'B', 'C', 'D'].map((k) => ({ k, text: `Đáp án ${k} của câu ${i + 1}` })),
  chon: i % 3 === 0 ? 'B' : 'A', dung: i % 3 === 0 ? 'B' : 'C', laDung: i % 3 === 0,
  giaiThich: 'Đáp án đúng vì theo slide 12, khái niệm này được định nghĩa như vậy.',
}));
const nganHangGia = Array.from({ length: 7 }, (_, i) => ({
  id: 'ch' + i, maHocKy: 'hk1-2026-2027', soTuan: 1, maMon: 'khoa-hoc-du-lieu', maChuong: 'c1', trangNguon: 'tr.' + i,
  noiDung: `Nội dung câu hỏi trong ngân hàng số ${i + 1}`, A: 'a' + i, B: 'b' + i, C: 'c' + i, D: 'd' + i, dapAn: 'A', giaiThich: '',
  tacGia: `sv${i}@example.test`, tenTacGia: `Bạn ${i}`, trangThai: (i === 2 ? 'suspended' : 'active') as 'active' | 'suspended' | 'removed', ngayNop: '2026-11-05T10:00:00Z', soBaoSai: i === 2 ? 2 : 0,
}));

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
      return n ? { maNhom: n.maNhom, tenNhom: n.tenNhom, linkZalo, tuan: { soTuan: 1, trangThai: 'mo' }, thanhVien: n.thanhVien.map((t, i) => ({ email: t.email, hoTen: t.hoTen, trangThai: 'active', tt: ['da_thi', 'dang_thi', 'da_nop_cau', 'chua_nop_cau', 'mien'][i % 5], diem: i % 5 === 0 ? 70 + i : null })) } : null;
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
    case 'dangNhap':
      return { phien: 'mock' };
    case 'dangXuat':
      return {};
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
    case 'batDauThi': {
      if (luotGia?.daNop) return { trangThai: 'da_nop', soDung: luotGia.soDung, soCau: 40, diem: luotGia.soDung * 2.5, giayLam: 600 };
      if (!luotGia) luotGia = { maPhienThi: 'mock-phien-' + Date.now(), hetHanLuc: Date.now() + 40 * 60000, traLoi: {}, daNop: false, soDung: 0 };
      const cauHoi = Array.from({ length: 40 }, (_, i) => ({
        id: 'q' + i,
        maMon: i < 20 ? 'khoa-hoc-du-lieu' : 'dia-chat-kien-truc',
        noiDung: `Đây là nội dung câu hỏi thử số ${i + 1}. Chọn một đáp án đúng nhất trong bốn đáp án bên dưới.`,
        dapAn: ['A', 'B', 'C', 'D'].map((k) => ({ k, text: `Đáp án ${k} của câu ${i + 1}` })),
      }));
      return { trangThai: 'dang_lam', maPhienThi: luotGia.maPhienThi, hetHanLuc: luotGia.hetHanLuc, now: Date.now(), cauHoi, traLoi: luotGia.traLoi };
    }
    case 'thi.luu':
      if (luotGia) luotGia.traLoi = payload.traLoi as Record<string, string>;
      return { daLuu: true };
    case 'thi.nop': {
      if (luotGia) {
        luotGia.daNop = true;
        luotGia.soDung = Object.keys(payload.traLoi as object).length >= 30 ? 30 : 12;
      }
      return { trangThai: 'da_nop', soDung: luotGia?.soDung ?? 0, soCau: 40, diem: (luotGia?.soDung ?? 0) * 2.5, giayLam: 600 };
    }
    case 'xepHang': {
      const nhom = (hang: number, ten: string, diem: number, thamGia: number) => ({ maNhom: 'n' + hang, tenNhom: ten, diem, hang, soTinh: 6, soThamGia: thamGia });
      const tuan = [nhom(1, 'Nhóm 3', 78.5, 6), nhom(2, 'Nhóm 1', 64.2, 5), nhom(3, 'Nhóm 2', 41.7, 4)];
      return {
        tuanHienTai: { soTuan: 1, daChot: false, nhom: tuan },
        cacTuan: [],
        luyKe: tuan.map((n) => ({ maNhom: n.maNhom, tenNhom: n.tenNhom, diem: n.diem, hang: n.hang })),
        vinhDanh: { soTuan: 1, nhom: [{ tenNhom: 'Nhóm 3', diem: 78.5 }] },
        nhomToi: 'n2',
      };
    }
    case 'luyenTap.thongTin':
      return {
        cap: capGia(), diemTuanNay: diemLuyenTapTuan, diemToiDaTuan: 120, diemMoiLuot: 20, soCauMoiLuot: 10, dangMo: false,
        mon: MON_GIA.map((m, i) => ({ ma: m.ma, ten: m.ten, mau: m.mau, soCauCoSan: i === 3 ? 0 : 60 })),
      };
    case 'luyenTap.bat':
      return {
        trangThai: 'dang_lam', maLuot: 'lt1',
        cauHoi: Array.from({ length: 10 }, (_, i) => ({ id: 'q' + i, maMon: String(payload.maMon), noiDung: `Câu luyện tập số ${i + 1}`, dapAn: ['A', 'B', 'C', 'D'].map((k) => ({ k, text: `Đáp án ${k}` })) })),
      };
    case 'luyenTap.nop': {
      const thuong = Math.max(0, Math.min(20, 120 - diemLuyenTapTuan));
      diemLuyenTapTuan += thuong;
      tongDiemGia += thuong;
      return { soDung: 6, soCau: 10, diem: 60, diemThuong: thuong, cauHoi: cauXemLaiGia(10), cap: capGia() };
    }
    case 'xepHangCaNhan':
      return {
        bang: [
          { hang: 1, hoTen: 'Nguyễn Văn A', tong: 520, level: 6, tenCapLon: 'Võ Sư', soDanhHieu: 2, laToi: false },
          { hang: 2, hoTen: 'Lớp trưởng (thử)', tong: tongDiemGia, level: capGia().level, tenCapLon: capGia().tenCapLon, soDanhHieu: 1, laToi: true },
          { hang: 3, hoTen: 'Trần Thị B', tong: 90, level: 1, tenCapLon: 'Võ Sĩ', soDanhHieu: 0, laToi: false },
        ],
        vinhDanh: { soTuan: 1, nguoi: [{ hoTen: 'Nguyễn Văn A', diem: 97.5, danhHieu: 'Thiên Kiêu Tuần 1' }] },
        toi: { hang: 2, cap: capGia(), danhHieu: [{ soTuan: 1, danhHieu: 'Thiên Kiêu Tuần 1', diem: 92.5 }] },
      };
    case 'baoSai':
      return { daBao: true };
    case 'xemLai':
      return { cacTuan: [1, 2], soTuan: 1, diem: 62.5, soDung: 25, soCau: 40, cauHoi: cauXemLaiGia(6) };
    case 'cauKhoNhat':
      return {
        soTuan: 1,
        cauHoi: [0, 1, 2].map((i) => ({
          id: 'k' + i, tenMon: 'Địa chất kiến trúc', maChuong: 'c2', trangNguon: 'slide ' + (10 + i), noiDung: `Câu khó số ${i + 1} mà cả lớp hay chọn sai?`,
          dapAn: ['A', 'B', 'C', 'D'].map((k) => ({ k, text: `Phương án ${k}` })), dung: 'C', giaiThich: 'Vì quá trình này xảy ra ở điều kiện áp suất cao.', soLuot: 12 - i, tyLeSai: 80 - i * 10,
        })),
      };
    case 'admin.nganHang':
      return { tong: nganHangGia.length, trang: 1, coTrang: 50, cauHoi: nganHangGia };
    case 'admin.suaCauHoi':
    case 'admin.doiTrangThaiCau':
      return {};
    case 'admin.xuatNganHang':
      return nganHangGia;
    case 'admin.xemTruocNhap':
      return { thayDoi: [{ id: 'ch0', diff: { giaiThich: { tu: '', den: 'Đã rà soát theo PDF' } } }], loi: [{ id: 'ch1', loi: ['bốn đáp án phải khác nhau'] }], khongCo: ['abc'], khongDoi: 5 };
    case 'admin.nhapNganHang':
      return { daSua: 1, boQuaViLoi: 1, khongCo: 1 };
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
