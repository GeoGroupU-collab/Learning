// Thành phần giao diện dùng chung: thẻ cấp bậc cá nhân và nút báo sai.
import { goi, LoiApi } from './api';
import { h, thongBao } from './dom';
import type { ThongTinCap } from './types';

export function theCap(cap: ThongTinCap, nhan = 'Cấp của tôi'): HTMLElement {
  const phanTram = Math.min(100, Math.round((cap.diemTrongLevel / cap.diemMoiLevel) * 100));
  const conLai = cap.diemMoiLevel - cap.diemTrongLevel;
  return h('div', { class: 'card the-cap' },
    h('span', { class: 'nhan-muc' }, nhan),
    h('div', { class: 'hang' },
      h('div', { class: 'ten-cap' }, cap.tenCapLon),
      h('div', { class: 'level-cap' }, `Lv ${cap.level}`)),
    h('div', { class: 'thanh-tien-do', role: 'progressbar', 'aria-valuenow': phanTram, 'aria-valuemin': 0, 'aria-valuemax': 100 },
      h('div', { class: 'thanh-tien-do-day', style: `width:${phanTram}%` })),
    h('div', { class: 'phu nho' },
      `${cap.tong} điểm · còn ${conLai} điểm lên Lv ${cap.level + 1}`,
      cap.capKe && cap.levelConLaiDenCapKe !== null ? ` · ${cap.levelConLaiDenCapKe} level nữa đến ${cap.capKe}` : ''));
}

// Báo sai một câu hỏi (chỉ câu đã gặp trong đề của mình). Gọi lại hàm khi xong để cập nhật giao diện nếu cần.
export function nutBaoSai(idCauHoi: string): HTMLElement {
  const nut = h('button', { class: 'nut nut-phu nho', type: 'button' }, 'Báo sai') as HTMLButtonElement;
  nut.addEventListener('click', async () => {
    const lyDo = prompt('Câu này sai ở đâu? (ngắn gọn, có thể bỏ trống)');
    if (lyDo === null) return;
    nut.disabled = true;
    try {
      await goi('baoSai', { idCauHoi, lyDo });
      nut.textContent = 'Đã báo sai';
      thongBao('Đã ghi nhận báo sai');
    } catch (e) {
      nut.disabled = false;
      thongBao((e as LoiApi).message, 'loi');
    }
  });
  return nut;
}
