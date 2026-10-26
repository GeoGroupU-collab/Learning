// Đăng nhập Google Identity Services. ID token chỉ giữ trong bộ nhớ, không lưu localStorage.
import { CONFIG, DEV_MOCK } from './config';

interface GoogleId {
  initialize(cfg: Record<string, unknown>): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
  prompt(cb?: (n: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void): void;
  disableAutoSelect(): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let token: string | null = null;
let khiCoToken: ((ok: boolean) => void) | null = null;
let khoiTaoXong = false;

export function layToken(): string | null {
  return DEV_MOCK ? 'mock' : token;
}

export function daDangNhap(): boolean {
  return DEV_MOCK ? true : token !== null;
}

export function dangXuat(): void {
  token = null;
  window.google?.accounts.id.disableAutoSelect();
}

function napScript(): Promise<void> {
  return new Promise((ok, loi) => {
    if (window.google) return ok();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => loi(new Error('Không tải được Google. Kiểm tra mạng rồi thử lại.'));
    document.head.append(s);
  });
}

async function khoiTao(khiDangNhap: () => void): Promise<void> {
  await napScript();
  if (khoiTaoXong) return;
  window.google!.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: (r: { credential: string }) => {
      token = r.credential;
      if (khiCoToken) {
        khiCoToken(true);
        khiCoToken = null;
      } else khiDangNhap();
    },
    auto_select: false,
    use_fedcm_for_prompt: true,
  });
  khoiTaoXong = true;
}

export async function veNutDangNhap(khung: HTMLElement, khiDangNhap: () => void): Promise<void> {
  await khoiTao(khiDangNhap);
  window.google!.accounts.id.renderButton(khung, {
    theme: 'filled_black',
    size: 'large',
    text: 'signin_with',
    locale: 'vi',
    width: 280,
  });
}

// Xin token mới khi máy chủ báo hết hạn. Trả false nếu không lấy được (khi đó trang quay về màn đăng nhập).
export function lamMoiToken(): Promise<boolean> {
  if (DEV_MOCK || !khoiTaoXong) return Promise.resolve(false);
  return new Promise((xong) => {
    const hetGio = setTimeout(() => {
      khiCoToken = null;
      xong(false);
    }, 8000);
    khiCoToken = (ok) => {
      clearTimeout(hetGio);
      xong(ok);
    };
    window.google!.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        clearTimeout(hetGio);
        khiCoToken = null;
        xong(false);
      }
    });
  });
}
