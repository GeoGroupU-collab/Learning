import { goi, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import type { MonQuanTri } from '../types';

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

// Quản trị danh sách chương của từng môn. Khi một môn có danh sách chương thì thành viên bắt buộc chọn chương
// lúc nộp câu hỏi, và chọn chương lúc tạo đề.
export async function veChuong(noi: HTMLElement, laChu: boolean): Promise<void> {
  noi.append(khungCho(2));
  let mon: MonQuanTri[];
  try {
    mon = (await goi<{ mon: MonQuanTri[] }>('admin.dsMon')).mon;
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(noi);
  const lamMoi = async (): Promise<void> => { xoaHet(noi); await veChuong(noi, laChu); };
  noi.append(h('p', { class: 'phu' }, 'Mỗi dòng là một chương. Thứ tự dòng là thứ tự hiện cho thành viên. Giữ nguyên tên chương thì giữ nguyên mã, nên các câu đã nộp vẫn khớp.'));
  if (!mon.length) noi.append(h('p', { class: 'phu' }, 'Chưa có môn nào trong học kỳ (tab Mon của Sheet).'));

  mon.forEach((m) => {
    const o = h('textarea', { class: 'o-nhap', rows: Math.max(4, m.chuong.length + 1), disabled: !laChu, placeholder: 'Chương 1: Mở đầu\nChương 2: ...' }) as HTMLTextAreaElement;
    o.value = m.chuong.map((c) => c.ten).join('\n');
    const maChuan = new Map(m.chuong.map((c) => [c.ma, c.ten]));
    const chuaChuan = m.giaTriTrongNganHang.filter((g) => g.giaTri === '' || !maChuan.has(g.giaTri));

    const vungGop = h('div', {});
    if (m.chuong.length && chuaChuan.length) {
      vungGop.append(h('h4', {}, 'Câu hỏi chưa thuộc chương chuẩn'), h('p', { class: 'phu nho' }, 'Các câu này do thành viên tự gõ chương lúc chưa có danh sách. Chuyển vào chương chuẩn để tạo đề lọc theo chương được.'));
      chuaChuan.forEach((g) => {
        const chon = h('select', { class: 'o-chon', 'aria-label': 'Chương chuẩn' }, h('option', { value: '' }, 'Chọn chương...'),
          ...m.chuong.map((c) => h('option', { value: c.ma }, c.ten))) as HTMLSelectElement;
        vungGop.append(h('div', { class: 'hang gop-chuong' },
          h('span', {}, `"${g.giaTri || '(để trống)'}" · ${g.soCau} câu`),
          laChu ? h('span', { class: 'hang-nut' }, chon, h('button', { class: 'nut nho', onclick: async () => {
            if (!chon.value) { thongBao('Hãy chọn chương chuẩn', 'loi'); return; }
            try { const r = await goi<{ soCau: number }>('admin.doiChuongCau', { maMon: m.ma, tu: g.giaTri, den: chon.value }); thongBao(`Đã chuyển ${r.soCau} câu`); await lamMoi(); } catch (e) { baoLoi(e); }
          } }, 'Chuyển')) : null));
      });
    } else if (!m.chuong.length && m.giaTriTrongNganHang.some((g) => g.giaTri !== '')) {
      vungGop.append(h('p', { class: 'phu nho' }, `Đang có ${m.giaTriTrongNganHang.filter((g) => g.giaTri !== '').length} cách ghi chương do thành viên tự gõ: ${m.giaTriTrongNganHang.filter((g) => g.giaTri !== '').map((g) => `"${g.giaTri}" (${g.soCau})`).join(', ')}.`));
    }

    noi.append(h('details', { class: 'card card-mon', open: true, style: `--mau:${m.mau || '#4cc9f0'}` },
      h('summary', {}, `${m.ten}`, h('span', { class: 'nhan' }, `${m.chuong.length} chương · ${m.soCau} câu`)),
      o,
      laChu ? h('button', { class: 'nut', onclick: async () => {
        const ten = o.value.split('\n').map((x) => x.trim()).filter((x) => x);
        try { await goi('admin.luuChuong', { maMon: m.ma, chuong: ten }); thongBao('Đã lưu danh sách chương'); await lamMoi(); } catch (e) { baoLoi(e); }
      } }, 'Lưu danh sách chương') : null,
      vungGop));
  });
}
