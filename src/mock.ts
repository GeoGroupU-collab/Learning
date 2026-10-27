// Máy chủ giả để xem giao diện khi chưa có Google. Chỉ được nạp khi chạy `npm run dev:mock`.
import { LoiApi } from './api';
import type { ThanhVienDs, NhomXemTruoc, NguoiGpa, BanNhap, CauCuaToi } from './types';

const vai = (new URLSearchParams(location.search).get('vai') ?? 'owner') as 'owner' | 'assistant' | 'member';
const EMAIL_TOI = 'toi@example.test';

const ten = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Thảo'];
const thanhVien: ThanhVienDs[] = [
  { email: EMAIL_TOI, hoTen: 'Minh Anh', vaiTro: vai, trangThai: 'active', ngayThamGia: '2026-10-28' },
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
// Câu mẫu có khối code, để xem cách hiển thị khi chạy dev:mock.
const MAU_CAU_CODE = ['Đoạn code sau in ra màn hình kết quả gì?', '```', 'name = "An"', 'score = 8.456', 'print(f"[{name:<5}][{score:.1f}]")', '```'].join('\n');
const nganHangGia = Array.from({ length: 7 }, (_, i) => ({
  id: 'ch' + i, maHocKy: 'hk1-2026-2027', soTuan: 1, maMon: 'khoa-hoc-du-lieu', maChuong: 'c1', trangNguon: 'tr.' + i,
  noiDung: i === 0 ? MAU_CAU_CODE : `Nội dung câu hỏi trong ngân hàng số ${i + 1}`, A: i === 0 ? '`[   An][8.5]`' : 'a' + i, B: i === 0 ? '`[An   ][8.5]`' : 'b' + i, C: i === 0 ? '`[   An][8.4]`' : 'c' + i, D: i === 0 ? '`[An   ][8.4]`' : 'd' + i, dapAn: i === 0 ? 'B' : 'A', giaiThich: '',
  tacGia: `sv${i}@example.test`, tenTacGia: `Bạn ${i}`, trangThai: (i === 2 ? 'suspended' : i >= 5 ? 'cho_duyet' : 'active') as 'active' | 'suspended' | 'removed' | 'cho_duyet' | 'tu_choi', ngayNop: '2026-11-05T10:00:00Z', soBaoSai: i === 2 ? 2 : 0,
}));

// ?nhomMau trong địa chỉ: có sẵn nhóm để xem trang Nhóm khi chụp hình giới thiệu.
if (new URLSearchParams(location.search).has('nhomMau')) {
  nhoms = chiaThu(3).map((g, i) => ({ tenNhom: g.tenNhom, maNhom: `n${i + 1}`, thanhVien: g.thanhVien.map((t) => nguoiGpa().find((p) => p.email === t.email)!) }));
}

let thongBaoGia = [
  { id: 'tb-2', ngay: Date.now() - 2 * 3600000, tieuDe: 'Họp lớp tối thứ Sáu', noiDung: 'Tối thứ Sáu 20h họp lớp online, cả lớp nhớ vào nhé.\nLink gửi ở nhóm Zalo.', nguoiNhan: 'Cả lớp' },
  { id: 'tb-1', ngay: Date.now() - 30 * 3600000, tieuDe: 'Nhóm 1 được cộng điểm', noiDung: 'Chúc mừng nhóm 1 đứng đầu tuần trước, +50 điểm cấp bậc.', nguoiNhan: 'Nhóm: Nhóm 1' },
];

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
        hoTen: 'Minh Anh',
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
    case 'capNhatHoTen':
      return { hoTen: String(payload.hoTen) };
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
      cauDaNop = ds.map((c, i) => ({ ...c, id: String(i), soTuan: 1, tenMon: MON_GIA.find((m) => m.ma === c.maMon)?.ten ?? c.maMon, trangThai: 'cho_duyet', soBaoSai: 0 }));
      nhapGia = null;
      return { soCau: ds.length, moKhoa: true, choDuyet: true };
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
      return { maHocKy: 'hk1-2026-2027', tuan: [1, 2, 3, 4, 5].map((i) => ({ soTuan: i, hanNop: Date.now() + i * 86400000, moCua: Date.now() + (i + 1) * 86400000, dongCua: Date.now() + (i + 3) * 86400000, trangThai: 'nop_cau_hoi', idDe: i === 5 ? 'de-1' : '', thoiGianPhut: i === 5 ? 60 : undefined })) };
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
      const tuan1 = [nhom(1, 'Nhóm 3', 78.5, 6), nhom(2, 'Nhóm 1', 64.2, 5), nhom(3, 'Nhóm 2', 41.7, 4)];
      const tuan2 = [nhom(1, 'Nhóm 3', 82, 6), nhom(2, 'Nhóm 1', 70.4, 6), nhom(3, 'Nhóm 2', 52, 5)];
      const tuan3 = [nhom(1, 'Nhóm 3', 88, 6), nhom(2, 'Nhóm 1', 66, 5), nhom(3, 'Nhóm 2', 60.5, 5)];
      return {
        tuanHienTai: { soTuan: 4, daChot: false, nhom: tuan3 },
        cacTuan: [{ soTuan: 1, daChot: true, nhom: tuan1 }, { soTuan: 2, daChot: true, nhom: tuan2 }, { soTuan: 3, daChot: true, nhom: tuan3 }],
        luyKe: tuan3.map((n) => ({ maNhom: n.maNhom, tenNhom: n.tenNhom, diem: n.diem, hang: n.hang })),
        vinhDanh: { soTuan: 3, nhom: [{ tenNhom: 'Nhóm 3', diem: 88 }] },
        nhomToi: 'n2',
      };
    }
    case 'trangChu':
      return { me: await mockGoi('me', {}), tuan: tuanGia(), cap: capGia(), tbMoiNhat: thongBaoGia.length ? Math.max(...thongBaoGia.map((t) => t.ngay)) : 0 };
    case 'taoDe.thongTin':
      return {
        cap: capGia(), diemTuanNay: diemLuyenTapTuan, diemToiDaTuan: 120, diemMoiDe: 20, soCauMoiDe: 30, soCauToiThieu: 10, dangMo: false,
        dePhatHanh: [{ idDe: 'de-2', tenDe: 'Đề ôn Triết chương 1', soCau: 20, daLam: null }, { idDe: 'de-9', tenDe: 'Đề ôn giữa kỳ', soCau: 25, daLam: { diem: 68, soDung: 17, soCau: 25 } }],
        mon: MON_GIA.map((m, i) => ({
          ma: m.ma, ten: m.ten, mau: m.mau, soCau: i === 3 ? 4 : 75,
          chuong: i === 0 ? [{ ma: 'c1', ten: 'Chương 1: Mở đầu', soCau: 40 }, { ma: 'c2', ten: 'Chương 2: Thống kê', soCau: 25 }, { ma: 'c3', ten: 'Chương 3: Học máy', soCau: 6 }, { ma: 'c4', ten: 'Chương 4: Trống', soCau: 0 }] : [],
        })),
      };
    case 'taoDe.bat':
      return {
        trangThai: 'dang_lam', maLuot: 'td1', tenMon: 'Khoa học dữ liệu', soCau: 30, chuong: (payload.chuong as string[]) ?? [],
        cauHoi: Array.from({ length: 30 }, (_, i) => ({ id: 'q' + i, maMon: String(payload.maMon), noiDung: `Câu trong đề tự tạo số ${i + 1}`, dapAn: ['A', 'B', 'C', 'D'].map((k) => ({ k, text: `Đáp án ${k}` })) })),
      };
    case 'taoDe.huy':
      return { daHuy: true };
    case 'taoDe.nop': {
      const thuong = Math.max(0, Math.min(20, 120 - diemLuyenTapTuan));
      diemLuyenTapTuan += thuong;
      tongDiemGia += thuong;
      return { soDung: 18, soCau: 30, diem: 60, diemThuong: thuong, cauHoi: cauXemLaiGia(10), cap: capGia() };
    }
    case 'admin.dsDeThi':
      return [
        { idDe: 'de-1', tenDe: 'Đề chung kết học kỳ 1', soCau: 40, trangThai: 'nhap', ngayTao: '2026-12-01T10:00:00Z', tuanGan: 5 },
        { idDe: 'de-2', tenDe: 'Đề ôn Triết chương 1', soCau: 20, trangThai: 'phat_hanh', ngayTao: '2026-11-20T10:00:00Z', tuanGan: null },
      ];
    case 'admin.layDeThi':
      return { idDe: 'de-1', tenDe: 'Đề chung kết học kỳ 1', trangThai: 'nhap', cau: nganHangGia.slice(0, 3).map((c) => ({ ...c, tenMon: 'Khoa học dữ liệu', maMon: 'khoa-hoc-du-lieu' })) };
    case 'admin.xemTruocDeThi':
      return { cau: nganHangGia.slice(0, 5).map((c) => ({ ...c, tenMon: 'Khoa học dữ liệu', maMon: 'khoa-hoc-du-lieu' })), thieu: [{ maMon: 'dia-chat-kien-truc', can: 20, co: 12 }], soUngVien: 60 };
    case 'admin.thayCauDe':
      return { cau: { ...nganHangGia[6], tenMon: 'Khoa học dữ liệu', maMon: 'khoa-hoc-du-lieu' } };
    case 'admin.luuDeThi':
      return { idDe: 'de-3' };
    case 'admin.doiTrangThaiDe':
    case 'admin.ganDeChoTuan':
      return {};
    case 'admin.dsHocKy':
      return [
        { maHocKy: 'hk0-2025-2026', tenHocKy: 'Học kỳ 2 năm học 2025-2026', batDau: '2026-02-15', ketThuc: '2026-06-01', trangThai: 'dong', coTongKet: true },
        { maHocKy: 'hk1-2026-2027', tenHocKy: 'Học kỳ 1 năm học 2026-2027', batDau: '2026-10-26', ketThuc: '', trangThai: 'mo', coTongKet: false },
      ];
    case 'admin.tongKet':
      return {
        maHocKy: 'hk0-2025-2026', tenHocKy: 'Học kỳ 2 năm học 2025-2026', ngayTongKet: '2026-06-02T00:00:00Z',
        nhomVoDich: [{ tenNhom: 'Nhóm 3', diem: 78.5 }],
        bangNhom: [{ maNhom: 'n3', tenNhom: 'Nhóm 3', diem: 78.5, hang: 1 }, { maNhom: 'n1', tenNhom: 'Nhóm 1', diem: 66.2, hang: 2 }],
        tuan: [{ soTuan: 1, soThamGia: 30, soTinh: 36, tiLe: 83.3 }, { soTuan: 2, soThamGia: 33, soTinh: 36, tiLe: 91.7 }], thamGiaTrungBinh: 87.5,
        topCaNhan: [{ hoTen: 'Nguyễn Văn A', diemTB: 94.5, soTuan: 5 }], topCapBac: [{ hoTen: 'Nguyễn Văn A', tong: 1250, level: 13, tenCapLon: 'Đại Võ Sư' }],
        danhHieu: [{ hoTen: 'Nguyễn Văn A', soLan: 2 }], thongKe: { soTuanDaChot: 5, soCauHoi: 540, soLuotThi: 170, soDeTuTao: 120, soThanhVien: 37 },
      };
    case 'admin.ketThucHocKy':
    case 'admin.taoHocKy':
      return { soMon: 5, soNhom: 0, thuMucBaiHoc: 'public/bai-hoc/hk2/', maHocKy: 'hk2' };
    case 'admin.themMon':
      return { maHocKy: 'hk1-2026-2027', maMon: String(payload.maMon), duongDan: `public/bai-hoc/hk1-2026-2027/${String(payload.maMon)}/mon.json`, monJson: JSON.stringify({ ten: payload.tenMon, mau: payload.mau, chuong: [] }, null, 2) };
    case 'admin.bangDiem':
      return {
        tuan: [1, 2],
        nguoi: thanhVien.slice(0, 8).map((t, i) => ({
          hoTen: t.hoTen, email: t.email, nhom: i < 4 ? 'Nhóm 1' : 'Nhóm 2', diemTuan: { '1': 90 - i * 8, '2': i === 3 ? 'mien' : i === 5 ? null : 80 - i * 5 },
          soTuanThi: i === 5 ? 1 : 2, diemTB: 85 - i * 6, tongCapBac: 230 - i * 20, level: 3 - Math.floor(i / 4), tenCapLon: 'Võ Sĩ',
        })),
        nhom: [{ soTuan: 1, nhom: 'Nhóm 1', diem: 70, hang: 1, soThamGia: 4, soTinh: 4 }, { soTuan: 1, nhom: 'Nhóm 2', diem: 55.5, hang: 2, soThamGia: 3, soTinh: 4 }],
      };
    case 'admin.chamLaiTuan':
      return { soBaiDoi: 12, soCauBiLoai: 1 };
    case 'admin.nhatKy':
      return {
        tong: 3, trang: 1, coTrang: 50, cacHanhDong: ['chotChiaNhom', 'nopCauHoi', 'saoLuu'],
        dong: [
          { thoiGian: '2026-11-09T01:00:00Z', email: 'he_thong', hanhDong: 'chotTuan', doiTuong: 'hk1-2026-2027/1', chiTiet: '{"soNhom":6}' },
          { thoiGian: '2026-11-06T10:00:00Z', email: 'sv1@example.test', hanhDong: 'nopCauHoi', doiTuong: 'hk1-2026-2027/1', chiTiet: '{"soCau":15}' },
          { thoiGian: '2026-11-05T10:00:00Z', email: 'toi@example.test', hanhDong: 'chotChiaNhom', doiTuong: 'hk1-2026-2027', chiTiet: '{"soNhom":6}' },
        ],
      };
    case 'admin.saoLuuNgay':
      return { ten: 'Sao luu 2026-11-09 0300', url: 'https://drive.google.com/x', soBanHienCo: 3, daXoa: 0 };
    case 'admin.dsSaoLuu':
      return {
        thuMuc: 'Learning Group - Sao luu', url: 'https://drive.google.com/folder', soBanToiDa: 8,
        ban: [{ ten: 'Sao luu 2026-11-09 0300', ngay: '2026-11-08T20:00:00Z', url: 'https://drive.google.com/a' }, { ten: 'Sao luu 2026-11-02 0300', ngay: '2026-11-01T20:00:00Z', url: 'https://drive.google.com/b' }],
      };
    case 'admin.dsMon':
      return { mon: MON_GIA.map((m, i) => ({ ma: m.ma, ten: m.ten, mau: m.mau, chuong: i === 0 ? m.chuong : [], soCau: 40, giaTriTrongNganHang: [{ giaTri: 'c1', soCau: 30 }, { giaTri: i === 0 ? 'Chương hai' : 'Mở đầu', soCau: 10 }] })) };
    case 'admin.luuChuong':
    case 'admin.doiChuongCau':
      return { soCau: 10, chuong: [] };
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
    case 'thongBao':
      return thongBaoGia.map((t) => ({ id: t.id, ngay: t.ngay, tieuDe: t.tieuDe, noiDung: t.noiDung, rieng: t.nguoiNhan !== 'Cả lớp' }));
    case 'admin.tongQuan':
      return { choDuyet: nganHangGia.filter((c) => c.trangThai === 'cho_duyet').length };
    case 'admin.dsThongBao':
      return thongBaoGia;
    case 'admin.guiThongBao': {
      if (!String(payload.tieuDe ?? '').trim()) throw new LoiApi('thieu_tieu_de', 'Hãy nhập tiêu đề.');
      thongBaoGia = [{ id: 'tb-' + Date.now(), ngay: Date.now(), tieuDe: String(payload.tieuDe), noiDung: String(payload.noiDung), nguoiNhan: payload.loai === 'all' ? 'Cả lớp' : payload.loai === 'nhom' ? 'Một nhóm' : 'Từng người' }, ...thongBaoGia];
      return { id: thongBaoGia[0].id };
    }
    case 'admin.xoaThongBao':
      thongBaoGia = thongBaoGia.filter((t) => t.id !== payload.id);
      return { daXoa: true };
    case 'admin.nganHang':
      return { soChoDuyet: nganHangGia.filter((c) => c.trangThai === 'cho_duyet').length, tong: nganHangGia.length, trang: 1, coTrang: 50, cauHoi: nganHangGia };
    case 'admin.suaCauHoi':
    case 'admin.doiTrangThaiCau':
      return {};
    case 'admin.duyetCau': {
      const ids = (payload.ids as string[] | undefined) ?? nganHangGia.filter((c) => c.trangThai === 'cho_duyet').map((c) => c.id);
      let n = 0;
      nganHangGia.forEach((c) => {
        if (c.trangThai === 'cho_duyet' && ids.includes(c.id)) {
          c.trangThai = payload.quyetDinh === 'duyet' ? 'active' : 'tu_choi';
          (c as { ghiChuDuyet?: string }).ghiChuDuyet = String(payload.lyDo ?? '');
          n++;
        }
      });
      return { soCau: n, trangThai: payload.quyetDinh === 'duyet' ? 'active' : 'tu_choi' };
    }
    case 'admin.xuatChoDuyet': {
      const cho = nganHangGia.filter((c) => c.trangThai === 'cho_duyet');
      return {
        meta: { ngayXuat: new Date().toISOString(), maHocKy: 'hk1-2026-2027', soChoDuyet: cho.length, soThamKhao: 0, soNghiTrung: 0, huongDan: '' },
        cho: cho.map((c, i) => ({ ...c, tenMon: 'Khoa học dữ liệu', maTacGia: 'T0' + (i + 1), nghiTrung: [], quyetDinh: '', ghiChuDuyet: '' })),
        thamKhao: [],
      };
    }
    case 'admin.donCauTuChoi': {
      const truoc = nganHangGia.length;
      for (let i = nganHangGia.length - 1; i >= 0; i--) if (nganHangGia[i].trangThai === 'tu_choi') nganHangGia.splice(i, 1);
      return { soCau: truoc - nganHangGia.length };
    }
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
