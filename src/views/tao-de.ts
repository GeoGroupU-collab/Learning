import { goi, goiNhanh, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import { dungDongHo } from '../gio';
import { nutBaoSai, theCap } from '../cap';
import type { CauXemLai, DeTaoDe, KetQuaTaoDe, ThongTinTaoDe } from '../types';

function veKetQua(goc: HTMLElement, kq: KetQuaTaoDe): void {
  xoaHet(goc);
  window.scrollTo(0, 0);
  goc.append(
    h('a', { class: 'quay-lai', href: '#/tao-de' }, '← Tạo đề'),
    h('h1', {}, 'Kết quả'),
    h('div', { class: 'card card-giua' },
      h('div', { class: 'diem-lon' }, `${kq.soDung}/${kq.soCau}`),
      h('p', {}, `${kq.diem} điểm`),
      kq.diemThuong > 0
        ? h('p', { class: 'tt-tot' }, `+${kq.diemThuong} điểm cấp bậc`)
        : h('p', { class: 'phu nho' }, 'Đề này không được cộng điểm cấp bậc (đã đạt trần của tuần hoặc trả lời quá ít câu).')),
    theCap(kq.cap),
    h('h2', {}, 'Đáp án và giải thích'),
    ...kq.cauHoi.map(theXemLai),
    h('a', { class: 'nut', href: '#/tao-de' }, 'Tạo đề khác'));
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

function lamDe(goc: HTMLElement, de: DeTaoDe): void {
  xoaHet(goc);
  window.scrollTo(0, 0);
  const traLoi: Record<string, string> = {};
  const dem = h('div', { class: 'phu' }, '');
  const capNhat = (): void => { dem.textContent = `Đã trả lời ${Object.keys(traLoi).length}/${de.cauHoi.length}`; };
  const nutNop = h('button', { class: 'nut nho' }, 'Nộp bài') as HTMLButtonElement;
  nutNop.addEventListener('click', async () => {
    const chua = de.cauHoi.length - Object.keys(traLoi).length;
    if (chua > 0 && !confirm(`Còn ${chua} câu chưa trả lời. Vẫn nộp bài?`)) return;
    nutNop.disabled = true;
    try {
      veKetQua(goc, await goi<KetQuaTaoDe>('taoDe.nop', { maLuot: de.maLuot, traLoi }));
    } catch (e) {
      thongBao((e as LoiApi).message, 'loi');
      nutNop.disabled = false;
    }
  });
  goc.append(
    h('a', { class: 'quay-lai', href: '#/tao-de' }, '← Tạo đề'),
    h('div', { class: 'card' }, h('div', { class: 'mon-ten' }, `${de.tenMon} · ${de.soCau} câu`),
      de.chuong.length ? h('div', { class: 'phu nho' }, `Chương: ${de.chuong.join(', ')}`) : h('div', { class: 'phu nho' }, 'Tất cả các chương')),
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

// Màn hình chọn môn và chương.
function veChon(goc: HTMLElement, tt: ThongTinTaoDe): void {
  xoaHet(goc);
  goc.append(
    h('h1', {}, 'Tạo đề thi'),
    theCap(tt.cap),
    h('div', { class: 'card' },
      h('p', {}, `Chọn một môn và các chương muốn ôn. Đề gồm ${tt.soCauMoiDe} câu rút ngẫu nhiên từ ngân hàng câu hỏi của lớp, không có câu do bạn nộp. Làm xong được +${tt.diemMoiDe} điểm cấp bậc.`),
      h('div', { class: 'tien-do' }, `Tuần này: ${tt.diemTuanNay}/${tt.diemToiDaTuan} điểm từ đề tự tạo`),
      h('p', { class: 'phu nho' }, 'Cần trả lời ít nhất một nửa số câu. Tuần tính từ Thứ Hai đến Chủ nhật. Làm xong xem được đáp án và giải thích.')));

  if (tt.dangMo) {
    goc.append(h('div', { class: 'card' },
      h('p', {}, 'Bạn có một đề đang làm dở.'),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut', onclick: async () => {
          try { lamDe(goc, await goi<DeTaoDe>('taoDe.bat', { maMon: tt.mon[0]?.ma ?? '' })); } catch (e) { thongBao((e as LoiApi).message, 'loi'); }
        } }, 'Làm tiếp'),
        h('button', { class: 'nut nut-nguy', onclick: async () => {
          if (!confirm('Bỏ đề đang làm dở? Đề này sẽ không được tính điểm.')) return;
          try { await goi('taoDe.huy'); thongBao('Đã bỏ đề'); await veTaoDe(goc); } catch (e) { thongBao((e as LoiApi).message, 'loi'); }
        } }, 'Bỏ đề này'))));
    return;
  }

  let monChon = '';
  const chuongChon = new Set<string>();
  const vungChuong = h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Chọn môn ở trên để chọn chương.'));
  const nutTao = h('button', { class: 'nut', disabled: true }, 'Tạo đề') as HTMLButtonElement;

  const veChuong = (): void => {
    xoaHet(vungChuong);
    const m = tt.mon.find((x) => x.ma === monChon);
    if (!m) { vungChuong.append(h('p', { class: 'phu' }, 'Chọn môn ở trên để chọn chương.')); return; }
    vungChuong.append(h('h3', {}, `Chương của ${m.ten}`));
    const tinh = (): void => {
      const co = chuongChon.size === 0 ? m.soCau : m.chuong.filter((c) => chuongChon.has(c.ma)).reduce((s, c) => s + c.soCau, 0);
      ghiChu.textContent = `Có ${co} câu phù hợp${co >= tt.soCauToiThieu ? `, đề sẽ có ${Math.min(tt.soCauMoiDe, co)} câu.` : `. Cần ít nhất ${tt.soCauToiThieu} câu, hãy chọn thêm chương.`}`;
      ghiChu.className = co >= tt.soCauToiThieu ? 'phu nho' : 'loi nho';
      nutTao.disabled = co < tt.soCauToiThieu;
    };
    const ghiChu = h('p', { class: 'phu nho' }, '');
    if (!m.chuong.length) {
      vungChuong.append(h('p', { class: 'phu' }, 'Môn này chưa phân chương, đề sẽ lấy từ toàn bộ câu hỏi của môn.'));
    } else {
      vungChuong.append(h('p', { class: 'phu nho' }, 'Không chọn chương nào nghĩa là lấy tất cả các chương.'));
      m.chuong.forEach((c, i) => {
        const o = h('input', { type: 'checkbox', id: `ch-${i}`, disabled: c.soCau === 0 }) as HTMLInputElement;
        o.addEventListener('change', () => { if (o.checked) chuongChon.add(c.ma); else chuongChon.delete(c.ma); tinh(); });
        vungChuong.append(h('label', { class: 'dong-chon', for: `ch-${i}`, style: `--mau:${m.mau || '#4cc9f0'}` }, o, h('span', {}, `${c.ten} (${c.soCau} câu)`)));
      });
    }
    vungChuong.append(ghiChu);
    tinh();
  };

  goc.append(h('h2', {}, '1. Chọn môn'));
  if (!tt.mon.length) goc.append(h('p', { class: 'phu' }, 'Học kỳ chưa có môn nào.'));
  const cacNutMon: HTMLButtonElement[] = [];
  tt.mon.forEach((m) => {
    const het = m.soCau < tt.soCauToiThieu;
    const nut = h('button', {
      class: 'card card-mon nut-the', style: `--mau:${m.mau || '#4cc9f0'}`, disabled: het, 'aria-pressed': false,
      onclick: () => {
        monChon = m.ma;
        chuongChon.clear();
        cacNutMon.forEach((x) => x.setAttribute('aria-pressed', String(x === nut)));
        veChuong();
      },
    }, h('div', { class: 'mon-ten' }, m.ten), h('div', { class: 'phu nho' }, het ? `Chưa đủ câu hỏi (${m.soCau})` : `${m.soCau} câu trong ngân hàng`)) as HTMLButtonElement;
    cacNutMon.push(nut);
    goc.append(nut);
  });
  goc.append(h('h2', {}, '2. Chọn chương'), vungChuong, h('h2', {}, '3. Bắt đầu'), nutTao);
  nutTao.addEventListener('click', async () => {
    nutTao.disabled = true;
    try {
      lamDe(goc, await goi<DeTaoDe>('taoDe.bat', { maMon: monChon, chuong: [...chuongChon] }));
    } catch (e) {
      thongBao((e as LoiApi).message, 'loi');
      nutTao.disabled = false;
    }
  });
}

export async function veTaoDe(goc: HTMLElement): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('h1', {}, 'Tạo đề thi'), khungCho(2));
  let daVe = false;
  await goiNhanh<ThongTinTaoDe>('taoDe.thongTin', {}, (tt, tuCache) => {
    // Bản đã lưu chỉ để hiện nhanh; khi dữ liệu mới về mà người dùng chưa chọn gì thì vẽ lại.
    if (!tuCache && daVe && goc.querySelector('[aria-pressed="true"]')) return;
    veChon(goc, tt);
    daVe = true;
  });
}
