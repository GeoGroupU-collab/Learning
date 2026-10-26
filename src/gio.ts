// Đếm ngược và định dạng giờ. Giờ hiển thị lấy theo giờ máy chủ để người dùng sai đồng hồ vẫn thấy đúng.

let chenhLech = 0;
const dongHo: number[] = [];
const donDep: (() => void)[] = [];

// Đăng ký việc dọn dẹp chạy khi rời trang (cùng lúc dừng đồng hồ).
export function khiRoiTrang(viec: () => void): void {
  donDep.push(viec);
}

export function datGioMayChu(now: number): void {
  chenhLech = now - Date.now();
}

export function bayGio(): number {
  return Date.now() + chenhLech;
}

export function dinhDangNgay(ms: number): string {
  return new Date(ms).toLocaleString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function dinhDangDemNguoc(conLaiMs: number): string {
  const s = Math.max(0, Math.floor(conLaiMs / 1000));
  const ngay = Math.floor(s / 86400);
  const g = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const p = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const giay = String(s % 60).padStart(2, '0');
  return `${ngay > 0 ? `${ngay} ngày ` : ''}${g}:${p}:${giay}`;
}

// Gắn đồng hồ đếm ngược vào một phần tử; chỉ chạy khi tab đang hiển thị.
export function demNguoc(el: HTMLElement, luc: number, khiHet?: () => void): void {
  const capNhat = (): void => {
    if (document.hidden) return;
    const con = luc - bayGio();
    el.textContent = dinhDangDemNguoc(con);
    if (con <= 0) {
      dungDongHo();
      khiHet?.();
    }
  };
  capNhat();
  dongHo.push(window.setInterval(capNhat, 1000));
}

export function dungDongHo(): void {
  while (dongHo.length) clearInterval(dongHo.pop());
  while (donDep.length) donDep.pop()!();
}

// Chạy một việc định kỳ, tự dừng khi chuyển trang (dungDongHo). Bỏ qua khi tab đang ẩn.
export function chayDinhKy(viec: () => void, ms: number, chiKhiHienThi = true): void {
  dongHo.push(window.setInterval(() => {
    if (chiKhiHienThi && document.hidden) return;
    viec();
  }, ms));
}
