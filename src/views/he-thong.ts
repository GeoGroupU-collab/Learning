import { goi, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import type { NhatKyKq, SaoLuuKq } from '../types';

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

const gio = (iso: string): string => (iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');

export async function veNhatKy(noi: HTMLElement): Promise<void> {
  const loc = { hanhDong: '', email: '', tuKhoa: '', trang: 1 };
  const danhSach = h('div', {});
  const phanTrang = h('div', { class: 'hang' });
  const chonHd = h('select', { class: 'o-chon o-day' }, h('option', { value: '' }, 'Mọi hành động')) as HTMLSelectElement;
  const email = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Người làm (email)' }) as HTMLInputElement;
  const tuKhoa = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Từ khóa trong đối tượng hoặc chi tiết' }) as HTMLInputElement;
  let daNapHd = false;

  const tai = async (): Promise<void> => {
    xoaHet(danhSach);
    danhSach.append(khungCho(1));
    try {
      const kq = await goi<NhatKyKq>('admin.nhatKy', loc);
      if (!daNapHd) { kq.cacHanhDong.forEach((x) => chonHd.append(h('option', { value: x }, x))); daNapHd = true; }
      xoaHet(danhSach);
      xoaHet(phanTrang);
      danhSach.append(h('p', { class: 'phu nho' }, `${kq.tong} dòng, mới nhất ở trên`));
      kq.dong.forEach((d) => danhSach.append(h('div', { class: 'card nhat-ky' },
        h('div', { class: 'hang' }, h('span', { class: 'nhan' }, d.hanhDong), h('span', { class: 'phu nho' }, gio(d.thoiGian))),
        h('div', { class: 'phu nho' }, d.email),
        d.doiTuong ? h('div', { class: 'nho' }, d.doiTuong) : null,
        d.chiTiet ? h('div', { class: 'phu nho dong-dai' }, d.chiTiet) : null)));
      const soTrang = Math.max(1, Math.ceil(kq.tong / kq.coTrang));
      phanTrang.append(
        h('button', { class: 'nut nut-phu', disabled: kq.trang <= 1, onclick: () => { loc.trang--; void tai(); } }, '← Mới hơn'),
        h('span', { class: 'phu' }, `Trang ${kq.trang}/${soTrang}`),
        h('button', { class: 'nut nut-phu', disabled: kq.trang >= soTrang, onclick: () => { loc.trang++; void tai(); } }, 'Cũ hơn →'));
    } catch (e) {
      xoaHet(danhSach);
      danhSach.append(h('p', { class: 'loi' }, (e as Error).message));
    }
  };

  noi.append(h('div', { class: 'card' }, h('h3', {}, 'Lọc nhật ký'), chonHd, email, tuKhoa,
    h('button', { class: 'nut', onclick: () => { Object.assign(loc, { hanhDong: chonHd.value, email: email.value, tuKhoa: tuKhoa.value, trang: 1 }); void tai(); } }, 'Lọc')), danhSach, phanTrang);
  await tai();
}

export async function veSaoLuu(noi: HTMLElement, laChu: boolean): Promise<void> {
  noi.append(khungCho(1));
  let kq: SaoLuuKq;
  try {
    kq = await goi<SaoLuuKq>('admin.dsSaoLuu');
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(noi);
  noi.append(h('div', { class: 'card' },
    h('h3', {}, 'Sao lưu Google Sheet'),
    h('p', { class: 'phu nho' }, `Mỗi Chủ nhật 3 giờ sáng hệ thống tự sao chép cả Sheet vào thư mục "${kq.thuMuc}" trong Google Drive của bạn, giữ ${kq.soBanToiDa} bản gần nhất (bản cũ hơn vào thùng rác Drive). Cần đã chạy hàm datTrigger một lần.`),
    laChu ? h('button', { class: 'nut', onclick: async (ev: Event) => {
      const nut = ev.currentTarget as HTMLButtonElement;
      nut.disabled = true;
      try { const r = await goi<{ ten: string }>('admin.saoLuuNgay'); thongBao(`Đã sao lưu: ${r.ten}`); xoaHet(noi); await veSaoLuu(noi, laChu); } catch (e) { baoLoi(e); nut.disabled = false; }
    } }, 'Sao lưu ngay') : null,
    h('a', { class: 'nut nut-phu', href: kq.url, target: '_blank', rel: 'noopener noreferrer' }, 'Mở thư mục sao lưu trong Drive')));
  noi.append(h('h2', {}, `Các bản sao lưu (${kq.ban.length})`));
  if (!kq.ban.length) noi.append(h('p', { class: 'loi' }, 'Chưa có bản sao lưu nào. Bấm "Sao lưu ngay" và chạy datTrigger để có sao lưu tự động.'));
  kq.ban.forEach((b) => noi.append(h('div', { class: 'card hang' },
    h('div', {}, h('div', { class: 'mon-ten' }, b.ten), h('div', { class: 'phu nho' }, gio(b.ngay))),
    h('a', { class: 'nut nut-phu nho', href: b.url, target: '_blank', rel: 'noopener noreferrer' }, 'Mở'))));
}
