import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import type { Me, ThanhVienDs, KetQuaXemTruoc, NhomHienTai, NhomXemTruoc } from '../types';

const NHAN_VAI_TRO: Record<string, string> = { owner: 'Chủ', assistant: 'Trợ lý', member: 'Thành viên' };
const NHAN_TRANG_THAI: Record<string, string> = { active: 'Đang hoạt động', pending: 'Chờ duyệt', withdrawn: 'Đã rút', removed: 'Đã gỡ' };

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

export async function veQuanTri(goc: HTMLElement, me: Me, tab: string): Promise<void> {
  xoaHet(goc);
  const laChu = me.vaiTro === 'owner';
  goc.append(h('h1', {}, 'Quản trị'));
  const tabs = h('div', { class: 'tabs' });
  const cacTab: [string, string][] = laChu ? [['thanh-vien', 'Thành viên'], ['chia-nhom', 'Chia nhóm']] : [['thanh-vien', 'Thành viên']];
  cacTab.forEach(([k, ten]) => tabs.append(h('a', { class: k === tab ? 'tab tab-dang' : 'tab', href: `#/quan-tri/${k}` }, ten)));
  goc.append(tabs);
  const noiDung = h('div', {});
  goc.append(noiDung);
  if (tab === 'chia-nhom' && laChu) await veChiaNhom(noiDung);
  else await veThanhVien(noiDung, laChu);
}

async function veThanhVien(noi: HTMLElement, laChu: boolean): Promise<void> {
  noi.append(h('p', { class: 'phu' }, 'Đang tải...'));
  let ds: ThanhVienDs[];
  try {
    ds = await goi<ThanhVienDs[]>('admin.dsThanhVien');
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  const tim = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Tìm theo tên hoặc email' }) as HTMLInputElement;
  const danhSach = h('div', {});
  const lamMoi = async (): Promise<void> => {
    xoaHet(noi);
    await veThanhVien(noi, laChu);
  };

  const ve = (): void => {
    xoaHet(danhSach);
    const q = tim.value.trim().toLowerCase();
    ds.filter((t) => !q || t.hoTen.toLowerCase().includes(q) || t.email.includes(q)).forEach((t) => {
      const hanhDong = h('div', { class: 'hang-nut' });
      if (laChu && t.vaiTro !== 'owner') {
        if (t.trangThai === 'active') {
          hanhDong.append(
            h('button', { class: 'nut nut-phu', onclick: async () => {
              try { await goi('admin.doiVaiTro', { email: t.email, vaiTro: t.vaiTro === 'assistant' ? 'member' : 'assistant' }); await lamMoi(); } catch (e) { baoLoi(e); }
            } }, t.vaiTro === 'assistant' ? 'Bỏ trợ lý' : 'Làm trợ lý'),
            h('button', { class: 'nut nut-nguy', onclick: async () => {
              const loai = confirm(`Gỡ ${t.hoTen}?\n\nOK = gỡ (removed). Hủy = không làm gì.`) ? 'removed' : null;
              if (!loai) return;
              const xoa = confirm('Xóa luôn họ tên và dữ liệu đăng ký (GPA) của người này?');
              try { await goi('admin.goThanhVien', { email: t.email, loai, xoaDuLieu: xoa }); await lamMoi(); } catch (e) { baoLoi(e); }
            } }, 'Gỡ')
          );
        } else {
          hanhDong.append(
            h('button', { class: 'nut', onclick: async () => {
              try { await goi('admin.moLaiThanhVien', { email: t.email }); await lamMoi(); } catch (e) { baoLoi(e); }
            } }, 'Mở lại')
          );
        }
      }
      danhSach.append(
        h('div', { class: 'card hang-tv' },
          h('div', {}, h('div', { class: 'mon-ten' }, t.hoTen || '(chưa có tên)'), h('div', { class: 'phu nho' }, t.email),
            h('div', { class: 'phu nho' }, `${NHAN_VAI_TRO[t.vaiTro] ?? t.vaiTro} · ${NHAN_TRANG_THAI[t.trangThai] ?? t.trangThai}`)),
          hanhDong)
      );
    });
  };
  tim.addEventListener('input', ve);

  xoaHet(noi);
  noi.append(h('p', { class: 'phu' }, `${ds.length} người trong danh sách`), tim);
  if (laChu) {
    const email = h('input', { class: 'o-nhap', type: 'email', placeholder: 'Email người mới' }) as HTMLInputElement;
    const ten = h('input', { class: 'o-nhap', type: 'text', placeholder: 'Họ tên' }) as HTMLInputElement;
    noi.append(
      h('details', { class: 'card' },
        h('summary', {}, 'Thêm người đăng ký muộn'),
        email, ten,
        h('button', { class: 'nut', onclick: async () => {
          try { await goi('admin.themThanhVien', { email: email.value, hoTen: ten.value }); thongBao('Đã thêm'); await lamMoi(); } catch (e) { baoLoi(e); }
        } }, 'Thêm'))
    );
  }
  noi.append(danhSach);
  ve();
}

// ---------- Chia nhóm ----------

async function veChiaNhom(noi: HTMLElement): Promise<void> {
  const vungXemTruoc = h('div', {});
  const vungHienTai = h('div', {});
  noi.append(
    h('div', { class: 'card' },
      h('h3', {}, '1. Nhập đăng ký'),
      h('p', { class: 'phu' }, 'Thêm những người đã điền Form (tab DangKy) vào danh sách thành viên. Người đã có thì giữ nguyên.'),
      h('button', { class: 'nut', onclick: async () => {
        try {
          const r = await goi<{ them: number; daCo: number; tongDangKy: number }>('admin.nhapDangKy');
          thongBao(`Thêm ${r.them} người mới, ${r.daCo} người đã có`);
        } catch (e) { baoLoi(e); }
      } }, 'Nhập đăng ký')),
    h('div', { class: 'card' },
      h('h3', {}, '2. Chia nhóm'),
      h('p', { class: 'phu' }, 'Xem trước, chuyển người nếu cần, rồi bấm Chốt. Chốt sẽ thay thế các nhóm hiện có của học kỳ.'),
      h('button', { class: 'nut', onclick: () => xemTruoc(vungXemTruoc, vungHienTai) }, 'Xem trước chia nhóm'),
      vungXemTruoc),
    h('div', { class: 'card' }, h('h3', {}, '3. Nhóm hiện tại'), vungHienTai)
  );
  await veNhomHienTai(vungHienTai);
}

const dinhDangGpa = (g: number | null | undefined): string => (g == null ? '—' : g.toFixed(2));
const tbGpa = (g: NhomXemTruoc): number | null => {
  const co = g.thanhVien.filter((t) => t.gpa != null);
  return co.length ? co.reduce((s, t) => s + (t.gpa as number), 0) / co.length : null;
};

async function xemTruoc(vung: HTMLElement, vungHienTai: HTMLElement): Promise<void> {
  xoaHet(vung);
  vung.append(h('p', { class: 'phu' }, 'Đang chia...'));
  let kq: KetQuaXemTruoc;
  try {
    kq = await goi<KetQuaXemTruoc>('admin.xemTruocChiaNhom');
  } catch (e) {
    xoaHet(vung);
    baoLoi(e);
    return;
  }
  const nhoms = kq.nhoms;
  const ve = (): void => {
    xoaHet(vung);
    vung.append(h('p', { class: 'phu' }, `${nhoms.length} nhóm. Chênh lệch GPA trung bình giữa nhóm cao nhất và thấp nhất: ${kq.doLech.toFixed(2)}`));
    if (kq.thieuGpa.length)
      vung.append(h('p', { class: 'loi' }, `${kq.thieuGpa.length} người chưa có GPA hợp lệ nên chưa được xếp: ${kq.thieuGpa.map((t) => t.hoTen || t.email).join(', ')}`));
    nhoms.forEach((g, gi) => {
      const ds = h('ul', { class: 'ds-thanh-vien' });
      g.thanhVien.forEach((t) => {
        const chon = h('select', { class: 'o-chon', 'aria-label': `Chuyển ${t.hoTen}`, onchange: (ev: Event) => {
          const dich = Number((ev.target as HTMLSelectElement).value);
          const i = g.thanhVien.indexOf(t);
          g.thanhVien.splice(i, 1);
          nhoms[dich].thanhVien.push(t);
          ve();
        } },
          ...nhoms.map((n, i) => h('option', { value: i, selected: i === gi }, n.tenNhom)));
        ds.append(h('li', {}, h('span', {}, `${t.hoTen} · ${dinhDangGpa(t.gpa)}`), chon));
      });
      vung.append(h('div', { class: 'nhom-xem' }, h('h4', {}, `${g.tenNhom} · ${g.thanhVien.length} người · GPA TB ${dinhDangGpa(tbGpa(g))}`), ds));
    });
    vung.append(h('button', { class: 'nut', onclick: async () => {
      if (!confirm('Chốt chia nhóm? Các nhóm hiện có của học kỳ sẽ bị thay thế.')) return;
      try {
        await goi('admin.chotChiaNhom', { nhoms: nhoms.map((g) => ({ tenNhom: g.tenNhom, thanhVien: g.thanhVien.map((t) => ({ email: t.email })) })) });
        thongBao('Đã chốt nhóm');
        xoaHet(vung);
        await veNhomHienTai(vungHienTai);
      } catch (e) { baoLoi(e); }
    } }, 'Chốt'));
  };
  ve();
}

async function veNhomHienTai(vung: HTMLElement): Promise<void> {
  xoaHet(vung);
  let kq: NhomHienTai;
  try {
    kq = await goi<NhomHienTai>('admin.nhomHienTai');
  } catch (e) {
    vung.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  if (!kq.nhoms.length) {
    vung.append(h('p', { class: 'phu' }, 'Chưa có nhóm nào được chốt.'));
    return;
  }
  const lamMoi = (): Promise<void> => veNhomHienTai(vung);
  const chuyen = async (email: string, maNhom: string): Promise<void> => {
    try { await goi('admin.chuyenNguoi', { email, maNhom }); await lamMoi(); } catch (e) { baoLoi(e); }
  };
  const chonNhom = (email: string, hienTai: string): HTMLElement =>
    h('select', { class: 'o-chon', 'aria-label': 'Chuyển nhóm', onchange: (ev: Event) => chuyen(email, (ev.target as HTMLSelectElement).value) },
      ...(hienTai === '' ? [h('option', { value: '', selected: true }, 'Chọn nhóm...')] : []),
      ...kq.nhoms.map((n) => h('option', { value: n.maNhom as string, selected: n.maNhom === hienTai }, n.tenNhom)));

  kq.nhoms.forEach((g) => {
    const ds = h('ul', { class: 'ds-thanh-vien' });
    g.thanhVien.forEach((t) => ds.append(h('li', {}, h('span', {}, `${t.hoTen} · ${dinhDangGpa(t.gpa)}`), chonNhom(t.email, g.maNhom as string))));
    vung.append(h('div', { class: 'nhom-xem' }, h('h4', {}, `${g.tenNhom} · ${g.thanhVien.length} người · GPA TB ${dinhDangGpa(tbGpa(g))}`), ds));
  });
  if (kq.chuaCoNhom.length) {
    const ds = h('ul', { class: 'ds-thanh-vien' });
    kq.chuaCoNhom.forEach((t) => ds.append(h('li', {}, h('span', {}, t.hoTen || t.email), chonNhom(t.email, ''))));
    vung.append(h('div', { class: 'nhom-xem' }, h('h4', {}, `Chưa có nhóm (${kq.chuaCoNhom.length})`), ds));
  }
}
