export interface Me {
  email: string;
  hoTen: string;
  vaiTro: 'owner' | 'assistant' | 'member';
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
  soCauDaNop?: number;
  soCauCanNop?: number;
  moKhoa?: boolean;
  mien?: boolean;
  soMienDaDung?: number;
  thi?: { soMonThi: number; soCauMoiMonThi: number; thoiGianPhut: number };
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
  soBaoSai: number;
}

export interface TuanQuanTri {
  soTuan: number;
  hanNop: number;
  moCua: number;
  dongCua: number;
  trangThai: string;
}
