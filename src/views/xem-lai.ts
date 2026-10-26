import { goi } from '../api';
import { h, xoaHet } from '../dom';
import { dungDongHo } from '../gio';
import { nutBaoSai } from '../cap';
import { theXemLai } from './tao-de';
import type { CauKho, KetQuaXemLai } from '../types';

function theCauKho(c: CauKho, i: number): HTMLElement {
  return h('div', { class: 'card cau-xem' },
    h('div', { class: 'hang' }, h('span', { class: 'phu nho' }, `#${i + 1} · ${c.tenMon}${c.maChuong ? ` · ${c.maChuong}` : ''}${c.trangNguon ? ` · ${c.trangNguon}` : ''}`),
      h('span', { class: 'nhan nhan-loi' }, `${c.tyLeSai}% làm sai`)),
    h('p', { class: 'noi-dung-cau' }, c.noiDung),
    h('ul', { class: 'ds-dap-an' }, ...c.dapAn.map((d) => h('li', { class: d.k === c.dung ? 'dung' : '' }, `${d.k}. ${d.text}${d.k === c.dung ? ' ✓' : ''}`))),
    c.giaiThich ? h('p', { class: 'phu nho' }, `Giải thích: ${c.giaiThich}`) : null,
    h('p', { class: 'phu nho' }, `${c.soLuot} lượt làm. Cùng thảo luận trong nhóm nhé.`),
    nutBaoSai(c.id));
}

export async function veXemLai(goc: HTMLElement, soTuanYeuCau: number | null): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, '← Sự kiện'), h('h1', {}, 'Xem lại'), h('p', { class: 'phu' }, 'Đang tải...'));
  let kq: KetQuaXemLai;
  try {
    kq = await goi<KetQuaXemLai>('xemLai', soTuanYeuCau ? { soTuan: soTuanYeuCau } : {});
  } catch (e) {
    xoaHet(goc);
    goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, '← Sự kiện'), h('h1', {}, 'Xem lại'), h('div', { class: 'card' }, h('p', { class: 'phu' }, (e as Error).message)));
    return;
  }
  xoaHet(goc);
  goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, '← Sự kiện'), h('h1', {}, 'Xem lại'));
  if (kq.cacTuan.length > 1) {
    goc.append(h('div', { class: 'tabs' }, ...kq.cacTuan.map((t) => h('a', { class: t === kq.soTuan ? 'tab tab-dang' : 'tab', href: `#/su-kien/xem-lai/${t}` }, `Tuần ${t}`))));
  }
  if (!kq.soTuan) {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Chưa có tuần nào đóng cửa mà bạn đã thi. Đáp án mở sau khi phòng thi đóng.')));
    return;
  }
  const t = kq.soTuan;
  if (kq.cauHoi.length) {
    goc.append(
      h('div', { class: 'card card-giua' },
        h('div', { class: 'phu nho' }, `Tuần ${t}`),
        h('div', { class: 'diem-lon' }, String(kq.diem ?? 0)),
        h('p', {}, `Đúng ${kq.soDung}/${kq.soCau} câu`)),
      h('h2', {}, 'Bài làm của bạn'),
      ...kq.cauHoi.map(theXemLai));
  } else {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, `Bạn không có bài thi ở tuần ${t}.`)));
  }

  const vungKho = h('div', {}, h('p', { class: 'phu' }, 'Đang tải câu khó nhất...'));
  goc.append(h('h2', {}, `Câu khó nhất tuần ${t}`), vungKho);
  try {
    const kho = await goi<{ tat?: boolean; cauHoi: CauKho[] }>('cauKhoNhat', { soTuan: t });
    xoaHet(vungKho);
    if (kho.tat || !kho.cauHoi.length) vungKho.append(h('p', { class: 'phu' }, 'Chưa có câu khó nhất cho tuần này.'));
    else kho.cauHoi.forEach((c, i) => vungKho.append(theCauKho(c, i)));
  } catch (e) {
    xoaHet(vungKho);
    vungKho.append(h('p', { class: 'loi' }, (e as Error).message));
  }
}
