import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import { dungDongHo } from '../gio';
import { nutBaoSai, theCap } from '../cap';
import type { CauXemLai, DeLuyenTap, KetQuaLuyenTap, ThongTinLuyenTap } from '../types';

function veKetQua(goc: HTMLElement, kq: KetQuaLuyenTap): void {
  xoaHet(goc);
  window.scrollTo(0, 0);
  goc.append(
    h('a', { class: 'quay-lai', href: '#/luyen-tap' }, '← Luyện tập'),
    h('h1', {}, 'Kết quả luyện tập'),
    h('div', { class: 'card card-giua' },
      h('div', { class: 'diem-lon' }, `${kq.soDung}/${kq.soCau}`),
      h('p', {}, `${kq.diem} điểm`),
      kq.diemThuong > 0
        ? h('p', { class: 'tt-tot' }, `+${kq.diemThuong} điểm cấp bậc`)
        : h('p', { class: 'phu nho' }, 'Lượt này không được cộng điểm cấp bậc (đã đạt trần tuần hoặc trả lời quá ít câu).')),
    theCap(kq.cap),
    h('h2', {}, 'Đáp án và giải thích'),
    ...kq.cauHoi.map(theXemLai),
    h('a', { class: 'nut', href: '#/luyen-tap' }, 'Luyện tập tiếp'));
}

export function theXemLai(c: CauXemLai, i: number): HTMLElement {
  return h('div', { class: c.laDung ? 'card cau-xem cau-dung' : 'card cau-xem cau-sai' },
    h('div', { class: 'phu nho' }, `Câu ${i + 1} · ${c.tenMon}${c.maChuong ? ` · ${c.maChuong}` : ''}${c.trangNguon ? ` · ${c.trangNguon}` : ''}`),
    h('p', { class: 'noi-dung-cau' }, c.noiDung),
    h('ul', { class: 'ds-dap-an' }, ...c.dapAn.map((d) =>
      h('li', { class: `${d.k === c.dung ? 'dung' : ''} ${d.k === c.chon && d.k !== c.dung ? 'chon-sai' : ''}` },
        `${d.k}. ${d.text}`, d.k === c.dung ? ' ✓' : '', d.k === c.chon ? ' (bạn chọn)' : ''))),
    c.chon === '' ? h('p', { class: 'loi nho' }, 'Bạn chưa trả lời câu này.') : null,
    c.giaiThich ? h('p', { class: 'phu nho' }, `Giải thích: ${c.giaiThich}`) : null,
    nutBaoSai(c.id));
}

function chayLuot(goc: HTMLElement, de: DeLuyenTap): void {
  xoaHet(goc);
  window.scrollTo(0, 0);
  const traLoi: Record<string, string> = {};
  const dem = h('div', { class: 'phu' }, '');
  const capNhat = (): void => { dem.textContent = `Đã trả lời ${Object.keys(traLoi).length}/${de.cauHoi.length}`; };
  const nutNop = h('button', { class: 'nut' }, 'Nộp bài') as HTMLButtonElement;
  nutNop.addEventListener('click', async () => {
    const chua = de.cauHoi.length - Object.keys(traLoi).length;
    if (chua > 0 && !confirm(`Còn ${chua} câu chưa trả lời. Vẫn nộp bài?`)) return;
    nutNop.disabled = true;
    try {
      veKetQua(goc, await goi<KetQuaLuyenTap>('luyenTap.nop', { maLuot: de.maLuot, traLoi }));
    } catch (e) {
      thongBao((e as LoiApi).message, 'loi');
      nutNop.disabled = false;
    }
  });
  goc.append(
    h('a', { class: 'quay-lai', href: '#/luyen-tap' }, '← Luyện tập'),
    h('div', { class: 'thanh-thi' }, h('div', { class: 'hang' }, dem, nutNop)),
    ...de.cauHoi.map((c, i) => {
      const nuts = c.dapAn.map((d) => {
        const b = h('button', { class: 'dap-an-nut', type: 'button', 'aria-pressed': false }, h('span', { class: 'chu-dap-an' }, d.k), h('span', {}, d.text));
        b.addEventListener('click', () => {
          traLoi[c.id] = d.k;
          nuts.forEach((x, k) => x.setAttribute('aria-pressed', String(c.dapAn[k].k === d.k)));
          capNhat();
        });
        return b;
      });
      return h('div', { class: 'card cau-thi' }, h('div', { class: 'phu nho' }, `Câu ${i + 1}/${de.cauHoi.length}`), h('p', { class: 'noi-dung-cau' }, c.noiDung), ...nuts);
    }),
    h('div', { class: 'card' }, h('button', { class: 'nut', onclick: () => nutNop.click() }, 'Nộp bài')));
  capNhat();
}

export async function veLuyenTap(goc: HTMLElement): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('h1', {}, 'Luyện tập'), h('p', { class: 'phu' }, 'Đang tải...'));
  const tt = await goi<ThongTinLuyenTap>('luyenTap.thongTin');
  xoaHet(goc);
  goc.append(
    h('h1', {}, 'Luyện tập'),
    theCap(tt.cap),
    h('div', { class: 'card' },
      h('p', {}, `Mỗi lượt ${tt.soCauMoiLuot} câu, một môn tự chọn. Hoàn thành được +${tt.diemMoiLuot} điểm cấp bậc.`),
      h('div', { class: 'tien-do' }, `Tuần này: ${tt.diemTuanNay}/${tt.diemToiDaTuan} điểm luyện tập`),
      h('p', { class: 'phu nho' }, 'Cần trả lời ít nhất một nửa số câu. Điểm luyện tập tối đa mỗi tuần tính từ Thứ Hai đến Chủ nhật. Làm xong xem được đáp án và giải thích.')));
  if (tt.dangMo) {
    goc.append(h('div', { class: 'card' },
      h('p', {}, 'Bạn có một lượt luyện tập đang làm dở.'),
      h('button', { class: 'nut', onclick: async () => {
        try { chayLuot(goc, await goi<DeLuyenTap>('luyenTap.bat', { maMon: tt.mon[0]?.ma ?? '' })); } catch (e) { thongBao((e as LoiApi).message, 'loi'); }
      } }, 'Làm tiếp')));
    return;
  }
  goc.append(h('h2', {}, 'Chọn môn'));
  if (!tt.mon.length) goc.append(h('p', { class: 'phu' }, 'Học kỳ chưa có môn nào.'));
  tt.mon.forEach((m) => {
    const het = m.soCauCoSan === 0;
    goc.append(h('button', {
      class: 'card card-mon nut-the', style: `--mau:${m.mau || '#4cc9f0'}`, disabled: het,
      onclick: async (ev: Event) => {
        const nut = ev.currentTarget as HTMLButtonElement;
        nut.disabled = true;
        try { chayLuot(goc, await goi<DeLuyenTap>('luyenTap.bat', { maMon: m.ma })); } catch (e) { thongBao((e as LoiApi).message, 'loi'); nut.disabled = false; }
      },
    }, h('div', { class: 'mon-ten' }, m.ten), h('div', { class: 'phu nho' }, het ? 'Chưa có câu hỏi' : `${m.soCauCoSan} câu trong ngân hàng`)));
  });
}
