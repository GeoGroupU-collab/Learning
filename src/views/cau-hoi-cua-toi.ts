import { goi } from '../api';
import { chuTomTat, vanBanCau, vanBanDapAn } from '../van-ban-cau';
import { h, xoaHet } from '../dom';
import type { CauCuaToi } from '../types';

const NHAN_CUA_TOI: Record<string, { chu: string; loi: boolean }> = {
  cho_duyet: { chu: 'Chờ duyệt', loi: false },
  active: { chu: 'Đang dùng', loi: false },
  tu_choi: { chu: 'Không được duyệt', loi: true },
  suspended: { chu: 'Bị tạm loại', loi: true },
  removed: { chu: 'Đã bị xóa', loi: true },
};

export async function veCauHoiCuaToi(goc: HTMLElement): Promise<void> {
  xoaHet(goc);
  goc.append(h('h1', {}, 'Câu hỏi của tôi'), h('p', { class: 'phu' }, 'Đang tải...'));
  const ds = await goi<CauCuaToi[]>('cauHoiCuaToi');
  xoaHet(goc);
  goc.append(h('h1', {}, 'Câu hỏi của tôi'));
  if (!ds.length) {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Bạn chưa nộp câu hỏi nào.')));
    return;
  }
  const theoTuan = new Map<number, CauCuaToi[]>();
  ds.forEach((c) => theoTuan.set(c.soTuan, [...(theoTuan.get(c.soTuan) ?? []), c]));
  [...theoTuan.keys()].sort((a, b) => b - a).forEach((tuan) => {
    goc.append(h('h2', {}, `Tuần ${tuan}`));
    theoTuan.get(tuan)!.forEach((c) => {
      const nhan = NHAN_CUA_TOI[c.trangThai] ?? { chu: 'Đang dùng', loi: false };
      goc.append(h('details', { class: 'card' },
        h('summary', {}, h('span', {}, chuTomTat(c.noiDung)),
          h('span', { class: nhan.loi ? 'nhan nhan-loi' : c.trangThai === 'cho_duyet' ? 'nhan nhan-vang' : 'nhan' }, nhan.chu)),
        h('p', { class: 'phu nho' }, `${c.tenMon}${c.maChuong ? ` · ${c.maChuong}` : ''}`),
        c.trangThai === 'cho_duyet' ? h('p', { class: 'phu nho' }, 'Câu này đang chờ chủ lớp hoặc trợ lý duyệt. Duyệt xong mới được rút vào đề.') : null,
        c.trangThai === 'tu_choi' ? h('p', { class: 'loi nho' }, c.ghiChuDuyet ? `Không được duyệt: ${c.ghiChuDuyet}` : 'Câu này không được duyệt.') : null,
        vanBanCau(c.noiDung, 'noi-dung-tim'),
        h('ul', { class: 'ds-dap-an' }, ...(['A', 'B', 'C', 'D'] as const).map((k) =>
          h('li', { class: c.dapAn === k ? 'dung' : '' }, `${k}. `, vanBanDapAn(c[k]), c.dapAn === k ? ' (đúng)' : ''))),
        h('p', { class: 'phu nho' }, c.soBaoSai > 0 ? `${c.soBaoSai} người đã báo sai câu này` : 'Chưa có ai báo sai')));
    });
  });
}
