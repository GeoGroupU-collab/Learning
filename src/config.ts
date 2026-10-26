// Thông tin công khai theo thiết kế (Client ID và địa chỉ Web app không phải bí mật).

export const CONFIG = {
  TEN_WEB: 'Learning Group',
  GOOGLE_CLIENT_ID: '418265687952-r5pd49s2m4mk4q6g537nmk2jcblb88nn.apps.googleusercontent.com',
  API_URL: 'https://script.google.com/macros/s/AKfycbysLVLGOVoRYQt75szTor4nPPnvBSrxWlaAjj4L2eMdagm5wnXzd9TW7gRYTp2ApWQQ/exec',
};

// Chế độ phát triển với dữ liệu giả: chỉ bật khi chạy `npm run dev:mock`.
// Giá trị này được thay tĩnh lúc build nên bản đưa lên không chứa mã giả lập.
export const DEV_MOCK = import.meta.env.MODE === 'mock';

export function chuaCauHinh(): boolean {
  return CONFIG.GOOGLE_CLIENT_ID.includes('ĐIỀN VÀO ĐÂY') || CONFIG.API_URL.includes('ĐIỀN VÀO ĐÂY');
}
