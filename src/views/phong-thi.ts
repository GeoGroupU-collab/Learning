import { goi, LoiApi } from '../api';
import { h, xoaHet, thongBao } from '../dom';
import { bayGio, chayDinhKy, datGioMayChu, demNguoc, dungDongHo, khiRoiTrang } from '../gio';
import { nutBaoSai } from '../cap';
import type { DuLieuThi, LuotThiTomTat, MonNop, TuanHienTai } from '../types';

function veKetQua(goc: HTMLElement, kq: LuotThiTomTat): void {
  xoaHet(goc);
  goc.append(
    h('a', { class: 'quay-lai', href: '#/su-kien' }, '← Sự kiện'),
    h('h1', {}, 'Kết quả'),
    h('div', { class: 'card card-giua' },
      h('div', { class: 'phu nho' }, 'Điểm của bạn'),
      h('div', { class: 'diem-lon' }, String(kq.diem ?? 0)),
      h('p', {}, `Đúng ${kq.soDung ?? 0}/${kq.soCau ?? 0} câu`),
      h('p', { class: 'phu nho' }, 'Đáp án và giải thích sẽ mở sau khi phòng thi đóng cửa.'))
  );
}

export async function vePhongThi(goc: HTMLElement): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, '← Sự kiện'), h('h1', {}, 'Phòng thi'), h('p', { class: 'phu' }, 'Đang tải...'));
  const tt = await goi<TuanHienTai>('tuanHienTai');
  datGioMayChu(tt.now);
  const luot = tt.luotThi ?? null;

  if (luot?.trangThai === 'da_nop') return veKetQua(goc, luot);
  if (luot?.trangThai === 'dang_lam' || luot?.trangThai === 'het_gio') {
    const r = await goi<DuLieuThi | LuotThiTomTat>('batDauThi', {});
    if (r.trangThai === 'da_nop') return veKetQua(goc, r as LuotThiTomTat);
    return chayBaiThi(goc, r as DuLieuThi, tt.mon ?? []);
  }

  xoaHet(goc);
  goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, '← Sự kiện'), h('h1', {}, 'Phòng thi'));
  const t = tt.tuan;
  if (!t || t.trangThai !== 'mo') {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Phòng thi hiện không mở.')));
    return;
  }
  if (tt.mien) {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Bạn được miễn tuần này.')));
    return;
  }
  if (!tt.moKhoa) {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'loi' }, 'Bạn chưa nộp đủ câu hỏi nên không được thi tuần này.')));
    return;
  }
  const cfg = tt.thi ?? { soMonThi: 2, soCauMoiMonThi: 20, thoiGianPhut: 40 };
  const chon: string[] = [];
  const nutBatDau = h('button', { class: 'nut', disabled: true }, 'Bắt đầu thi') as HTMLButtonElement;
  const vung = h('div', { class: 'card' }, h('h3', {}, `Chọn ${cfg.soMonThi} môn để thi`));
  (tt.mon ?? []).forEach((m: MonNop) => {
    const o = h('input', { type: 'checkbox', id: `thi-${m.ma}` }) as HTMLInputElement;
    o.addEventListener('change', () => {
      if (o.checked) {
        if (chon.length >= cfg.soMonThi) {
          o.checked = false;
          thongBao(`Chỉ chọn đúng ${cfg.soMonThi} môn`, 'loi');
          return;
        }
        chon.push(m.ma);
      } else chon.splice(chon.indexOf(m.ma), 1);
      nutBatDau.disabled = chon.length !== cfg.soMonThi;
    });
    vung.append(h('label', { class: 'dong-chon', for: `thi-${m.ma}`, style: `--mau:${m.mau || '#4cc9f0'}` }, o, h('span', {}, m.ten)));
  });
  nutBatDau.addEventListener('click', async () => {
    if (!confirm(`Bắt đầu thi ngay?\n\n${cfg.soMonThi * cfg.soCauMoiMonThi} câu trong ${cfg.thoiGianPhut} phút. Mỗi người chỉ thi một lần, đồng hồ chạy ngay và không dừng được.`)) return;
    nutBatDau.disabled = true;
    try {
      const r = await goi<DuLieuThi | LuotThiTomTat>('batDauThi', { monChon: chon });
      if (r.trangThai === 'da_nop') veKetQua(goc, r as LuotThiTomTat);
      else chayBaiThi(goc, r as DuLieuThi, tt.mon ?? []);
    } catch (e) {
      thongBao((e as LoiApi).message, 'loi');
      nutBatDau.disabled = false;
    }
  });
  goc.append(
    h('div', { class: 'card' },
      h('p', {}, `${cfg.soMonThi * cfg.soCauMoiMonThi} câu trắc nghiệm, ${cfg.thoiGianPhut} phút. Đề rút ngẫu nhiên từ ngân hàng, không có câu do bạn nộp. Mỗi người thi một lần.`),
      h('p', { class: 'phu nho' }, 'Bài tự lưu mỗi 30 giây. Nếu mất mạng hay tắt trang, mở lại phòng thi để làm tiếp; đồng hồ vẫn chạy.')),
    vung, nutBatDau
  );
}

function chayBaiThi(goc: HTMLElement, du: DuLieuThi, mon: MonNop[]): void {
  dungDongHo();
  datGioMayChu(du.now);
  const traLoi: Record<string, string> = { ...du.traLoi };
  const tenMon = new Map(mon.map((m) => [m.ma, m.ten]));
  let canLuu = false;
  let dangNop = false;
  const tong = du.cauHoi.length;

  const demTraLoi = h('span', { class: 'phu' }, '');
  const dongHoEl = h('span', { class: 'dem-nguoc nho-dem' });
  const nutNop = h('button', { class: 'nut nho' }, 'Nộp bài') as HTMLButtonElement;
  const luoiSo = h('div', { class: 'luoi-so' });
  const danhSach = h('div', {});
  const trangThaiLuu = h('div', { class: 'phu nho' }, '');
  const nutSo: HTMLElement[] = [];
  const theCau: HTMLElement[] = [];

  const capNhatDem = (): void => {
    demTraLoi.textContent = `Đã trả lời ${Object.keys(traLoi).length}/${tong}`;
    du.cauHoi.forEach((c, i) => nutSo[i].classList.toggle('da-lam', traLoi[c.id] !== undefined));
  };

  const luu = async (): Promise<void> => {
    if (!canLuu || dangNop) return;
    canLuu = false;
    try {
      await goi('thi.luu', { maPhienThi: du.maPhienThi, traLoi });
      trangThaiLuu.textContent = 'Đã tự lưu';
    } catch (e) {
      canLuu = true;
      trangThaiLuu.textContent = (e as LoiApi).ma === 'het_gio' ? 'Đã hết giờ' : 'Chưa lưu được, kiểm tra mạng';
    }
  };

  const nop = async (tuDong: boolean): Promise<void> => {
    if (dangNop) return;
    if (!tuDong) {
      const chua = tong - Object.keys(traLoi).length;
      if (!confirm(chua > 0 ? `Còn ${chua} câu chưa trả lời. Vẫn nộp bài?` : 'Nộp bài? Sau khi nộp không sửa được.')) return;
    }
    dangNop = true;
    nutNop.disabled = true;
    const thu = async (): Promise<void> => {
      try {
        const kq = await goi<LuotThiTomTat>('thi.nop', { maPhienThi: du.maPhienThi, traLoi });
        dungDongHo();
        veKetQua(goc, kq);
      } catch (e) {
        const loi = e as LoiApi;
        if (loi.ma === 'da_nop' || loi.ma === 'het_gio') {
          const r = await goi<LuotThiTomTat | DuLieuThi>('batDauThi', {}).catch(() => null);
          if (r && r.trangThai === 'da_nop') {
            dungDongHo();
            return veKetQua(goc, r as LuotThiTomTat);
          }
        }
        trangThaiLuu.textContent = 'Chưa nộp được, đang thử lại...';
        setTimeout(() => void thu(), 5000);
      }
    };
    await thu();
  };

  du.cauHoi.forEach((c, i) => {
    const nutCac = c.dapAn.map((d) => {
      const b = h('button', { class: 'dap-an-nut', type: 'button', 'aria-pressed': traLoi[c.id] === d.k }, h('span', { class: 'chu-dap-an' }, d.k), h('span', {}, d.text));
      b.addEventListener('click', () => {
        traLoi[c.id] = d.k;
        canLuu = true;
        nutCac.forEach((x, k) => x.setAttribute('aria-pressed', String(c.dapAn[k].k === d.k)));
        capNhatDem();
      });
      return b;
    });
    const the = h('div', { class: 'card cau-thi', id: `cau-${i}` },
      h('div', { class: 'phu nho' }, `Câu ${i + 1}/${tong} · ${tenMon.get(c.maMon) ?? c.maMon}`),
      h('p', { class: 'noi-dung-cau' }, c.noiDung), ...nutCac, h('div', { class: 'phai' }, nutBaoSai(c.id)));
    theCau.push(the);
    danhSach.append(the);
    const so = h('button', { class: 'o-so', type: 'button', 'aria-label': `Câu ${i + 1}` }, String(i + 1));
    so.addEventListener('click', () => the.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    nutSo.push(so);
    luoiSo.append(so);
  });

  nutNop.addEventListener('click', () => void nop(false));
  xoaHet(goc);
  goc.append(
    h('div', { class: 'thanh-thi' }, h('div', { class: 'hang' }, dongHoEl, nutNop), demTraLoi),
    h('details', { class: 'card' }, h('summary', {}, 'Danh sách câu (chạm để nhảy tới câu)'), luoiSo),
    danhSach,
    h('div', { class: 'card' }, trangThaiLuu, h('button', { class: 'nut', onclick: () => void nop(false) }, 'Nộp bài'))
  );
  capNhatDem();

  demNguoc(dongHoEl, du.hetHanLuc, () => {
    thongBao('Hết giờ, đang nộp bài...', 'loi');
    void nop(true);
  });
  chayDinhKy(() => void luu(), 30000, false);
  const khiAn = (): void => { if (document.hidden) void luu(); };
  document.addEventListener('visibilitychange', khiAn);
  window.onbeforeunload = (): string => 'Bạn đang làm bài thi.';
  khiRoiTrang(() => {
    document.removeEventListener('visibilitychange', khiAn);
    window.onbeforeunload = null;
  });
  if (bayGio() >= du.hetHanLuc) void nop(true);
}
