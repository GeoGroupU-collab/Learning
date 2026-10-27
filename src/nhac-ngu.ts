// Nhắc ngủ: khi người được chủ chọn đang dùng web trong khung 23:30 đến 7:00 (giờ Việt Nam), hiện lời nhắc kèm ảnh chú chó.
// Máy chủ quyết định có hiện hay không (đúng người, đúng giờ). Web chỉ hỏi lại mỗi 10 phút nếu người này có trong danh sách.
import { goi } from './api';
import { h } from './dom';
import type { NhacNgu } from './types';

const KHOA_TAT_DEM_NAY = 'lg_ngu_tat';
const MUOI_PHUT = 10 * 60 * 1000;
let hen: number | undefined;
let dangMo = false;

// Một "đêm" kéo từ 23:30 hôm trước đến 7:00 sáng hôm sau. Giờ Việt Nam sớm hơn UTC 7 tiếng nên ngày UTC của thời điểm
// đúng bằng ngày của đêm đó (23:45 ngày D giờ VN là 16:45 UTC ngày D; 06:59 ngày D+1 giờ VN là 23:59 UTC ngày D).
export function khoaDem(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function daTatDemNay(now: number): boolean {
  try {
    return localStorage.getItem(KHOA_TAT_DEM_NAY) === khoaDem(now);
  } catch {
    return false;
  }
}

function tatDemNay(now: number): void {
  try {
    localStorage.setItem(KHOA_TAT_DEM_NAY, khoaDem(now));
  } catch {
    /* không lưu được thì lời nhắc sẽ hiện lại sau 10 phút */
  }
}

// xemThu: chủ bấm xem thử ở web quản trị, chỉ có nút Đóng và không ghi gì.
export function hienNhacNgu(loiNhan: string, now: number, xemThu = false): void {
  if (dangMo) return;
  dangMo = true;
  const dong = (): void => {
    dangMo = false;
    lop.remove();
  };
  const nutNgu = h('button', { class: 'nut', type: 'button' }, xemThu ? 'Đóng' : 'Dạ, em đi ngủ đây') as HTMLButtonElement;
  nutNgu.addEventListener('click', () => {
    if (!xemThu) tatDemNay(now);
    dong();
  });
  const lop = h('div', { class: 'nhac-ngu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Nhắc đi ngủ' },
    h('div', { class: 'nhac-ngu-the' },
      h('img', { class: 'nhac-ngu-anh', src: new URL('anh/cun.jpg', document.baseURI).href, alt: 'Chú chó con nhìn bạn', width: 360, height: 474 }),
      h('h2', {}, xemThu ? 'Xem thử lời nhắc ngủ' : 'Đến giờ đi ngủ rồi'),
      h('p', { class: 'nhac-ngu-loi' }, loiNhan),
      h('div', { class: 'hang-nut nhac-ngu-nut' },
        nutNgu,
        ...(xemThu ? [] : [h('button', { class: 'nut nut-phu', type: 'button', onclick: dong }, 'Nhắc em sau 10 phút')]))));
  document.body.append(lop);
  nutNgu.focus();
}

async function hoiLai(): Promise<void> {
  if (document.hidden) return;
  try {
    capNhatNhacNgu(await goi<NhacNgu>('nhacNgu'));
  } catch {
    /* lần sau hỏi lại */
  }
}

export function capNhatNhacNgu(nn: NhacNgu | undefined): void {
  if (!nn || !nn.canHoi) {
    if (hen !== undefined) { clearInterval(hen); hen = undefined; }
    return;
  }
  if (nn.hien && !daTatDemNay(nn.now)) hienNhacNgu(nn.loiNhan, nn.now);
  if (hen === undefined) hen = window.setInterval(() => void hoiLai(), MUOI_PHUT);
}
