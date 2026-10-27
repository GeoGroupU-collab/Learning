// Hiển thị chữ của câu hỏi có code. Nội dung câu hỏi có thể chứa khối code đặt giữa hai dòng ```; đáp án có thể bọc
// trong dấu ` để hiện bằng chữ đơn cách (giữ nguyên khoảng trắng). Chỉ dùng textContent nên không thể chèn HTML.
import { h } from './dom';

export interface Doan {
  ma: boolean;
  chu: string;
}

// Tách chữ thường và khối code. Khối ``` chưa đóng thì phần còn lại coi là code.
export function tachDoan(text: string): Doan[] {
  const kq: Doan[] = [];
  const phan = String(text ?? '').split('```');
  phan.forEach((p, i) => {
    const ma = i % 2 === 1;
    const chu = ma ? p.replace(/^[^\S\n]*\n/, '').replace(/\n[^\S\n]*$/, '') : p;
    if (chu.trim() === '' && !ma) return;
    kq.push({ ma, chu });
  });
  return kq;
}

// Đáp án bọc trọn trong cặp dấu ` thì là code.
export function laDapAnCode(text: string): boolean {
  const s = String(text ?? '').trim();
  return s.length >= 2 && s.startsWith('`') && s.endsWith('`') && !s.slice(1, -1).includes('`');
}

export function boDauCode(text: string): string {
  const s = String(text ?? '');
  const t = s.trim();
  return laDapAnCode(s) ? t.slice(1, -1) : s;
}

export function vanBanCau(text: string, lop = 'noi-dung-cau'): HTMLElement {
  const khung = h('div', { class: lop });
  tachDoan(text).forEach((d) => khung.append(d.ma ? h('pre', { class: 'ma-cau' }, d.chu) : h('span', { class: 'doan-chu' }, d.chu)));
  return khung;
}

// Đáp án: chữ thường hoặc code. Giữ khoảng trắng và xuống dòng.
export function vanBanDapAn(text: string): HTMLElement {
  return laDapAnCode(text) ? h('code', { class: 'ma-dong' }, boDauCode(text)) : h('span', { class: 'doan-chu' }, String(text ?? ''));
}

// Dùng cho chỗ chỉ nhận chuỗi (tiêu đề tóm tắt): bỏ dấu và rút gọn.
export function chuTomTat(text: string, dai = 70): string {
  const s = String(text ?? '').replace(/```/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > dai ? `${s.slice(0, dai)}...` : s;
}
