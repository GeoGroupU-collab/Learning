import { goi } from '../api';
import { h, xoaHet } from '../dom';
import { chayDinhKy, dungDongHo } from '../gio';
import type { KetQuaXepHang, NhomXepHang } from '../types';

function bang(ds: NhomXepHang[], nhomToi: string | null, coThamGia: boolean): HTMLElement {
  const t = h('table', { class: 'bang' }, h('thead', {}, h('tr', {}, h('th', {}, 'Hạng'), h('th', {}, 'Nhóm'), h('th', {}, 'Điểm'), coThamGia ? h('th', {}, 'Thi') : null)));
  const tb = h('tbody', {});
  ds.forEach((n) =>
    tb.append(h('tr', { class: n.maNhom === nhomToi ? 'hang-toi' : '' },
      h('td', {}, String(n.hang)), h('td', {}, n.tenNhom + (n.maNhom === nhomToi ? ' (nhóm bạn)' : '')), h('td', {}, n.diem.toFixed(1)),
      coThamGia ? h('td', {}, n.soTinh !== undefined ? `${n.soThamGia ?? 0}/${n.soTinh}` : '') : null)));
  t.append(tb);
  return h('div', { class: 'cuon-ngang' }, t);
}

function ve(vung: HTMLElement, kq: KetQuaXepHang): void {
  xoaHet(vung);
  if (kq.vinhDanh) {
    vung.append(h('div', { class: 'card vinh-danh' },
      h('div', { class: 'phu nho' }, `Nhóm vinh danh tuần ${kq.vinhDanh.soTuan}`),
      h('div', { class: 'mon-ten' }, `★ ${kq.vinhDanh.nhom.map((n) => n.tenNhom).join(', ')}`),
      h('div', { class: 'phu nho' }, `${kq.vinhDanh.nhom[0].diem.toFixed(1)} điểm`)));
  }
  const t = kq.tuanHienTai;
  if (t) {
    vung.append(h('div', { class: 'card' },
      h('div', { class: 'hang' }, h('h3', {}, `Tuần ${t.soTuan}`), h('span', { class: 'nhan' }, t.daChot ? 'Đã chốt' : 'Tạm tính')),
      t.nhom.length ? bang(t.nhom, kq.nhomToi, true) : h('p', { class: 'phu' }, 'Chưa có nhóm nào.'),
      t.daChot ? null : h('p', { class: 'phu nho' }, 'Điểm tạm tính theo các bài đã nộp. Người chưa thi tính 0 điểm. Bảng tự cập nhật.')));
  } else {
    vung.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Chưa có lịch sự kiện.')));
  }
  if (kq.luyKe.length) vung.append(h('div', { class: 'card' }, h('h3', {}, 'Lũy kế học kỳ'), bang(kq.luyKe, kq.nhomToi, false)));
  const daChot = kq.cacTuan.filter((c) => !t || c.soTuan !== t.soTuan || c.daChot);
  if (daChot.length) {
    vung.append(h('h2', {}, 'Các tuần đã chốt'));
    daChot.slice().reverse().forEach((c) =>
      vung.append(h('details', { class: 'card' }, h('summary', {}, `Tuần ${c.soTuan}`), bang(c.nhom, kq.nhomToi, true))));
  }
}

export async function veXepHang(goc: HTMLElement): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('h1', {}, 'Xếp hạng'));
  const vung = h('div', {}, h('p', { class: 'phu' }, 'Đang tải...'));
  goc.append(vung);
  ve(vung, await goi<KetQuaXepHang>('xepHang'));
  chayDinhKy(() => { void goi<KetQuaXepHang>('xepHang').then((kq) => ve(vung, kq)).catch(() => undefined); }, 15000);
}
