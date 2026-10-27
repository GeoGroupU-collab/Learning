import { CONFIG, DEV_MOCK } from './config';
import { layToken, layPhien, lamMoiToken, xoaPhien } from './auth';

export class LoiApi extends Error {
  constructor(public ma: string, message: string) {
    super(message);
  }
}

// Gọi máy chủ bằng POST text/plain để tránh preflight CORS.
// Gặp token_expired thì xin token mới và gửi lại đúng một lần.
// ---------- Bộ nhớ tạm cho web quản trị ----------
// Chỉ bật ở web quản trị (chủ dùng một mình). Các lệnh đọc được nhớ 60 giây trong bộ nhớ của trang, và được gọi sẵn ngay khi mở
// web, nên chuyển tab là hiện liền. Mọi lệnh ghi đều xóa bộ nhớ này để không bao giờ hiện số liệu cũ sau khi vừa sửa.
const GIAY_NHO_ADMIN = 60000;
const LENH_DOC_NHO = new Set(['tuanHienTai', 'admin.dsThanhVien', 'admin.dsThongBao', 'admin.nhomHienTai', 'admin.dsTuan', 'admin.dsHocKy', 'admin.dsMon', 'admin.dsDeThi', 'admin.dsSaoLuu', 'admin.tongQuan', 'admin.nganHang', 'admin.bangDiem', 'admin.nhatKy', 'admin.tongKet']);
const LENH_KHONG_GHI = /^admin\.(xemTruoc|xuat|layDeThi)/;
const boNhoAdmin = new Map<string, { luc: number; p: Promise<unknown> }>();
let dungBoNhoAdmin = false;

export function batBoNhoAdmin(): void {
  dungBoNhoAdmin = true;
}

// Bỏ hết dữ liệu đã nhớ để lần đọc sau lấy mới từ máy chủ (nút Làm mới).
export function xoaBoNhoAdmin(): void {
  boNhoAdmin.clear();
}

export async function goi<T>(action: string, payload: Record<string, unknown> = {}, thuLai = true): Promise<T> {
  if (dungBoNhoAdmin && thuLai) {
    if (LENH_DOC_NHO.has(action)) {
      const khoa = action + ':' + JSON.stringify(payload);
      const co = boNhoAdmin.get(khoa);
      if (co && Date.now() - co.luc < GIAY_NHO_ADMIN) return structuredClone(await co.p) as T;
      const p = goiThat<T>(action, payload, thuLai);
      boNhoAdmin.set(khoa, { luc: Date.now(), p });
      p.catch(() => boNhoAdmin.delete(khoa));
      return structuredClone(await p) as T;
    }
    if (action.startsWith('admin.') && !LENH_KHONG_GHI.test(action)) {
      const kq = await goiThat<T>(action, payload, thuLai);
      boNhoAdmin.clear();
      return kq;
    }
  }
  return goiThat<T>(action, payload, thuLai);
}

async function goiThat<T>(action: string, payload: Record<string, unknown> = {}, thuLai = true): Promise<T> {
  if (DEV_MOCK) {
    const { mockGoi } = await import('./mock');
    return (await mockGoi(action, payload)) as T;
  }
  let res: Response;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...(action !== 'dangNhap' && layPhien() ? { phien: layPhien() } : { idToken: layToken() }), ...payload }),
    });
  } catch {
    throw new LoiApi('mang', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }
  const j = (await res.json()) as { ok: boolean; data?: T; error?: string; message?: string };
  if (!j.ok) {
    if (j.error === 'phien_het_han') {
      xoaPhien();
      xoaCache();
      window.dispatchEvent(new Event('phien-het-han'));
    }
    if (j.error === 'token_expired' && thuLai && (await lamMoiToken())) return goi<T>(action, payload, false);
    throw new LoiApi(j.error ?? 'loi', j.message ?? 'Có lỗi xảy ra.');
  }
  return j.data as T;
}

// ---------- Hiện ngay từ bộ nhớ, cập nhật sau ----------
// Chỉ lưu các màn hình xem (không có nội dung đề thi hay câu hỏi). Lưu trong localStorage của chính người dùng
// và xóa khi đăng xuất hoặc hết phiên.

const TIEN_TO_CACHE = 'lg_c:';
const DUOC_LUU = new Set(['trangChu', 'tuanHienTai', 'xepHang', 'xepHangCaNhan', 'nhomCuaToi', 'taoDe.thongTin', 'thongBao']);

const khoaCache = (action: string, payload: Record<string, unknown>): string => TIEN_TO_CACHE + action + ':' + JSON.stringify(payload);

export function docCache<T>(action: string, payload: Record<string, unknown> = {}): T | null {
  if (!DUOC_LUU.has(action)) return null;
  try {
    const s = localStorage.getItem(khoaCache(action, payload));
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

export function ghiCache(action: string, payload: Record<string, unknown>, du: unknown): void {
  if (!DUOC_LUU.has(action)) return;
  try {
    localStorage.setItem(khoaCache(action, payload), JSON.stringify(du));
  } catch {
    /* bộ nhớ đầy hoặc bị chặn thì bỏ qua */
  }
}

export function xoaCache(): void {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(TIEN_TO_CACHE)).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* bỏ qua */
  }
}

// Gọi khiCoDuLieu ngay với bản đã lưu (nếu có), rồi gọi lại với dữ liệu mới từ máy chủ.
// Lỗi mạng khi đã có bản lưu thì giữ nguyên bản lưu, không báo lỗi.
export async function goiNhanh<T>(action: string, payload: Record<string, unknown>, khiCoDuLieu: (du: T, tuCache: boolean) => void): Promise<T | null> {
  const cu = docCache<T>(action, payload);
  if (cu !== null) khiCoDuLieu(cu, true);
  try {
    const moi = await goi<T>(action, payload);
    ghiCache(action, payload, moi);
    khiCoDuLieu(moi, false);
    return moi;
  } catch (e) {
    if (cu === null) throw e;
    return null;
  }
}
