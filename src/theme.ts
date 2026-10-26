// Giao diện sáng hoặc tối. Mặc định theo thiết bị; người dùng có thể chọn cố định ở trang Tài khoản.
export type CheDo = 'tu-dong' | 'sang' | 'toi';

const KHOA = 'lg_theme';

export function docCheDo(): CheDo {
  try {
    const v = localStorage.getItem(KHOA);
    return v === 'light' ? 'sang' : v === 'dark' ? 'toi' : 'tu-dong';
  } catch {
    return 'tu-dong';
  }
}

export function datCheDo(c: CheDo): void {
  const goc = document.documentElement;
  if (c === 'tu-dong') goc.removeAttribute('data-theme');
  else goc.setAttribute('data-theme', c === 'sang' ? 'light' : 'dark');
  try {
    if (c === 'tu-dong') localStorage.removeItem(KHOA);
    else localStorage.setItem(KHOA, c === 'sang' ? 'light' : 'dark');
  } catch {
    /* trình duyệt chặn lưu thì chỉ áp dụng cho lần này */
  }
}
