// Web quản trị riêng của lớp trưởng. Tách khỏi web lớp để thành viên không phải tải mã quản trị,
// và vì chỉ chủ dùng nên không cần phục vụ vai trò nào khác.
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/vietnamese-500.css';
import '../style.css';
import { icon, dauHieu } from '../icon';
import { CONFIG, DEV_MOCK, chuaCauHinh } from '../config';
import { goi, LoiApi, xoaCache } from '../api';
import { daDangNhap, dangXuat, layPhien, luuPhien, veNutDangNhap } from '../auth';
import { datHuyHieuDuyet, h, xoaHet } from '../dom';
import { veQuanTri } from '../views/quan-tri';
import type { Me } from '../types';

const goc = document.getElementById('app') as HTMLElement;
let me: Me | null = null;
let vungNoiDung: HTMLElement;

const MAC_DINH = '#/quan-tri/thanh-vien';

function manHinhDon(...con: (Node | string)[]): void {
  xoaHet(goc);
  goc.append(h('main', { class: 'man-giua' }, h('div', { class: 'card card-giua' }, ...con)));
}

function manHinhDangNhap(): void {
  const khungNut = h('div', { class: 'khung-nut' });
  xoaHet(goc);
  goc.append(h('main', { class: 'man-giua' }, h('div', { class: 'card card-giua' },
    h('span', { class: 'logo' }, dauHieu(32) as unknown as HTMLElement, h('span', {}, `${CONFIG.TEN_WEB} · Quản trị`)),
    h('h1', {}, 'Đăng nhập quản trị'),
    h('p', { class: 'phu' }, 'Trang này chỉ dành cho lớp trưởng. Dùng tài khoản Google của lớp trưởng.'),
    khungNut,
    h('a', { class: 'phu nho', href: '../' }, 'Về web lớp'))));
  if (DEV_MOCK) {
    khungNut.append(h('button', { class: 'nut', onclick: () => void khoiDong() }, 'Đăng nhập thử (chế độ phát triển)'));
    return;
  }
  veNutDangNhap(khungNut, () => void doiLayPhien()).catch((e: Error) => khungNut.append(h('p', { class: 'loi' }, e.message)));
}

async function doiLayPhien(): Promise<void> {
  manHinhDon(h('p', { class: 'phu' }, 'Đang đăng nhập...'));
  try {
    xoaCache();
    const r = await goi<{ phien: string }>('dangNhap');
    luuPhien(r.phien);
  } catch (e) {
    return manHinhLoi((e as Error).message);
  }
  await khoiDong();
}

function manHinhLoi(thongDiep: string): void {
  manHinhDon(
    h('h1', {}, 'Chưa vào được'),
    h('p', {}, thongDiep),
    h('div', { class: 'hang-nut' },
      h('button', { class: 'nut nut-phu', onclick: () => void thoat() }, 'Đăng nhập tài khoản khác'),
      h('a', { class: 'nut nut-phu', href: '../' }, 'Về web lớp'))
  );
}

async function khoiDong(): Promise<void> {
  manHinhDon(h('p', { class: 'phu' }, 'Đang kiểm tra quyền...'));
  try {
    me = await goi<Me>('me');
  } catch (e) {
    const loi = e as LoiApi;
    if (loi.ma === 'token_expired' || loi.ma === 'unauthorized' || loi.ma === 'phien_het_han') return manHinhDangNhap();
    return manHinhLoi(loi.message);
  }
  if (me.vaiTro !== 'owner') return manHinhLoi('Trang này chỉ dành cho lớp trưởng. Tài khoản này là thành viên bình thường.');
  veKhung();
  if (!location.hash.startsWith('#/quan-tri/')) location.hash = MAC_DINH;
  else void dinhTuyen();
  void goi<{ choDuyet: number }>('admin.tongQuan').then((t) => datHuyHieuDuyet(t.choDuyet)).catch(() => undefined);
}

function veKhung(): void {
  xoaHet(goc);
  vungNoiDung = h('main', { class: 'noi-dung noi-dung-rong' });
  goc.append(
    h('header', { class: 'dau-trang' },
      h('span', { class: 'logo' }, dauHieu(30) as unknown as HTMLElement, h('span', {}, `${CONFIG.TEN_WEB} · Quản trị`)),
      h('div', { class: 'dau-phai' },
        h('a', { class: 'nut-dau', href: '../' }, icon('nha', 16) as unknown as HTMLElement, h('span', {}, 'Về web lớp')),
        h('button', { class: 'nut-dau', type: 'button', onclick: () => void thoat() }, 'Đăng xuất'))),
    vungNoiDung
  );
}

async function dinhTuyen(): Promise<void> {
  if (!me || me.vaiTro !== 'owner') return;
  const [, , tab = 'thanh-vien'] = (location.hash || MAC_DINH).split('/');
  window.scrollTo(0, 0);
  try {
    await veQuanTri(vungNoiDung, me, tab);
  } catch (e) {
    xoaHet(vungNoiDung);
    vungNoiDung.append(h('p', { class: 'loi' }, (e as Error).message));
  }
}

async function thoat(): Promise<void> {
  const coPhien = layPhien() !== null;
  try {
    if (coPhien) await goi('dangXuat', { phien: layPhien() });
  } catch {
    /* máy chủ không trả lời vẫn đăng xuất ở máy này */
  }
  dangXuat();
  xoaCache();
  me = null;
  manHinhDangNhap();
}

window.addEventListener('hashchange', () => void dinhTuyen());
window.addEventListener('phien-het-han', () => {
  me = null;
  manHinhDangNhap();
});

if (!DEV_MOCK && chuaCauHinh()) manHinhDon(h('h1', {}, 'Chưa cấu hình'), h('p', {}, 'Cần điền GOOGLE_CLIENT_ID và API_URL trong src/config.ts.'));
else if (DEV_MOCK || daDangNhap()) void khoiDong();
else manHinhDangNhap();
