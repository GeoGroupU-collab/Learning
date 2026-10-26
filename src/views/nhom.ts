import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import type { ChiTietNhom, Me } from '../types';

export async function veNhom(goc: HTMLElement, me: Me): Promise<void> {
  xoaHet(goc);
  goc.append(h('h1', {}, 'Nhóm'), h('p', { class: 'phu' }, 'Đang tải...'));
  let nhom: ChiTietNhom | null;
  try {
    nhom = await goi<ChiTietNhom | null>('nhomCuaToi');
  } catch (e) {
    xoaHet(goc);
    goc.append(h('h1', {}, 'Nhóm'), h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(goc);
  goc.append(h('h1', {}, 'Nhóm'));
  if (!nhom) {
    goc.append(h('div', { class: 'card' }, h('p', {}, 'Bạn chưa được xếp vào nhóm nào. Lớp trưởng sẽ chia nhóm sau khi đóng Form đăng ký.')));
    return;
  }
  const n = nhom;

  const tieuDe = h('h2', { class: 'ten-nhom' }, n.tenNhom);
  const nutDoiTen = h(
    'button',
    {
      class: 'nut nut-phu',
      onclick: async () => {
        const moi = prompt('Tên nhóm mới (2 đến 40 ký tự). Mỗi tuần chỉ đổi được một lần:', n.tenNhom);
        if (!moi || moi.trim() === n.tenNhom) return;
        try {
          const r = await goi<{ tenNhom: string }>('doiTenNhom', { tenNhom: moi });
          tieuDe.textContent = r.tenNhom;
          thongBao('Đã đổi tên nhóm');
        } catch (e) {
          thongBao((e as LoiApi).message, 'loi');
        }
      },
    },
    'Đổi tên'
  );

  const ds = h('ul', { class: 'ds-thanh-vien' });
  n.thanhVien.forEach((t) =>
    ds.append(h('li', {}, h('span', {}, t.hoTen || t.email), t.email === me.email ? h('span', { class: 'nhan' }, 'Bạn') : null))
  );

  const o = h('input', { type: 'url', class: 'o-nhap', placeholder: 'https://zalo.me/g/...', value: n.linkZalo, maxlength: 300 }) as HTMLInputElement;
  const khungLink = h('div', {});
  const veLink = (): void => {
    xoaHet(khungLink);
    khungLink.append(
      n.linkZalo
        ? h('a', { class: 'nut', href: n.linkZalo, target: '_blank', rel: 'noopener noreferrer' }, 'Mở nhóm Zalo')
        : h('p', { class: 'phu' }, 'Chưa có link nhóm Zalo.')
    );
  };
  veLink();

  goc.append(
    h('div', { class: 'card' }, h('div', { class: 'hang' }, tieuDe, nutDoiTen), h('p', { class: 'phu' }, `${n.thanhVien.length} thành viên`), ds),
    h(
      'div',
      { class: 'card' },
      h('h3', {}, 'Nhóm Zalo'),
      khungLink,
      h('label', { class: 'nhan-o' }, 'Dán hoặc sửa link nhóm Zalo (bắt đầu bằng https://)'),
      o,
      h(
        'button',
        {
          class: 'nut',
          onclick: async () => {
            try {
              const r = await goi<{ linkZalo: string }>('capNhatLinkZalo', { link: o.value.trim() });
              n.linkZalo = r.linkZalo;
              veLink();
              thongBao('Đã lưu link');
            } catch (e) {
              thongBao((e as LoiApi).message, 'loi');
            }
          },
        },
        'Lưu link'
      )
    ),
    h('div', { class: 'card' }, h('h3', {}, 'Điểm nhóm'), h('p', { class: 'phu' }, 'Điểm tuần và hạng nhóm sẽ hiện ở đây từ sự kiện đầu tiên.'))
  );
}
