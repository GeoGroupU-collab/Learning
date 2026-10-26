import { docCache, ghiCache, goi, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import { chayDinhKy, dungDongHo } from '../gio';
import type { ChiTietNhom, KetQuaXepHang, Me, ThanhVienNhom } from '../types';

const NHAN_TT: Record<string, string> = {
  mien: 'Được miễn',
  da_thi: 'Đã thi',
  dang_thi: 'Đang thi',
  da_nop_cau: 'Đã nộp câu hỏi',
  chua_nop_cau: 'Chưa nộp câu hỏi',
};

function dongThanhVien(t: ThanhVienNhom, me: Me): HTMLElement {
  const nhan = t.tt === 'da_thi' && t.diem != null ? `Đã thi · ${t.diem.toFixed(1)} điểm` : (NHAN_TT[t.tt ?? ''] ?? '');
  return h('li', {},
    h('span', {}, t.hoTen || t.email, t.email === me.email ? h('span', { class: 'nhan' }, 'Bạn') : null),
    h('span', { class: t.tt === 'da_thi' ? 'tt-tot' : 'phu nho' }, nhan));
}

function veDiemNhom(vung: HTMLElement, xh: KetQuaXepHang | null): void {
  xoaHet(vung);
  vung.append(h('h3', {}, 'Điểm nhóm'));
  const t = xh?.tuanHienTai;
  const toi = xh?.nhomToi;
  const n = t?.nhom.find((x) => x.maNhom === toi);
  if (!t || !n) {
    vung.append(h('p', { class: 'phu' }, 'Điểm tuần và hạng nhóm sẽ hiện khi có lượt thi đầu tiên.'));
    return;
  }
  const lk = xh?.luyKe.find((x) => x.maNhom === toi);
  vung.append(
    h('div', { class: 'so-lieu' },
      h('div', {}, h('div', { class: 'phu nho' }, `Tuần ${t.soTuan}${t.daChot ? '' : ' (tạm tính)'}`), h('div', { class: 'diem-vua' }, n.diem.toFixed(1))),
      h('div', {}, h('div', { class: 'phu nho' }, 'Hạng'), h('div', { class: 'diem-vua' }, `${n.hang}/${t.nhom.length}`)),
      h('div', {}, h('div', { class: 'phu nho' }, 'Lũy kế'), h('div', { class: 'diem-vua' }, lk ? lk.diem.toFixed(1) : '—'))),
    h('p', { class: 'phu nho' }, `${n.soThamGia ?? 0}/${n.soTinh ?? 0} thành viên đã thi tuần này.`));
}

export async function veNhom(goc: HTMLElement, me: Me): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('h1', {}, 'Nhóm'), khungCho(2));
  let nhom: ChiTietNhom | null = docCache<ChiTietNhom>('nhomCuaToi');
  const tuBanLuu = nhom !== null;
  try {
    if (!nhom) nhom = await goi<ChiTietNhom | null>('nhomCuaToi');
    if (nhom) ghiCache('nhomCuaToi', {}, nhom);
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
  const soTv = h('p', { class: 'phu' }, '');
  const veDs = (nh: ChiTietNhom): void => {
    xoaHet(ds);
    nh.thanhVien.forEach((t) => ds.append(dongThanhVien(t, me)));
    soTv.textContent = `${nh.thanhVien.length} thành viên${nh.tuan ? ` · Tuần ${nh.tuan.soTuan}` : ''}`;
  };
  veDs(n);

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

  const vungDiem = h('div', { class: 'card' }, h('h3', {}, 'Điểm nhóm'), h('p', { class: 'phu' }, 'Đang tải...'));

  goc.append(
    h('div', { class: 'card' }, h('div', { class: 'hang' }, tieuDe, nutDoiTen), soTv, ds),
    vungDiem,
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
    )
  );

  const taiDiem = async (): Promise<void> => {
    try {
      const kq = await goi<KetQuaXepHang>('xepHang');
      ghiCache('xepHang', {}, kq);
      veDiemNhom(vungDiem, kq);
    } catch {
      if (!vungDiem.querySelector('.so-lieu')) veDiemNhom(vungDiem, null);
    }
  };
  const diemCu = docCache<KetQuaXepHang>('xepHang');
  if (diemCu) veDiemNhom(vungDiem, diemCu);
  const lamMoiNgay = (): void => {
    void goi<ChiTietNhom | null>('nhomCuaToi').then((nh) => { if (nh) { ghiCache('nhomCuaToi', {}, nh); veDs(nh); } }).catch(() => undefined);
  };
  if (tuBanLuu) lamMoiNgay();
  await taiDiem();
  // Làm mới gần thời gian thật, chỉ khi tab đang hiển thị.
  chayDinhKy(() => {
    void goi<ChiTietNhom | null>('nhomCuaToi').then((nh) => { if (nh) veDs(nh); }).catch(() => undefined);
    void taiDiem();
  }, 15000);
}
