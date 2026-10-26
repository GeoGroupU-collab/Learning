// Thông tin công khai theo thiết kế (Client ID và địa chỉ Web app không phải bí mật).
// Chủ điền hai giá trị dưới đây sau khi làm xong HUONG-DAN-CHU.md, Phần 2.

export const CONFIG = {
  TEN_WEB: 'Learning Group',
  GOOGLE_CLIENT_ID: 'ĐIỀN VÀO ĐÂY',
  API_URL: 'ĐIỀN VÀO ĐÂY',
};

// Chế độ phát triển với dữ liệu giả: chỉ bật khi chạy `npm run dev:mock`.
// Giá trị này được thay tĩnh lúc build nên bản đưa lên không chứa mã giả lập.
export const DEV_MOCK = import.meta.env.MODE === 'mock';

export function chuaCauHinh(): boolean {
  return CONFIG.GOOGLE_CLIENT_ID.includes('418265687952-r5pd49s2m4mk4q6g537nmk2jcblb88nn.apps.googleusercontent.com') || CONFIG.API_URL.includes('https://script.google.com/macros/s/AKfycbysLVLGOVoRYQt75szTor4nPPnvBSrxWlaAjj4L2eMdagm5wnXzd9TW7gRYTp2ApWQQ/exec');
}
