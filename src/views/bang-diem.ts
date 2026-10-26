import { goi, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import { taiXuong, taoCsv } from '../csv';
import type { BangDiemKq } from '../types';

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

export async function veBangDiem(noi: HTMLElement, laChu: boolean): Promise<void> {
  noi.append(khungCho(2));
  let kq: BangDiemKq;
  try {
    kq = await goi<BangDiemKq>('admin.bangDiem');
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(noi);
  const lamMoi = async (): Promise<void> => { xoaHet(noi); await veBangDiem(noi, laChu); };
  if (!kq.tuan.length) {
    noi.append(h('p', { class: 'phu' }, 'Chưa có điểm nào. Bảng điểm hiện sau khi có tuần thi.'));
    return;
  }

  const xuatCsv = (): void => {
    const cot = ['hoTen', 'email', 'nhom', ...kq.tuan.map((t) => `T${t}`), 'diemTB', 'soTuanThi', 'tongCapBac', 'level', 'tenCapLon'];
    const rows = kq.nguoi.map((n) => ({
      hoTen: n.hoTen, email: n.email, nhom: n.nhom,
      ...Object.fromEntries(kq.tuan.map((t) => [`T${t}`, n.diemTuan[String(t)] === null ? '' : n.diemTuan[String(t)] === 'mien' ? 'miễn' : n.diemTuan[String(t)]])),
      diemTB: n.diemTB ?? '', soTuanThi: n.soTuanThi, tongCapBac: n.tongCapBac, level: n.level, tenCapLon: n.tenCapLon,
    }));
    taiXuong(`bang-diem-${new Date().toISOString().slice(0, 10)}.csv`, taoCsv(rows, cot), 'text/csv');
  };

  noi.append(h('div', { class: 'hang-nut' },
    h('button', { class: 'nut', onclick: xuatCsv }, 'Xuất CSV (báo cáo cho thầy)')),
    h('p', { class: 'phu nho' }, 'Điểm thi mỗi tuần theo thang 100; "—" là không thi, "miễn" là được miễn. Không có GPA.'));

  const t = h('table', { class: 'bang' }, h('thead', {}, h('tr', {}, h('th', {}, 'Tên'), h('th', {}, 'Nhóm'), ...kq.tuan.map((x) => h('th', {}, `T${x}`)), h('th', {}, 'TB'), h('th', {}, 'Cấp'))));
  const tb = h('tbody', {});
  kq.nguoi.forEach((n) => tb.append(h('tr', {},
    h('td', {}, n.hoTen), h('td', {}, n.nhom || '—'),
    ...kq.tuan.map((x) => { const v = n.diemTuan[String(x)]; return h('td', {}, v === null || v === undefined ? '—' : v === 'mien' ? 'miễn' : String(v)); }),
    h('td', {}, n.diemTB === null ? '—' : String(n.diemTB)), h('td', {}, `${n.tenCapLon} Lv${n.level}`))));
  t.append(tb);
  noi.append(h('div', { class: 'card' }, h('h3', {}, `${kq.nguoi.length} thành viên`), h('div', { class: 'cuon-ngang' }, t)));

  const bangNhom = h('table', { class: 'bang' }, h('thead', {}, h('tr', {}, h('th', {}, 'Tuần'), h('th', {}, 'Nhóm'), h('th', {}, 'Điểm'), h('th', {}, 'Hạng'), h('th', {}, 'Thi'))));
  const tbn = h('tbody', {});
  kq.nhom.slice().sort((a, b) => a.soTuan - b.soTuan || a.hang - b.hang).forEach((n) => tbn.append(h('tr', {},
    h('td', {}, String(n.soTuan)), h('td', {}, n.nhom), h('td', {}, n.diem.toFixed(1)), h('td', {}, String(n.hang)), h('td', {}, `${n.soThamGia}/${n.soTinh}`))));
  bangNhom.append(tbn);
  noi.append(h('div', { class: 'card' }, h('h3', {}, 'Điểm nhóm các tuần đã chốt'), h('div', { class: 'cuon-ngang' }, bangNhom)));

  if (laChu) {
    const chonTuan = h('select', { class: 'o-chon' }, ...kq.tuan.map((x) => h('option', { value: x }, `Tuần ${x}`))) as HTMLSelectElement;
    noi.append(h('div', { class: 'card' }, h('h3', {}, 'Chấm lại tuần'),
      h('p', { class: 'phu nho' }, 'Dùng sau khi có câu bị tạm loại hoặc xóa vì báo sai: các câu đó bị loại khỏi tử số và mẫu số của mọi bài trong tuần, rồi tính lại điểm cá nhân, điểm nhóm, hạng, thưởng nhóm và danh hiệu của tuần. Điểm luyện tập không đổi. Chạy lại nhiều lần vẫn an toàn.'),
      h('div', { class: 'hang-nut' }, chonTuan, h('button', { class: 'nut nut-nguy', onclick: async () => {
        if (!confirm(`Chấm lại tuần ${chonTuan.value}? Điểm và hạng của tuần có thể thay đổi.`)) return;
        try {
          const r = await goi<{ soBaiDoi: number; soCauBiLoai: number }>('admin.chamLaiTuan', { soTuan: Number(chonTuan.value) });
          thongBao(`Đã chấm lại: ${r.soBaiDoi} bài đổi điểm, ${r.soCauBiLoai} câu bị loại`);
          await lamMoi();
        } catch (e) { baoLoi(e); }
      } }, 'Chấm lại'))));
  }
}
