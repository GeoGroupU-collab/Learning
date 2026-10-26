import { h, xoaHet } from '../dom';
import type { Manifest, MonHoc } from '../types';

let boNho: Manifest | null = null;

export async function layManifest(): Promise<Manifest> {
  if (boNho) return boNho;
  try {
    const res = await fetch(new URL('bai-hoc/manifest.json', document.baseURI).href, { cache: 'no-cache' });
    boNho = res.ok ? ((await res.json()) as Manifest) : { hocKy: [] };
  } catch {
    boNho = { hocKy: [] };
  }
  return boNho;
}

export function laMoi(capNhat: string): boolean {
  const t = Date.parse(capNhat);
  return !isNaN(t) && Date.now() - t < 7 * 86400000;
}

function theMon(hocKy: string, m: MonHoc): HTMLElement {
  const moi = m.baiHoc.some((b) => laMoi(b.capNhat));
  return h(
    'a',
    { class: 'card card-mon', href: `#/bai-hoc/${hocKy}/${m.ma}`, style: `--mau:${m.mau || '#4cc9f0'}` },
    h('div', { class: 'mon-ten' }, m.ten),
    h('div', { class: 'mon-phu' }, `${m.baiHoc.length} bài học`),
    moi ? h('span', { class: 'nhan-moi' }, 'Mới cập nhật') : null
  );
}

export async function veDanhSachMon(goc: HTMLElement, maHocKyDangMo: string | null): Promise<void> {
  xoaHet(goc);
  goc.append(h('h1', {}, 'Bài học'));
  const mf = await layManifest();
  const hk = mf.hocKy.find((x) => x.ma === maHocKyDangMo) ?? mf.hocKy[0];
  if (!hk || hk.mon.length === 0) {
    goc.append(h('p', { class: 'phu' }, 'Chưa có bài học nào được đăng.'));
    return;
  }
  const luoi = h('div', { class: 'luoi' });
  hk.mon.forEach((m) => luoi.append(theMon(hk.ma, m)));
  goc.append(luoi);
}

export async function veDanhSachBai(goc: HTMLElement, maHocKy: string, maMon: string): Promise<void> {
  xoaHet(goc);
  const mf = await layManifest();
  const mon = mf.hocKy.find((x) => x.ma === maHocKy)?.mon.find((m) => m.ma === maMon);
  goc.append(h('a', { class: 'quay-lai', href: '#/bai-hoc' }, '← Các môn'));
  if (!mon) {
    goc.append(h('p', { class: 'phu' }, 'Không tìm thấy môn này.'));
    return;
  }
  goc.append(h('h1', {}, mon.ten));
  if (mon.baiHoc.length === 0) goc.append(h('p', { class: 'phu' }, 'Môn này chưa có bài học.'));
  mon.baiHoc.forEach((b) =>
    goc.append(
      h(
        'a',
        { class: 'card card-mon', style: `--mau:${mon.mau || '#4cc9f0'}`, href: `#/doc/${maHocKy}/${maMon}/${encodeURIComponent(b.file)}` },
        h('div', { class: 'mon-ten' }, b.ten),
        laMoi(b.capNhat) ? h('span', { class: 'nhan-moi' }, 'Mới cập nhật') : null
      )
    )
  );
}

// Mở bài trong cùng tab, có nút quay lại. Bài học tự dùng localStorage với khóa riêng nên chạy trong iframe cùng nguồn.
export function veBaiHoc(goc: HTMLElement, maHocKy: string, maMon: string, file: string): void {
  xoaHet(goc);
  const duongDan = `bai-hoc/${encodeURIComponent(maHocKy)}/${encodeURIComponent(maMon)}/${encodeURIComponent(file)}`;
  goc.append(
    h('div', { class: 'thanh-doc' }, h('a', { class: 'quay-lai', href: `#/bai-hoc/${maHocKy}/${maMon}` }, '← Quay lại')),
    h('iframe', { class: 'khung-bai', src: new URL(duongDan, document.baseURI).href, title: 'Bài học' })
  );
}
