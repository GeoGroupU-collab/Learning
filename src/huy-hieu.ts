// Huy hiệu nhóm tính từ các tuần đã chốt. Không dùng DOM nên kiểm thử được.
import type { NhomXepHang } from './types';

export interface TuanDaChot {
  soTuan: number;
  daChot: boolean;
  nhom: NhomXepHang[];
}

export interface HuyHieuNhom {
  dayQuan: number; // số tuần cả nhóm cùng thi ("Đủ quân")
  hangNhatLienTiep: number; // số tuần liên tiếp đứng hạng 1 tính đến tuần gần nhất (hiện huy hiệu khi từ 2 tuần)
  tuanDayQuan: number[];
}

export function tinhHuyHieu(cacTuan: TuanDaChot[], maNhom: string): HuyHieuNhom {
  const ds = cacTuan.filter((t) => t.daChot).sort((a, b) => a.soTuan - b.soTuan);
  const tuanDayQuan: number[] = [];
  ds.forEach((t) => {
    const n = t.nhom.find((x) => x.maNhom === maNhom);
    if (n && (n.soTinh ?? 0) > 0 && n.soThamGia === n.soTinh) tuanDayQuan.push(t.soTuan);
  });
  let chuoi = 0;
  for (let i = ds.length - 1; i >= 0; i--) {
    const n = ds[i].nhom.find((x) => x.maNhom === maNhom);
    if (n && n.hang === 1) chuoi++;
    else break;
  }
  return { dayQuan: tuanDayQuan.length, hangNhatLienTiep: chuoi, tuanDayQuan };
}

// Chữ hiển thị cho các huy hiệu đang có.
export function nhanHuyHieu(h: HuyHieuNhom): string[] {
  const kq: string[] = [];
  if (h.dayQuan > 0) kq.push(h.dayQuan > 1 ? `Đủ quân ×${h.dayQuan}` : 'Đủ quân');
  if (h.hangNhatLienTiep >= 2) kq.push(`Hạng nhất liên tiếp ×${h.hangNhatLienTiep}`);
  return kq;
}
