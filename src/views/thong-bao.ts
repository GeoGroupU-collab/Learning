import { goiNhanh } from '../api';
import { h, xoaHet } from '../dom';
import { icon } from '../icon';
import { dinhDangNgay } from '../gio';
import type { ThongBaoCuaToi } from '../types';

// Mốc "đã xem" lưu ở máy mỗi người. Thông báo có thời điểm lớn hơn mốc này là thông báo mới.
const KHOA_DA_XEM = 'lg_tb_xem';
let tbMoiNhat = 0;

function docDaXem(): number {
  try {
    return Number(localStorage.getItem(KHOA_DA_XEM)) || 0;
  } catch {
    return 0;
  }
}

function datDaXem(ms: number): void {
  try {
    localStorage.setItem(KHOA_DA_XEM, String(ms));
  } catch {
    /* bỏ qua */
  }
}

export function coThongBaoMoi(): boolean {
  return tbMoiNhat > docDaXem();
}

// Bật hoặc tắt chấm báo ở mục Sự kiện (thanh điều hướng) và ở tab Thông báo.
export function capNhatCham(): void {
  const bat = coThongBaoMoi();
  document.querySelectorAll('.thanh-duoi a[data-href="#/su-kien"], .tab-tb').forEach((el) => el.classList.toggle('co-cham', bat));
}

export function datThongBaoMoiNhat(ms: number | undefined): void {
  tbMoiNhat = ms ?? 0;
  capNhatCham();
}

// Thanh chuyển giữa các mục của Sự kiện.
export function thanhTabSuKien(dang: 'tuan' | 'thong-bao'): HTMLElement {
  return h('div', { class: 'tabs' },
    h('a', { class: dang === 'tuan' ? 'tab tab-dang' : 'tab', href: '#/su-kien' }, 'Tuần này'),
    h('a', { class: `${dang === 'thong-bao' ? 'tab tab-dang' : 'tab'} tab-tb${coThongBaoMoi() && dang !== 'thong-bao' ? ' co-cham' : ''}`, href: '#/su-kien/thong-bao' }, 'Thông báo'));
}

function theThongBao(t: ThongBaoCuaToi, daXem: number): HTMLElement {
  const moi = t.ngay > daXem;
  return h('div', { class: moi ? 'card tb-the tb-moi' : 'card tb-the' },
    h('div', { class: 'hang' },
      h('div', { class: 'mon-ten' }, t.tieuDe),
      h('div', { class: 'tb-nhan' },
        moi ? h('span', { class: 'nhan-moi' }, 'Mới') : null,
        t.rieng ? h('span', { class: 'nhan nhan-xam' }, 'Gửi riêng') : null)),
    h('p', { class: 'noi-dung-tb' }, t.noiDung),
    h('div', { class: 'phu nho' }, dinhDangNgay(t.ngay)));
}

export async function veThongBao(goc: HTMLElement): Promise<void> {
  xoaHet(goc);
  const daXem = docDaXem(); // giữ mốc cũ để còn đánh dấu "Mới" trong lần mở này
  const ve = (ds: ThongBaoCuaToi[]): void => {
    xoaHet(goc);
    goc.append(h('h1', {}, 'Sự kiện'), thanhTabSuKien('thong-bao'));
    if (!ds.length) {
      goc.append(h('div', { class: 'card rong-ruot' },
        icon('chuong', 28) as unknown as HTMLElement,
        h('div', { class: 'mon-ten' }, 'Chưa có thông báo'),
        h('p', { class: 'phu nho' }, 'Khi lớp trưởng có tin về họp lớp, lịch thi hay giải thưởng, tin sẽ hiện ở đây.')));
      return;
    }
    ds.forEach((t) => goc.append(theThongBao(t, daXem)));
    const moiNhat = Math.max(...ds.map((t) => t.ngay));
    datDaXem(Math.max(moiNhat, docDaXem()));
    tbMoiNhat = Math.max(tbMoiNhat, moiNhat);
    capNhatCham();
  };
  goc.append(h('h1', {}, 'Sự kiện'), thanhTabSuKien('thong-bao'), h('p', { class: 'phu' }, 'Đang tải...'));
  await goiNhanh<ThongBaoCuaToi[]>('thongBao', {}, (ds) => ve(ds));
}
