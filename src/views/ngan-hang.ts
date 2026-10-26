import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import { docCsv, taiXuong, taoCsv } from '../csv';
import type { CauNganHang, KetQuaNganHang, TuanHienTai, XemTruocNhap } from '../types';

const NHAN_TT: Record<string, string> = { active: 'Đang dùng', suspended: 'Tạm loại', removed: 'Đã xóa' };
const COT_XUAT = ['id', 'maHocKy', 'soTuan', 'maMon', 'maChuong', 'trangNguon', 'noiDung', 'A', 'B', 'C', 'D', 'dapAn', 'giaiThich', 'tacGia', 'trangThai', 'soBaoSai'];

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

export async function veNganHang(noi: HTMLElement, laChu: boolean): Promise<void> {
  let mon: { ma: string; ten: string }[] = [];
  try {
    mon = (await goi<TuanHienTai>('tuanHienTai')).mon ?? [];
  } catch {
    /* không có môn thì bộ lọc môn để trống */
  }
  const loc = { soTuan: '', maMon: '', trangThai: '', tacGia: '', tuKhoa: '', chiBaoSai: false, trang: 1 };
  const danhSach = h('div', {});
  const phanTrang = h('div', { class: 'hang' });

  const o = (nhan: string, el: HTMLElement): HTMLElement => h('label', { class: 'nhan-o' }, nhan, el);
  const soTuan = h('input', { class: 'o-nhap', type: 'number', min: 1, placeholder: 'Tất cả' }) as HTMLInputElement;
  const maMon = h('select', { class: 'o-chon o-day' }, h('option', { value: '' }, 'Tất cả môn'), ...mon.map((m) => h('option', { value: m.ma }, m.ten))) as HTMLSelectElement;
  const trangThai = h('select', { class: 'o-chon o-day' }, h('option', { value: '' }, 'Mọi trạng thái'),
    ...Object.entries(NHAN_TT).map(([k, v]) => h('option', { value: k }, v))) as HTMLSelectElement;
  const tacGia = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Tên hoặc email' }) as HTMLInputElement;
  const tuKhoa = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Từ trong nội dung câu hỏi' }) as HTMLInputElement;
  const chiBaoSai = h('input', { type: 'checkbox', id: 'chi-bao-sai' }) as HTMLInputElement;

  const tai = async (): Promise<void> => {
    xoaHet(danhSach);
    danhSach.append(h('p', { class: 'phu' }, 'Đang tải...'));
    try {
      const kq = await goi<KetQuaNganHang>('admin.nganHang', loc);
      xoaHet(danhSach);
      xoaHet(phanTrang);
      danhSach.append(h('p', { class: 'phu' }, `${kq.tong} câu hỏi`));
      kq.cauHoi.forEach((c) => danhSach.append(theCau(c)));
      const soTrang = Math.max(1, Math.ceil(kq.tong / kq.coTrang));
      phanTrang.append(
        h('button', { class: 'nut nut-phu', disabled: kq.trang <= 1, onclick: () => { loc.trang--; void tai(); } }, '← Trước'),
        h('span', { class: 'phu' }, `Trang ${kq.trang}/${soTrang}`),
        h('button', { class: 'nut nut-phu', disabled: kq.trang >= soTrang, onclick: () => { loc.trang++; void tai(); } }, 'Sau →'));
    } catch (e) {
      xoaHet(danhSach);
      danhSach.append(h('p', { class: 'loi' }, (e as Error).message));
    }
  };

  const doiTrangThai = async (c: CauNganHang, tt: string): Promise<void> => {
    if (tt === 'removed' && !confirm('Xóa câu hỏi này khỏi ngân hàng? Câu sẽ không được rút cho đề nào nữa.')) return;
    try { await goi('admin.doiTrangThaiCau', { id: c.id, trangThai: tt }); thongBao('Đã cập nhật'); await tai(); } catch (e) { baoLoi(e); }
  };

  const theSua = (c: CauNganHang): HTMLElement => {
    const t = (truong: keyof CauNganHang, nhan: string, dai = false): [HTMLElement, () => string] => {
      const el = (dai ? h('textarea', { class: 'o-nhap', rows: 3 }) : h('input', { class: 'o-nhap', type: 'text' })) as HTMLInputElement;
      el.value = String(c[truong] ?? '');
      return [h('label', { class: 'nhan-o' }, nhan, el), () => el.value];
    };
    const cacTruong: [keyof CauNganHang, string, boolean][] = [['noiDung', 'Nội dung', true], ['A', 'Đáp án A', false], ['B', 'Đáp án B', false], ['C', 'Đáp án C', false], ['D', 'Đáp án D', false], ['giaiThich', 'Giải thích', true], ['trangNguon', 'Trang nguồn', false], ['maChuong', 'Chương', false]];
    const o2 = cacTruong.map(([k, n, d]) => ({ k, ...(() => { const [el, lay] = t(k, n, d); return { el, lay }; })() }));
    const da = h('select', { class: 'o-chon o-day' }, ...['A', 'B', 'C', 'D'].map((k) => h('option', { value: k, selected: c.dapAn === k }, k))) as HTMLSelectElement;
    return h('div', { class: 'form-sua' }, ...o2.map((x) => x.el), h('label', { class: 'nhan-o' }, 'Đáp án đúng', da),
      h('button', { class: 'nut', onclick: async () => {
        const thayDoi: Record<string, string> = { dapAn: da.value };
        o2.forEach((x) => { thayDoi[x.k] = x.lay(); });
        try { await goi('admin.suaCauHoi', { id: c.id, thayDoi }); thongBao('Đã lưu'); await tai(); } catch (e) { baoLoi(e); }
      } }, 'Lưu thay đổi'));
  };

  const theCau = (c: CauNganHang): HTMLElement => {
    const vungSua = h('div', {});
    const nut: HTMLElement[] = [];
    if (c.trangThai === 'active') nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => void doiTrangThai(c, 'suspended') }, 'Tạm loại'));
    else if (c.trangThai === 'suspended' || laChu) nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => void doiTrangThai(c, 'active') }, 'Khôi phục'));
    if (laChu) {
      nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => { if (vungSua.firstChild) xoaHet(vungSua); else vungSua.append(theSua(c)); } }, 'Sửa'));
      if (c.trangThai !== 'removed') nut.push(h('button', { class: 'nut nut-nguy nho', onclick: () => void doiTrangThai(c, 'removed') }, 'Xóa'));
    }
    return h('div', { class: `card cau-xem ${c.trangThai !== 'active' ? 'cau-sai' : ''}` },
      h('div', { class: 'hang' },
        h('span', { class: 'phu nho' }, `Tuần ${c.soTuan} · ${c.maMon}${c.maChuong ? ` · ${c.maChuong}` : ''}${c.trangNguon ? ` · ${c.trangNguon}` : ''}`),
        h('span', { class: c.trangThai === 'active' ? 'nhan' : 'nhan nhan-loi' }, NHAN_TT[c.trangThai])),
      h('p', { class: 'noi-dung-cau' }, c.noiDung),
      h('ul', { class: 'ds-dap-an' }, ...(['A', 'B', 'C', 'D'] as const).map((k) => h('li', { class: c.dapAn === k ? 'dung' : '' }, `${k}. ${c[k]}`))),
      c.giaiThich ? h('p', { class: 'phu nho' }, `Giải thích: ${c.giaiThich}`) : null,
      h('p', { class: 'phu nho' }, `Tác giả: ${c.tenTacGia || c.tacGia} (${c.tacGia}) · ${c.soBaoSai} lượt báo sai`),
      h('div', { class: 'hang-nut' }, ...nut), vungSua);
  };

  noi.append(
    h('div', { class: 'card' }, h('h3', {}, 'Bộ lọc'),
      o('Tuần', soTuan), o('Môn', maMon), o('Trạng thái', trangThai), o('Tác giả', tacGia), o('Từ khóa', tuKhoa),
      h('label', { class: 'dong-chon', for: 'chi-bao-sai' }, chiBaoSai, h('span', {}, 'Chỉ câu đã bị báo sai')),
      h('button', { class: 'nut', onclick: () => {
        Object.assign(loc, { soTuan: soTuan.value, maMon: maMon.value, trangThai: trangThai.value, tacGia: tacGia.value, tuKhoa: tuKhoa.value, chiBaoSai: chiBaoSai.checked, trang: 1 });
        void tai();
      } }, 'Lọc')));

  if (laChu) {
    const tep = h('input', { type: 'file', accept: '.json,.csv', class: 'o-nhap' }) as HTMLInputElement;
    const vungXem = h('div', {});
    const xuat = async (kieu: 'json' | 'csv'): Promise<void> => {
      try {
        const rows = await goi<CauNganHang[]>('admin.xuatNganHang');
        const ngay = new Date().toISOString().slice(0, 10);
        if (kieu === 'json') taiXuong(`ngan-hang-${ngay}.json`, JSON.stringify(rows, null, 2), 'application/json');
        else taiXuong(`ngan-hang-${ngay}.csv`, taoCsv(rows as unknown as Record<string, unknown>[], COT_XUAT), 'text/csv');
        thongBao(`Đã xuất ${rows.length} câu`);
      } catch (e) { baoLoi(e); }
    };
    tep.addEventListener('change', async () => {
      xoaHet(vungXem);
      const f = tep.files?.[0];
      if (!f) return;
      let rows: Record<string, unknown>[];
      try {
        const text = await f.text();
        rows = f.name.toLowerCase().endsWith('.csv') ? docCsv(text) : (JSON.parse(text) as Record<string, unknown>[]);
        if (!Array.isArray(rows)) throw new Error('Tệp JSON phải là một danh sách câu hỏi.');
      } catch (e) {
        vungXem.append(h('p', { class: 'loi' }, `Không đọc được tệp: ${(e as Error).message}`));
        return;
      }
      try {
        const xem = await goi<XemTruocNhap>('admin.xemTruocNhap', { rows });
        vungXem.append(
          h('p', {}, `${xem.thayDoi.length} câu sẽ thay đổi, ${xem.khongDoi} câu không đổi, ${xem.loi.length} câu lỗi (bỏ qua), ${xem.khongCo.length} id không có trong ngân hàng.`),
          ...xem.loi.map((l) => h('p', { class: 'loi nho' }, `${l.id}: ${l.loi.join('; ')}`)),
          ...xem.thayDoi.slice(0, 100).map((t) => h('details', { class: 'card' }, h('summary', {}, t.id),
            ...Object.entries(t.diff).map(([k, v]) => h('p', { class: 'nho' }, h('b', {}, `${k}: `), h('span', { class: 'phu' }, v.tu || '(trống)'), ' → ', v.den || '(trống)')))),
          ...(xem.thayDoi.length > 100 ? [h('p', { class: 'phu nho' }, `Chỉ hiện 100 câu đầu, nhưng sẽ áp dụng cả ${xem.thayDoi.length} câu.`)] : []),
          ...(xem.thayDoi.length ? [h('button', { class: 'nut', onclick: async () => {
            if (!confirm(`Áp dụng ${xem.thayDoi.length} thay đổi vào ngân hàng?`)) return;
            try {
              const r = await goi<{ daSua: number }>('admin.nhapNganHang', { rows });
              thongBao(`Đã sửa ${r.daSua} câu`);
              xoaHet(vungXem);
              tep.value = '';
              await tai();
            } catch (e) { baoLoi(e); }
          } }, `Áp dụng ${xem.thayDoi.length} thay đổi`)] : []));
      } catch (e) { baoLoi(e); }
    });
    noi.append(h('details', { class: 'card' }, h('summary', {}, 'Xuất và nhập ngân hàng'),
      h('p', { class: 'phu nho' }, 'Xuất file (kèm trang nguồn) để đối chiếu với PDF bài giảng. Sửa xong chọn lại file, hệ thống khớp theo id, cho xem trước các thay đổi rồi mới áp dụng. Chỉ sửa được nội dung, đáp án, giải thích, trang nguồn, chương và trạng thái.'),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut', onclick: () => void xuat('json') }, 'Xuất JSON'),
        h('button', { class: 'nut', onclick: () => void xuat('csv') }, 'Xuất CSV')),
      h('label', { class: 'nhan-o' }, 'Nhập bản đã sửa (.json hoặc .csv)', tep), vungXem));
  }
  noi.append(danhSach, phanTrang);
  await tai();
}
