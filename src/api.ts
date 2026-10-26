import { CONFIG, DEV_MOCK } from './config';
import { layToken, lamMoiToken } from './auth';

export class LoiApi extends Error {
  constructor(public ma: string, message: string) {
    super(message);
  }
}

// Gọi máy chủ bằng POST text/plain để tránh preflight CORS.
// Gặp token_expired thì xin token mới và gửi lại đúng một lần.
export async function goi<T>(action: string, payload: Record<string, unknown> = {}, thuLai = true): Promise<T> {
  if (DEV_MOCK) {
    const { mockGoi } = await import('./mock');
    return (await mockGoi(action, payload)) as T;
  }
  let res: Response;
  try {
    res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, idToken: layToken(), ...payload }),
    });
  } catch {
    throw new LoiApi('mang', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }
  const j = (await res.json()) as { ok: boolean; data?: T; error?: string; message?: string };
  if (!j.ok) {
    if (j.error === 'token_expired' && thuLai && (await lamMoiToken())) return goi<T>(action, payload, false);
    throw new LoiApi(j.error ?? 'loi', j.message ?? 'Có lỗi xảy ra.');
  }
  return j.data as T;
}
