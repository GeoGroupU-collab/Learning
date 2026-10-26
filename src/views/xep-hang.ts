import { goiNhanh } from '../api';
import { h, khungCho, xoaHet } from '../dom';
import { chayDinhKy, dungDongHo } from '../gio';
import { theCap } from '../cap';
import type { KetQuaXepHang, KetQuaXepHangCaNhan, NhomXepHang } from '../types';

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

function veCaNhan(vung: HTMLElement, kq: KetQuaXepHangCaNhan): void {
  xoaHet(vung);
  vung.append(theCap(kq.toi.cap, kq.toi.hang ? `Cấp của tôi · hạng ${kq.toi.hang}` : 'Cấp của tôi'));
  if (kq.vinhDanh) {
    vung.append(h('div', { class: 'card vinh-danh' },
      h('div', { class: 'phu nho' }, `Danh hiệu tuần ${kq.vinhDanh.soTuan}`),
      ...kq.vinhDanh.nguoi.map((n) => h('div', {}, h('div', { class: 'mon-ten' }, `★ ${n.hoTen}`), h('div', { class: 'phu nho' }, `${n.danhHieu} · ${n.diem} điểm`)))));
  }
  if (kq.toi.danhHieu.length) {
    vung.append(h('div', { class: 'card' }, h('h3', {}, 'Danh hiệu của tôi'),
      ...kq.toi.danhHieu.map((d) => h('div', { class: 'nhan' }, `${d.danhHieu} (${d.diem} điểm)`))));
  }
  const t = h('table', { class: 'bang' }, h('thead', {}, h('tr', {}, h('th', {}, 'Hạng'), h('th', {}, 'Tên'), h('th', {}, 'Cấp'), h('th', {}, 'Điểm'))));
  const tb = h('tbody', {});
  kq.bang.forEach((x) =>
    tb.append(h('tr', { class: x.laToi ? 'hang-toi' : '' },
      h('td', {}, String(x.hang)),
      h('td', {}, x.hoTen + (x.soDanhHieu ? ` ★${x.soDanhHieu}` : '')),
      h('td', {}, `${x.tenCapLon} · Lv ${x.level}`),
      h('td', {}, String(x.tong)))));
  t.append(tb);
  vung.append(h('div', { class: 'card' }, h('h3', {}, 'Bảng xếp hạng cá nhân'), h('div', { class: 'cuon-ngang' }, t),
    h('p', { class: 'phu nho' }, 'Điểm cấp bậc: luyện tập ngoài sự kiện và thưởng nhóm cuối tuần. ★ là số danh hiệu cá nhân cao điểm nhất tuần.')));
}

export async function veXepHang(goc: HTMLElement, tab = 'nhom'): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('h1', {}, 'Xếp hạng'),
    h('div', { class: 'tabs' },
      h('a', { class: tab === 'nhom' ? 'tab tab-dang' : 'tab', href: '#/xep-hang' }, 'Nhóm'),
      h('a', { class: tab === 'ca-nhan' ? 'tab tab-dang' : 'tab', href: '#/xep-hang/ca-nhan' }, 'Cá nhân')));
  const vung = h('div', {}, khungCho(2));
  goc.append(vung);
  if (tab === 'ca-nhan') {
    await goiNhanh<KetQuaXepHangCaNhan>('xepHangCaNhan', {}, (kq) => veCaNhan(vung, kq));
    chayDinhKy(() => { void goiNhanh<KetQuaXepHangCaNhan>('xepHangCaNhan', {}, (kq, tuCache) => { if (!tuCache) veCaNhan(vung, kq); }).catch(() => undefined); }, 15000);
    return;
  }
  await goiNhanh<KetQuaXepHang>('xepHang', {}, (kq) => ve(vung, kq));
  chayDinhKy(() => { void goiNhanh<KetQuaXepHang>('xepHang', {}, (kq, tuCache) => { if (!tuCache) ve(vung, kq); }).catch(() => undefined); }, 15000);
}
