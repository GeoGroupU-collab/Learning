// Màu môn học. Dữ liệu (Sheet hoặc mon.json) có thể ghi một màu bất kỳ; giao diện chỉ lấy sắc độ (hue)
// rồi tô lại bằng độ bão hòa và độ sáng chuẩn theo giao diện sáng hoặc tối, để các môn luôn hài hòa và đọc được.

export function sacDo(hex: string | undefined): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex ?? '').trim());
  if (!m) return 190;
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 210;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

// Chuỗi style để gắn vào phần tử: đặt biến --h, còn CSS tự tính ra màu.
export function mauMon(hex: string | undefined): string {
  return `--h:${sacDo(hex)}`;
}
