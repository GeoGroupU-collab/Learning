export interface Me {
  email: string;
  hoTen: string;
  vaiTro: 'owner' | 'member';
  hocKy: { maHocKy: string; tenHocKy: string } | null;
  nhom: { maNhom: string; tenNhom: string } | null;
}

export interface ThanhVienNhom {
  email: string;
  hoTen: string;
  trangThai: string;
  tt?: string;
  diem?: number | null;
}

export interface ChiTietNhom {
  maNhom: string;
  tenNhom: string;
  linkZalo: string;
  thanhVien: ThanhVienNhom[];
  tuan?: { soTuan: number; trangThai: string } | null;
}

export interface ThanhVienDs {
  email: string;
  hoTen: string;
  vaiTro: 'owner' | 'assistant' | 'member';
  trangThai: 'pending' | 'active' | 'withdrawn' | 'removed';
  ngayThamGia: string;
}

export interface NguoiGpa {
  email: string;
  hoTen: string;
  gpa: number | null;
}

export interface NhomXemTruoc {
  maNhom?: string;
  tenNhom: string;
  thanhVien: NguoiGpa[];
}

export interface KetQuaXemTruoc {
  kichThuoc: number;
  doLech: number;
  thieuGpa: { email: string; hoTen: string }[];
  nhoms: NhomXemTruoc[];
}

export interface NhomHienTai {
  nhoms: NhomXemTruoc[];
  chuaCoNhom: { email: string; hoTen: string }[];
}

export interface BaiHoc {
  file: string;
  ten: string;
  capNhat: string;
}

export interface MonHoc {
  ma: string;
  ten: string;
  mau: string;
  chuong: { ma: string; ten: string }[];
  baiHoc: BaiHoc[];
}

export interface Manifest {
  hocKy: { ma: string; mon: MonHoc[] }[];
}

export interface MonNop {
  ma: string;
  ten: string;
  mau: string;
  chuong: { ma: string; ten: string }[];
}

export interface TuanHienTai {
  now: number;
  tuan: null | {
    soTuan: number;
    hanNop: number;
    moCua: number;
    dongCua: number;
    trangThai: 'nop_cau_hoi' | 'cho_mo_cua' | 'mo' | 'dong';
    moc: { nhan: string; luc: number } | null;
  };
  mon?: MonNop[];
  yeuCau?: { soMon: number; soCauMoiMon: number };
  soMienToiDa?: number;
  duyetTruoc?: boolean;
  soCauDaNop?: number;
  soCauCanNop?: number;
  moKhoa?: boolean;
  mien?: boolean;
  soMienDaDung?: number;
  thi?: { soMonThi: number; soCauMoiMonThi: number; thoiGianPhut: number };
  deCoDinh?: null | { soCau: number; tenDe: string };
  luotThi?: null | LuotThiTomTat;
}

export interface LuotThiTomTat {
  trangThai: 'dang_lam' | 'da_nop' | 'het_gio';
  hetHanLuc?: number;
  soDung?: number;
  soCau?: number;
  diem?: number;
  giayLam?: number;
}

export interface CauThi {
  id: string;
  maMon: string;
  noiDung: string;
  dapAn: { k: string; text: string }[];
}

export interface DuLieuThi {
  trangThai: 'dang_lam';
  maPhienThi: string;
  hetHanLuc: number;
  now: number;
  cauHoi: CauThi[];
  traLoi: Record<string, string>;
}

export interface NhomXepHang {
  maNhom: string;
  tenNhom: string;
  diem: number;
  hang: number;
  soTinh?: number;
  soThamGia?: number;
}

export interface KetQuaXepHang {
  tuanHienTai: null | { soTuan: number; daChot: boolean; nhom: NhomXepHang[] };
  cacTuan: { soTuan: number; daChot: boolean; nhom: NhomXepHang[] }[];
  luyKe: NhomXepHang[];
  vinhDanh: null | { soTuan: number; nhom: { tenNhom: string; diem: number }[] };
  nhomToi: string | null;
}

export interface CauNhap {
  maChuong: string;
  trangNguon: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  giaiThich: string;
}

export interface BanNhap {
  monChon: string[];
  cau: Record<string, CauNhap[]>;
}

export interface CauCuaToi {
  id: string;
  soTuan: number;
  tenMon: string;
  maChuong: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  trangNguon: string;
  giaiThich: string;
  trangThai: string;
  ghiChuDuyet?: string;
  soBaoSai: number;
}

export interface TuanQuanTri {
  idDe?: string;
  thoiGianPhut?: number;
  soTuan: number;
  hanNop: number;
  moCua: number;
  dongCua: number;
  trangThai: string;
}

export interface ThongTinCap {
  tong: number;
  level: number;
  diemTrongLevel: number;
  diemMoiLevel: number;
  tenCapLon: string;
  levelDauCap: number;
  levelCuoiCap: number | null;
  capKe: string | null;
  levelConLaiDenCapKe: number | null;
}

export interface ThongTinTaoDe {
  cap: ThongTinCap;
  diemTuanNay: number;
  diemToiDaTuan: number;
  diemMoiDe: number;
  soCauMoiDe: number;
  soCauToiThieu: number;
  mon: { ma: string; ten: string; mau: string; soCau: number; chuong: { ma: string; ten: string; soCau: number }[] }[];
  dePhatHanh: { idDe: string; tenDe: string; soCau: number; daLam: null | { diem: number; soDung: number; soCau: number } }[];
  dangMo: boolean;
}

export interface TrangChuData {
  me: Me;
  tuan: TuanHienTai;
  cap: ThongTinCap;
  tbMoiNhat?: number; // thời điểm thông báo mới nhất dành cho mình (0 nếu chưa có)
}

export interface ThongBaoCuaToi {
  id: string;
  ngay: number;
  tieuDe: string;
  noiDung: string;
  rieng: boolean; // gửi riêng cho mình hoặc cho nhóm mình, không phải cả lớp
}

export interface ThongBaoQuanTri {
  id: string;
  ngay: number;
  tieuDe: string;
  noiDung: string;
  nguoiNhan: string;
}

export interface CauXemLai {
  id: string;
  tenMon: string;
  maChuong: string;
  trangNguon: string;
  noiDung: string;
  giaiThich: string;
  dapAn: { k: string; text: string }[];
  chon: string;
  dung: string;
  laDung: boolean;
}

export interface KetQuaTaoDe {
  soDung: number;
  soCau: number;
  diem: number;
  diemThuong: number;
  cauHoi: CauXemLai[];
  cap: ThongTinCap;
}

export interface DeTaoDe {
  trangThai: 'dang_lam';
  maLuot: string;
  tenMon: string;
  chuong: string[];
  soCau: number;
  cauHoi: CauThi[];
}

export interface MonQuanTri {
  ma: string;
  ten: string;
  mau: string;
  chuong: { ma: string; ten: string }[];
  soCau: number;
  giaTriTrongNganHang: { giaTri: string; soCau: number }[];
}

export interface DongXepHangCaNhan {
  hang: number;
  hoTen: string;
  tong: number;
  level: number;
  tenCapLon: string;
  soDanhHieu: number;
  laToi: boolean;
}

export interface KetQuaXepHangCaNhan {
  bang: DongXepHangCaNhan[];
  vinhDanh: null | { soTuan: number; nguoi: { hoTen: string; diem: number; danhHieu: string }[] };
  toi: { hang: number | null; cap: ThongTinCap; danhHieu: { soTuan: number; danhHieu: string; diem: number }[] };
}

export interface KetQuaXemLai {
  cacTuan: number[];
  soTuan: number | null;
  diem?: number;
  soDung?: number;
  soCau?: number;
  cauHoi: CauXemLai[];
}

export interface CauKho {
  id: string;
  tenMon: string;
  maChuong: string;
  trangNguon: string;
  noiDung: string;
  dapAn: { k: string; text: string }[];
  dung: string;
  giaiThich: string;
  soLuot: number;
  tyLeSai: number;
}

export interface CauNganHang {
  id: string;
  maHocKy: string;
  soTuan: number;
  maMon: string;
  maChuong: string;
  trangNguon: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  giaiThich: string;
  tacGia: string;
  tenTacGia: string;
  trangThai: 'active' | 'suspended' | 'removed' | 'cho_duyet' | 'tu_choi';
  ghiChuDuyet?: string;
  daKiemTra?: boolean;
  ngayNop: string;
  soBaoSai: number;
}

export interface KetQuaNganHang {
  soChoDuyet: number;
  soTamLoai?: number;
  tong: number;
  trang: number;
  coTrang: number;
  cauHoi: CauNganHang[];
}

export interface XemTruocNhap {
  thayDoi: { id: string; diff: Record<string, { tu: string; den: string }> }[];
  loi: { id: string; loi: string[] }[];
  khongCo: string[];
  khongDoi: number;
  soDuyet?: number;
  soTuChoi?: number;
}

export interface CauDe {
  id: string;
  soTuan: number;
  maMon: string;
  tenMon: string;
  maChuong: string;
  trangNguon: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  giaiThich: string;
  tacGia: string;
  tenTacGia: string;
  trangThai: string;
}

export interface DeThiTomTat {
  idDe: string;
  tenDe: string;
  soCau: number;
  trangThai: 'nhap' | 'phat_hanh' | 'luu_tru';
  ngayTao: string;
  tuanGan: number | null;
}

export interface DeThiDayDu {
  idDe: string;
  tenDe: string;
  trangThai: string;
  cau: CauDe[];
}

export interface HocKyTomTat {
  maHocKy: string;
  tenHocKy: string;
  batDau: string;
  ketThuc: string;
  trangThai: 'mo' | 'dong';
  coTongKet: boolean;
}

export interface TongKetHocKy {
  maHocKy: string;
  tenHocKy: string;
  ngayTongKet: string;
  nhomVoDich: { tenNhom: string; diem: number }[];
  bangNhom: { maNhom: string; tenNhom: string; diem: number; hang: number }[];
  tuan: { soTuan: number; soThamGia: number; soTinh: number; tiLe: number }[];
  thamGiaTrungBinh: number;
  topCaNhan: { hoTen: string; diemTB: number; soTuan: number }[];
  topCapBac: { hoTen: string; tong: number; level: number; tenCapLon: string }[];
  danhHieu: { hoTen: string; soLan: number }[];
  thongKe: { soTuanDaChot: number; soCauHoi: number; soLuotThi: number; soDeTuTao: number; soThanhVien: number };
}

export interface BangDiemKq {
  tuan: number[];
  nguoi: {
    hoTen: string; email: string; nhom: string; diemTuan: Record<string, number | 'mien' | null>; soTuanThi: number; diemTB: number | null;
    tongCapBac: number; level: number; tenCapLon: string;
  }[];
  nhom: { soTuan: number; nhom: string; diem: number; hang: number; soThamGia: number; soTinh: number }[];
}

export interface NhatKyKq {
  tong: number;
  trang: number;
  coTrang: number;
  cacHanhDong: string[];
  dong: { thoiGian: string; email: string; hanhDong: string; doiTuong: string; chiTiet: string }[];
}

export interface SaoLuuKq {
  thuMuc: string;
  url: string;
  soBanToiDa: number;
  ban: { ten: string; ngay: string; url: string }[];
}

// Đợt câu hỏi chờ duyệt xuất ra để rà soát bên ngoài. Tác giả chỉ hiện bằng mã (T01, T02...).
export interface CauChoDuyet {
  id: string;
  maHocKy: string;
  soTuan: number;
  maMon: string;
  tenMon: string;
  maChuong: string;
  trangNguon: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  giaiThich: string;
  maTacGia: string;
  nghiTrung: { id: string; doGiong: number }[];
  quyetDinh: string;
  ghiChuDuyet: string;
}

export interface CauThamKhao {
  id: string;
  maMon: string;
  maChuong: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  maTacGia: string;
}

export interface DotChoDuyet {
  meta: { ngayXuat: string; maHocKy: string; soChoDuyet: number; soThamKhao: number; soNghiTrung: number; huongDan: string };
  cho: CauChoDuyet[];
  thamKhao: CauThamKhao[];
}
