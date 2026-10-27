import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import { dinhDangNgay } from '../gio';
import type { NhomHienTai, ThanhVienDs, ThongBaoQuanTri } from '../types';

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

// Soạn và gửi thông báo cho cả lớp, một nhóm hoặc từng người. Thông báo hiện ở Sự kiện, mục Thông báo.
export async function veThongBaoQuanTri(noi: HTMLElement): Promise<void> {
  noi.append(h('p', { class: 'phu' }, 'Đang tải...'));
  let thanhVien: ThanhVienDs[] = [];
  let nhoms: { maNhom: string; tenNhom: string }[] = [];
  let daGui: ThongBaoQuanTri[] = [];
  try {
    const dsNhom = goi<NhomHienTai>('admin.nhomHienTai').catch(() => null); // chưa chia nhóm thì chỉ gửi được cho cả lớp hoặc từng người
    [thanhVien, daGui] = await Promise.all([goi<ThanhVienDs[]>('admin.dsThanhVien'), goi<ThongBaoQuanTri[]>('admin.dsThongBao')]);
    const nh = await dsNhom;
    nhoms = nh ? nh.nhoms.map((n) => ({ maNhom: n.maNhom as string, tenNhom: n.tenNhom })) : [];
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(noi);

  const hoatDong = thanhVien.filter((t) => t.trangThai === 'active' && t.vaiTro !== 'owner');
  const loai = h('select', { class: 'o-chon o-day' },
    h('option', { value: 'all' }, 'Cả lớp'),
    ...(nhoms.length ? [h('option', { value: 'nhom' }, 'Một nhóm')] : []),
    h('option', { value: 'nguoi' }, 'Từng người')) as HTMLSelectElement;
  const chonNhom = h('select', { class: 'o-chon o-day' }, ...nhoms.map((n) => h('option', { value: n.maNhom }, n.tenNhom))) as HTMLSelectElement;
  const tim = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Tìm người nhận' }) as HTMLInputElement;
  const daChon = new Set<string>();
  const dsNguoi = h('div', { class: 'ds-chon-nguoi' });
  const demChon = h('p', { class: 'phu nho' });
  const veNguoi = (): void => {
    xoaHet(dsNguoi);
    const q = tim.value.trim().toLowerCase();
    hoatDong.filter((t) => !q || t.hoTen.toLowerCase().includes(q) || t.email.includes(q)).forEach((t) => {
      const o = h('input', { type: 'checkbox', checked: daChon.has(t.email) }) as HTMLInputElement;
      o.addEventListener('change', () => {
        if (o.checked) daChon.add(t.email); else daChon.delete(t.email);
        demChon.textContent = `Đã chọn ${daChon.size} người`;
      });
      dsNguoi.append(h('label', { class: 'dong-chon' }, o, h('span', {}, t.hoTen || t.email)));
    });
    demChon.textContent = `Đã chọn ${daChon.size} người`;
  };
  tim.addEventListener('input', veNguoi);
  veNguoi();
  const vungNhom = h('div', {}, h('label', { class: 'nhan-o' }, 'Nhóm nhận', chonNhom));
  const vungNguoi = h('div', {}, h('label', { class: 'nhan-o' }, 'Người nhận', tim), dsNguoi, demChon);
  const hienDoiTuong = (): void => {
    vungNhom.hidden = loai.value !== 'nhom';
    vungNguoi.hidden = loai.value !== 'nguoi';
  };
  loai.addEventListener('change', hienDoiTuong);
  hienDoiTuong();

  const tieuDe = h('input', { class: 'o-nhap', type: 'text', maxlength: 100, placeholder: 'Ví dụ: Họp lớp tối thứ Sáu' }) as HTMLInputElement;
  const noiDung = h('textarea', { class: 'o-nhap', rows: 5, maxlength: 1500, placeholder: 'Nội dung thông báo' }) as HTMLTextAreaElement;
  const nutGui = h('button', { class: 'nut', type: 'button' }, 'Gửi thông báo') as HTMLButtonElement;
  nutGui.addEventListener('click', async () => {
    if (loai.value === 'all' && !confirm('Gửi thông báo này cho cả lớp?')) return;
    nutGui.disabled = true;
    try {
      await goi('admin.guiThongBao', { tieuDe: tieuDe.value, noiDung: noiDung.value, loai: loai.value, maNhom: chonNhom.value, dsEmail: [...daChon] });
      thongBao('Đã gửi thông báo');
      xoaHet(noi);
      await veThongBaoQuanTri(noi);
    } catch (e) {
      baoLoi(e);
      nutGui.disabled = false;
    }
  });

  noi.append(
    h('div', { class: 'card' },
      h('span', { class: 'nhan-muc' }, 'Soạn thông báo'),
      h('label', { class: 'nhan-o' }, 'Gửi cho', loai), vungNhom, vungNguoi,
      h('label', { class: 'nhan-o' }, 'Tiêu đề', tieuDe),
      h('label', { class: 'nhan-o' }, 'Nội dung', noiDung),
      h('div', { class: 'hang-nut' }, nutGui),
      h('p', { class: 'phu nho' }, 'Thành viên thấy ở trang Sự kiện, mục Thông báo, kèm chấm báo có tin mới. Người nhận chỉ thấy thông báo của mình, không thấy ai khác nhận.')),
    h('h2', {}, 'Đã gửi'),
    ...(daGui.length ? daGui.map((t) => h('div', { class: 'card' },
      h('div', { class: 'hang' }, h('div', { class: 'mon-ten' }, t.tieuDe), h('span', { class: 'nhan nhan-xam' }, t.nguoiNhan)),
      h('p', { class: 'noi-dung-tb' }, t.noiDung),
      h('div', { class: 'hang' }, h('span', { class: 'phu nho' }, dinhDangNgay(t.ngay)),
        h('button', { class: 'nut nut-nguy nho', type: 'button', onclick: async () => {
          if (!confirm('Xóa thông báo này? Mọi người sẽ không còn thấy.')) return;
          try { await goi('admin.xoaThongBao', { id: t.id }); xoaHet(noi); await veThongBaoQuanTri(noi); } catch (e) { baoLoi(e); }
        } }, 'Xóa')))) : [h('p', { class: 'phu' }, 'Chưa gửi thông báo nào.')]));
}
