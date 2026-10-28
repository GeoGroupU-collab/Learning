import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import { dinhDangNgay } from '../gio';
import type { ThanhVienDs } from '../types';

interface MoKhoa {
  cheDo: 'khoa' | 'het_tuan' | 'tat';
  den: number;
  emails: string[];
  conHieuLuc: boolean;
}

// Thẻ cho chủ mở khóa "Tự tạo đề luyện tập" (vốn chỉ mở khi đã nộp đủ câu hỏi của tuần): cho cả lớp trải nghiệm đến hết tuần,
// hoặc đến khi tắt, hoặc chỉ mở riêng cho một số người. Việc nộp câu hỏi không bị ảnh hưởng.
export async function veMoKhoa(vung: HTMLElement): Promise<void> {
  xoaHet(vung);
  let hienTai: MoKhoa;
  let thanhVien: ThanhVienDs[] = [];
  try {
    [hienTai, thanhVien] = await Promise.all([goi<MoKhoa>('admin.moKhoaLay'), goi<ThanhVienDs[]>('admin.dsThanhVien')]);
  } catch (e) {
    vung.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  const hoatDong = thanhVien.filter((t) => t.trangThai === 'active' && t.vaiTro !== 'owner');
  const chon = new Set(hienTai.emails);
  const lua: [MoKhoa['cheDo'], string, string][] = [
    ['khoa', 'Khóa như thường lệ', 'Phải nộp đủ câu hỏi của tuần mới được tự tạo đề.'],
    ['het_tuan', 'Mở cho cả lớp đến hết tuần này', 'Cho mọi người trải nghiệm trước. Hết Chủ nhật 23:59 tự khóa lại.'],
    ['tat', 'Mở cho cả lớp, đến khi tôi khóa lại', 'Không giới hạn thời gian.'],
  ];
  let cheDo = hienTai.cheDo;
  const nhomLua = h('div', { class: 'nhom-lua' }, ...lua.map(([k, ten, mo]) => {
    const o = h('input', { type: 'radio', name: 'che-do-mo-khoa', id: `mk-${k}`, checked: k === cheDo }) as HTMLInputElement;
    o.addEventListener('change', () => { if (o.checked) cheDo = k; });
    return h('label', { class: 'dong-chon', for: `mk-${k}` }, o, h('span', {}, h('b', {}, ten), h('br', {}), h('span', { class: 'phu nho' }, mo)));
  }));

  const tim = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Tìm người để mở khóa riêng' }) as HTMLInputElement;
  const ds = h('div', { class: 'ds-chon-nguoi' });
  const dem = h('p', { class: 'phu nho' });
  const ve = (): void => {
    xoaHet(ds);
    const q = tim.value.trim().toLowerCase();
    hoatDong.filter((t) => !q || t.hoTen.toLowerCase().includes(q) || t.email.includes(q)).forEach((t) => {
      const o = h('input', { type: 'checkbox', checked: chon.has(t.email) }) as HTMLInputElement;
      o.addEventListener('change', () => { if (o.checked) chon.add(t.email); else chon.delete(t.email); dem.textContent = `Đã mở khóa riêng cho ${chon.size} người`; });
      ds.append(h('label', { class: 'dong-chon' }, o, h('span', {}, t.hoTen || t.email)));
    });
    dem.textContent = `Đã mở khóa riêng cho ${chon.size} người`;
  };
  tim.addEventListener('input', ve);
  ve();

  const luu = h('button', { class: 'nut', type: 'button' }, 'Lưu') as HTMLButtonElement;
  luu.addEventListener('click', async () => {
    luu.disabled = true;
    try {
      await goi('admin.moKhoaLuu', { cheDo, emails: [...chon] });
      thongBao('Đã lưu');
      await veMoKhoa(vung);
    } catch (e) {
      thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
      luu.disabled = false;
    }
  });

  const tinhTrang = hienTai.cheDo === 'tat' ? 'Đang mở cho cả lớp, đến khi bạn khóa lại.'
    : hienTai.cheDo === 'het_tuan' && hienTai.conHieuLuc ? `Đang mở cho cả lớp, tự khóa lại sau ${dinhDangNgay(hienTai.den)}.`
    : hienTai.cheDo === 'het_tuan' ? 'Chế độ "đến hết tuần" đã hết hạn, đang khóa như thường lệ.'
    : 'Đang khóa như thường lệ.';
  vung.append(h('div', { class: 'card' },
    h('span', { class: 'nhan-muc' }, 'Khóa tự tạo đề luyện tập'),
    h('p', { class: hienTai.conHieuLuc ? 'tien-do tien-do-xong' : 'tien-do' }, tinhTrang),
    nhomLua,
    h('h4', {}, 'Mở khóa riêng cho từng người'),
    h('p', { class: 'phu nho' }, 'Người được tick luôn tạo đề được, dù cả lớp đang bị khóa. Bỏ tick là khóa lại như mọi người.'),
    tim, ds, dem,
    h('div', { class: 'hang-nut' }, luu),
    h('p', { class: 'phu nho' }, 'Nộp câu hỏi vẫn bình thường ở mọi chế độ. Bạn (chủ) không bị khóa.')));
}
