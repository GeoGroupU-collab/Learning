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
}

export interface ChiTietNhom {
  maNhom: string;
  tenNhom: string;
  linkZalo: string;
  thanhVien: ThanhVienNhom[];
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
