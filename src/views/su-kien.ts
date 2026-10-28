import { goi, goiNhanh, LoiApi } from '../api';
import { icon } from '../icon';
import { mauMon } from '../mau';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import { datGioMayChu, demNguoc, dinhDangNgay, dungDongHo } from '../gio';
import { taiXuong } from '../csv';
import { docCauHoiTuAi, taoPromptMd } from '../prompt-ai';
import { thanhTabSuKien } from './thong-bao';
import type { BanNhap, CauCuaToi, CauNhap, MonNop, TuanHienTai } from '../types';

const NHAN_TRANG_THAI: Record<string, string> = {
  nop_cau_hoi: 'Đang nhận câu hỏi',
  cho_mo_cua: 'Chờ mở phòng thi',
  mo: 'Phòng thi đang mở',
  dong: 'Đã đóng',
};

function khungDemNguoc(luc: number, nhan: string, khiHet: () => void): HTMLElement {
  const so = h('div', { class: 'dem-nguoc', 'aria-live': 'off' });
  demNguoc(so, luc, khiHet);
  return h('div', { class: 'khung-dem' }, h('div', { class: 'phu nho' }, nhan), so);
}

export async function veSuKien(goc: HTMLElement): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('h1', {}, 'Sự kiện'), thanhTabSuKien('tuan'), khungCho(2));
  await goiNhanh<TuanHienTai>('tuanHienTai', {}, (tt) => {
    dungDongHo();
    dungSuKien(goc, tt);
  });
}

function dungSuKien(goc: HTMLElement, tt: TuanHienTai): void {
  datGioMayChu(tt.now);
  xoaHet(goc);
  goc.append(h('h1', {}, 'Sự kiện'), thanhTabSuKien('tuan'));
  const chinh = h('div', { class: 'cot-chinh' });
  const phu = h('div', { class: 'cot-phu' });
  goc.append(h('div', { class: 'bo-cuc-2' }, chinh, phu), sapRaMat());
  const t = tt.tuan;
  if (!t) {
    chinh.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Chưa có lịch sự kiện. Lớp trưởng sẽ tạo lịch trong trang Quản trị.')));
    return;
  }
  const lamMoi = (): Promise<void> => veSuKien(goc);
  phu.append(theLuatTuan(tt));

  // Ba chặng của một tuần: chặng đang diễn ra sáng lên, chặng đã qua có dấu tick.
  const chang = t.trangThai === 'nop_cau_hoi' ? 0 : t.trangThai === 'dong' ? 2 : 1;
  const dsChang: [string, string, string][] = [
    ['1', 'Nộp câu hỏi', `Hạn ${dinhDangNgay(t.hanNop)}`],
    ['2', 'Phòng thi', `${dinhDangNgay(t.moCua)} đến ${dinhDangNgay(t.dongCua)}`],
    ['3', 'Kết quả', 'Xem điểm, hạng và đáp án'],
  ];
  chinh.append(
    h('div', { class: 'hero hero-su-kien' },
      h('div', { class: 'hang' },
        h('span', { class: 'hero-nhan' }, `Tuần ${t.soTuan}`),
        h('span', { class: 'hero-chip' }, NHAN_TRANG_THAI[t.trangThai])),
      t.moc ? khungDemNguoc(t.moc.luc, `Còn lại đến: ${t.moc.nhan.toLowerCase()}`, () => void lamMoi()) : h('div', { class: 'hero-lon' }, 'Tuần đã khép lại')),
    h('div', { class: 'chang' }, ...dsChang.map(([so, ten, mo], i) =>
      h('div', { class: i < chang ? 'chang-o xong' : i === chang ? 'chang-o dang' : 'chang-o' },
        h('span', { class: 'chang-so' }, i < chang ? (icon('tick', 14) as unknown as HTMLElement) : so),
        h('div', { class: 'mon-ten' }, ten),
        h('div', { class: 'phu nho' }, mo))))
  );

  phu.append(h('a', { class: 'card', href: '#/su-kien/xem-lai' },
    h('div', { class: 'mon-ten' }, 'Xem lại bài và câu khó nhất'),
    h('div', { class: 'phu nho' }, 'Đáp án, giải thích và 5 câu cả lớp sai nhiều nhất, mở sau khi mỗi tuần đóng cửa.')));
  const yc = tt.yeuCau!;
  const canNop = tt.soCauCanNop ?? yc.soMon * yc.soCauMoiMon;

  if (t.trangThai === 'nop_cau_hoi') {
    if (tt.mien) {
      chinh.append(h('div', { class: 'card' },
        h('h3', {}, 'Bạn đã xin miễn tuần này'),
        h('p', { class: 'phu' }, 'Bạn không phải nộp câu hỏi và không thi tuần này. Điểm nhóm sẽ không tính bạn vào mẫu số.'),
        h('button', { class: 'nut nut-phu', onclick: async () => {
          try { await goi('huyMien'); thongBao('Đã hủy xin miễn'); await lamMoi(); } catch (e) { thongBao((e as LoiApi).message, 'loi'); }
        } }, 'Hủy xin miễn')));
      return;
    }
    const xong = (tt.soCauDaNop ?? 0) >= canNop;
    chinh.append(h('div', { class: 'card' },
      h('h3', {}, '1. Nộp câu hỏi'),
      h('p', {}, `Chọn ${yc.soMon} môn, mỗi môn nộp đúng ${yc.soCauMoiMon} câu trắc nghiệm (tổng ${canNop} câu). Nộp đủ mới được vào phòng thi.`),
      h('div', { class: xong ? 'tien-do tien-do-xong' : 'tien-do' }, xong ? `Đã nộp đủ ${canNop} câu. Bạn được vào phòng thi.` : `Đã nộp ${tt.soCauDaNop ?? 0}/${canNop} câu`),
      h('a', { class: 'nut', href: '#/su-kien/nop' }, xong ? 'Xem và sửa câu hỏi' : 'Nộp câu hỏi'),
      h('p', { class: 'phu nho' }, 'Bạn được sửa câu đã nộp đến hết hạn.')));
    const conLuot = (tt.soMienToiDa ?? 0) - (tt.soMienDaDung ?? 0);
    if (!xong && conLuot > 0) {
      chinh.append(h('div', { class: 'card' },
        h('h3', {}, '2. Xin miễn tuần này'),
        h('p', { class: 'phu' }, `Bạn còn ${conLuot} lượt xin miễn trong học kỳ. Được miễn thì không nộp câu hỏi, không thi và không bị tính vào điểm nhóm tuần này.`),
        h('button', { class: 'nut nut-nguy', onclick: async () => {
          if (!confirm('Xin miễn tuần này? Bạn chỉ có số lượt giới hạn trong học kỳ.')) return;
          try { await goi('xinMien'); thongBao('Đã xin miễn'); await lamMoi(); } catch (e) { thongBao((e as LoiApi).message, 'loi'); }
        } }, 'Xin miễn tuần này')));
    }
    return;
  }

  if (tt.mien) {
    chinh.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Bạn được miễn tuần này.')));
    return;
  }
  const luot = tt.luotThi ?? null;
  const cfg = tt.thi ?? { soMonThi: 2, soCauMoiMonThi: 20, thoiGianPhut: 40 };
  const hanhDong: (HTMLElement | null)[] = [];
  let noiDung = '';
  if (luot?.trangThai === 'da_nop') {
    noiDung = `Bạn đã thi tuần này: đúng ${luot.soDung}/${luot.soCau} câu, ${luot.diem} điểm.`;
    hanhDong.push(h('a', { class: 'nut nut-phu', href: '#/su-kien/thi' }, 'Xem kết quả'));
  } else if (luot?.trangThai === 'dang_lam' || luot?.trangThai === 'het_gio') {
    noiDung = 'Bạn đang làm bài. Đồng hồ vẫn chạy.';
    hanhDong.push(h('a', { class: 'nut', href: '#/su-kien/thi' }, 'Tiếp tục làm bài'));
  } else if (!tt.moKhoa) {
    noiDung = 'Bạn chưa nộp đủ câu hỏi nên không được vào phòng thi tuần này.';
  } else if (t.trangThai === 'mo') {
    noiDung = `${cfg.soMonThi * cfg.soCauMoiMonThi} câu trong ${cfg.thoiGianPhut} phút. Mỗi người thi một lần.`;
    hanhDong.push(h('a', { class: 'nut', href: '#/su-kien/thi' }, 'Vào phòng thi'));
  } else if (t.trangThai === 'cho_mo_cua') {
    noiDung = 'Bạn đã nộp đủ câu hỏi. Phòng thi sẽ mở theo giờ ở trên.';
  } else {
    noiDung = 'Phòng thi đã đóng.';
  }
  chinh.append(h('div', { class: 'card' }, h('h3', {}, 'Phòng thi'), h('p', { class: tt.moKhoa || luot ? '' : 'loi' }, noiDung), ...hanhDong.filter((x): x is HTMLElement => x !== null)));
}


// Hai hoạt động sắp ra mắt, chỉ để trang trí và báo trước. Sửa nội dung ở đây khi có thông tin chính thức.
function sapRaMat(): HTMLElement {
  const the = (bieuTuong: string, ten: string, mo: string, lop: string): HTMLElement =>
    h('div', { class: `card the-sap-ra ${lop}` },
      h('span', { class: 'sap-ra-dai' }, 'Coming soon'),
      h('div', { class: 'sap-ra-bieu' }, icon(bieuTuong, 30) as unknown as HTMLElement),
      h('h3', {}, ten),
      h('p', { class: 'phu' }, mo));
  return h('section', { class: 'sap-ra-mat' },
    h('h2', {}, 'Coming soon'),
    h('div', { class: 'sap-ra-luoi' },
      the('binhThiNghiem', 'GeoLab', 'Ứng dụng mô phỏng môn Cơ học đất, giúp bạn nhìn thấy kiến thức vận hành thay vì chỉ đọc công thức. Sắp ra mắt, đón chờ nhé.', 'sap-ra-xanh'),
      the('laBan', 'Orientation & English Study Tips', 'Định hướng cho tương lai và mẹo học tiếng Anh, sắp ra mắt.', 'sap-ra-vang')));
}

// Thẻ tóm tắt luật của tuần, đặt ở cột phụ để màn rộng không bị trống.
function theLuatTuan(tt: TuanHienTai): HTMLElement {
  const yc = tt.yeuCau ?? { soMon: 3, soCauMoiMon: 5 };
  const cfg = tt.thi ?? { soMonThi: 2, soCauMoiMonThi: 20, thoiGianPhut: 40 };
  const dong = (bieuTuong: string, tieuDe: string, mo: string): HTMLElement =>
    h('div', { class: 'luat-dong' }, icon(bieuTuong, 20) as unknown as HTMLElement, h('div', {}, h('div', { class: 'mon-ten' }, tieuDe), h('div', { class: 'phu nho' }, mo)));
  return h('div', { class: 'card the-luat' },
    h('span', { class: 'nhan-muc' }, 'Luật của tuần'),
    dong('but', `Nộp ${yc.soMon * yc.soCauMoiMon} câu hỏi`, `${yc.soMon} môn, mỗi môn ${yc.soCauMoiMon} câu. Nộp đủ mới được vào phòng thi.`),
    dong('dongHo', `Thi ${cfg.soMonThi * cfg.soCauMoiMonThi} câu trong ${cfg.thoiGianPhut} phút`, `Tự chọn ${cfg.soMonThi} môn lúc vào thi, mỗi người thi một lần.`),
    dong('cup', 'Điểm nhóm và cấp bậc', 'Điểm nhóm là trung bình của cả nhóm. Nhóm đứng đầu tuần được cộng điểm thưởng.'));
}

// ---------- Form nộp câu hỏi ----------

const cauTrong = (): CauNhap => ({ maChuong: '', trangNguon: '', noiDung: '', A: '', B: '', C: '', D: '', dapAn: '', giaiThich: '' });

export async function veNopCauHoi(goc: HTMLElement): Promise<void> {
  dungDongHo();
  xoaHet(goc);
  goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, icon('trai', 16) as unknown as HTMLElement, 'Sự kiện'), h('h1', {}, 'Nộp câu hỏi'), h('p', { class: 'phu' }, 'Đang tải...'));
  const tt = await goi<TuanHienTai>('tuanHienTai');
  datGioMayChu(tt.now);
  xoaHet(goc);
  goc.append(h('a', { class: 'quay-lai', href: '#/su-kien' }, icon('trai', 16) as unknown as HTMLElement, 'Sự kiện'), h('h1', {}, 'Nộp câu hỏi'));
  if (!tt.tuan || tt.tuan.trangThai !== 'nop_cau_hoi') {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Hiện không trong thời gian nhận câu hỏi.')));
    return;
  }
  if (tt.mien) {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'phu' }, 'Bạn đang xin miễn tuần này. Hủy xin miễn ở trang Sự kiện nếu muốn nộp.')));
    return;
  }
  const mon = tt.mon ?? [];
  const yc = tt.yeuCau!;
  if (!mon.length) {
    goc.append(h('div', { class: 'card' }, h('p', { class: 'loi' }, 'Học kỳ chưa có môn nào. Báo lớp trưởng.')));
    return;
  }

  // Ưu tiên bản nháp đã lưu trên máy chủ. Nếu đã nộp rồi thì nạp câu đã nộp để sửa.
  let ban: BanNhap = { monChon: [], cau: {} };
  const nhap = await goi<{ duLieu: BanNhap | null }>('nhapLay');
  if (nhap.duLieu && Array.isArray(nhap.duLieu.monChon)) ban = nhap.duLieu;
  else if ((tt.soCauDaNop ?? 0) > 0) {
    const daNop = (await goi<CauCuaToi[]>('cauHoiCuaToi')).filter((c) => c.soTuan === tt.tuan!.soTuan);
    daNop.forEach((c) => {
      const m = mon.find((x) => x.ten === c.tenMon);
      if (!m) return;
      if (!ban.monChon.includes(m.ma)) ban.monChon.push(m.ma);
      (ban.cau[m.ma] ??= []).push({ maChuong: c.maChuong, trangNguon: c.trangNguon, noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich });
    });
    thongBao('Đã nạp các câu bạn nộp trước đó để sửa.');
  }

  const trangThaiLuu = h('div', { class: 'phu nho trang-thai-luu' }, '');
  let hen = 0;
  const luuNhap = (): void => {
    clearTimeout(hen);
    trangThaiLuu.textContent = 'Đang chờ lưu nháp...';
    hen = window.setTimeout(async () => {
      try {
        await goi('nhapLuu', { duLieu: ban });
        trangThaiLuu.textContent = 'Đã lưu nháp';
      } catch {
        trangThaiLuu.textContent = 'Chưa lưu được nháp, kiểm tra mạng';
      }
    }, 1500);
  };

  const vungChonMon = h('div', { class: 'card' });
  const vungCau = h('div', {});
  const vungLoi = h('pre', { class: 'loi hop-loi' });
  vungLoi.hidden = true;

  const veChonMon = (): void => {
    xoaHet(vungChonMon);
    vungChonMon.append(h('h3', {}, `Bước 1. Chọn ${yc.soMon} môn`));
    mon.forEach((m) => {
      const o = h('input', { type: 'checkbox', id: `mon-${m.ma}`, checked: ban.monChon.includes(m.ma) }) as HTMLInputElement;
      o.addEventListener('change', () => {
        if (o.checked) {
          if (ban.monChon.length >= yc.soMon) {
            o.checked = false;
            thongBao(`Chỉ chọn đúng ${yc.soMon} môn`, 'loi');
            return;
          }
          ban.monChon.push(m.ma);
          ban.cau[m.ma] = ban.cau[m.ma] ?? Array.from({ length: yc.soCauMoiMon }, cauTrong);
        } else ban.monChon = ban.monChon.filter((x) => x !== m.ma);
        veCau();
        luuNhap();
      });
      vungChonMon.append(h('label', { class: 'dong-chon', for: `mon-${m.ma}`, style: mauMon(m.mau) }, o, h('span', {}, m.ten)));
    });
  };

  const o = (cau: CauNhap, truong: keyof CauNhap, nhan: string, dai = false): HTMLElement => {
    const el = (dai ? h('textarea', { class: 'o-nhap', rows: 3 }) : h('input', { class: 'o-nhap', type: 'text' })) as HTMLInputElement;
    el.value = cau[truong];
    el.addEventListener('input', () => { cau[truong] = el.value; luuNhap(); });
    return h('label', { class: 'nhan-o' }, nhan, el);
  };

  const veMon = (m: MonNop): HTMLElement => {
    const ds = (ban.cau[m.ma] ??= Array.from({ length: yc.soCauMoiMon }, cauTrong));
    while (ds.length < yc.soCauMoiMon) ds.push(cauTrong());
    const hop = h('details', { class: 'card card-mon', open: true, style: mauMon(m.mau) }, h('summary', {}, `${m.ten} (${yc.soCauMoiMon} câu)`));
    ds.slice(0, yc.soCauMoiMon).forEach((c, i) => {
      const chuong = m.chuong.length
        ? (() => {
            const s = h('select', { class: 'o-chon o-day', 'aria-label': 'Chương' }, h('option', { value: '' }, 'Chọn chương...'),
              ...m.chuong.map((x) => h('option', { value: x.ma, selected: c.maChuong === x.ma }, x.ten))) as HTMLSelectElement;
            s.addEventListener('change', () => { c.maChuong = s.value; luuNhap(); });
            return h('label', { class: 'nhan-o' }, 'Chương', s);
          })()
        : o(c, 'maChuong', 'Chương hoặc chủ đề');
      const radio = h('div', { class: 'dap-an-chon' }, ...['A', 'B', 'C', 'D'].map((k) => {
        const r = h('input', { type: 'radio', name: `da-${m.ma}-${i}`, value: k, checked: c.dapAn === k }) as HTMLInputElement;
        r.addEventListener('change', () => { c.dapAn = k; luuNhap(); });
        return h('label', {}, r, ` ${k}`);
      }));
      hop.append(h('div', { class: 'cau' },
        h('h4', {}, `Câu ${i + 1}`), chuong, o(c, 'trangNguon', 'Trang hoặc slide nguồn (ví dụ tr. 12)'), o(c, 'noiDung', 'Nội dung câu hỏi', true),
        o(c, 'A', 'Đáp án A'), o(c, 'B', 'Đáp án B'), o(c, 'C', 'Đáp án C'), o(c, 'D', 'Đáp án D'),
        h('div', { class: 'nhan-o' }, 'Đáp án đúng'), radio, o(c, 'giaiThich', 'Giải thích ngắn (không bắt buộc)', true)));
    });
    return hop;
  };

  const veCau = (): void => {
    xoaHet(vungCau);
    ban.monChon.forEach((ma) => {
      const m = mon.find((x) => x.ma === ma);
      if (m) vungCau.append(veMon(m));
    });
    if (ban.monChon.length === yc.soMon) {
      vungCau.append(
        h('button', { class: 'nut', onclick: async (ev: Event) => {
          const nut = ev.target as HTMLButtonElement;
          nut.disabled = true;
          vungLoi.hidden = true;
          try {
            clearTimeout(hen);
            const cauHoi = ban.monChon.flatMap((ma) => (ban.cau[ma] ?? []).slice(0, yc.soCauMoiMon).map((c) => ({ ...c, maMon: ma })));
            const kq = await goi<{ choDuyet?: boolean }>('nopCauHoi', { cauHoi });
            thongBao(kq.choDuyet ? 'Đã nộp câu hỏi, chờ chủ lớp duyệt trước khi vào đề' : 'Đã nộp câu hỏi');
            location.hash = '#/su-kien';
          } catch (e) {
            vungLoi.textContent = (e as LoiApi).message;
            vungLoi.hidden = false;
            vungLoi.scrollIntoView({ block: 'center' });
          } finally {
            nut.disabled = false;
          }
        } }, 'Nộp tất cả'),
        vungLoi, trangThaiLuu);
    } else if (ban.monChon.length > 0) {
      vungCau.append(h('p', { class: 'phu' }, `Chọn thêm ${yc.soMon - ban.monChon.length} môn để nộp.`), trangThaiLuu);
    }
  };

  // Nhờ AI soạn: tải file prompt mẫu, đưa cho AI cùng tài liệu, rồi dán câu trả lời vào đây.
  const theAi = (): HTMLElement => {
    const vungKq = h('div', {});
    const o = h('textarea', { class: 'o-nhap', rows: 6, placeholder: 'Dán toàn bộ câu trả lời của AI vào đây' }) as HTMLTextAreaElement;
    const tai = (): void => {
      const chon = ban.monChon.map((ma) => mon.find((m) => m.ma === ma)).filter((m): m is MonNop => !!m);
      const dung = chon.length ? chon : mon;
      taiXuong('prompt-soan-cau-hoi.md', taoPromptMd(dung, yc.soCauMoiMon), 'text/markdown');
      thongBao(chon.length ? `Đã tải file mẫu cho ${chon.length} môn bạn chọn` : 'Đã tải file mẫu cho tất cả các môn');
    };
    const nhap = (): void => {
      xoaHet(vungKq);
      const kq = docCauHoiTuAi(o.value, mon, yc.soCauMoiMon);
      const canhBao = [...kq.canhBaoChung];
      let daNhap = 0;
      kq.mon.forEach((m) => {
        if (!ban.monChon.includes(m.ma)) {
          if (ban.monChon.length >= yc.soMon) { canhBao.push(`Môn "${m.ten}" bị bỏ qua vì bạn đã chọn đủ ${yc.soMon} môn khác.`); return; }
          ban.monChon.push(m.ma);
        }
        const ds = m.cau.slice();
        while (ds.length < yc.soCauMoiMon) ds.push(cauTrong());
        ban.cau[m.ma] = ds;
        daNhap += m.cau.length;
        m.canhBao.forEach((c) => canhBao.push(`${m.ten}: ${c}`));
      });
      if (daNhap > 0) { veChonMon(); veCau(); luuNhap(); }
      vungKq.append(
        h('p', { class: daNhap ? 'tt-tot' : 'loi' }, daNhap ? `Đã nhập ${daNhap} câu vào form bên dưới. Hãy kiểm tra từng câu với tài liệu gốc rồi bấm Nộp tất cả.` : 'Chưa nhập được câu nào.'),
        ...(canhBao.length ? [h('ul', { class: 'loi nho' }, ...canhBao.map((c) => h('li', {}, c)))] : []));
    };
    return h('details', { class: 'card the-ai' },
      h('summary', {}, 'Dùng AI soạn câu hỏi (tải file mẫu, dán kết quả)'),
      h('ol', { class: 'huong-dan' },
        h('li', {}, 'Chọn môn ở Bước 1, rồi bấm "Tải file prompt mẫu". File .md có sẵn mẫu 5 câu mỗi môn.'),
        h('li', {}, 'Mở AI (ChatGPT, Claude, Gemini...), bỏ file .md này vào.'),
        h('li', {}, 'Đưa thêm tài liệu tham khảo (PDF, slide, giáo trình) của đúng môn và chương.'),
        h('li', {}, 'Nói rõ môn và chương, ví dụ: "Soạn câu hỏi theo file mẫu cho môn Khoa học dữ liệu, chương 2, dựa trên tài liệu đính kèm".'),
        h('li', {}, 'Sao chép câu trả lời của AI, dán vào ô bên dưới, bấm "Nhập vào form", rồi kiểm tra lại và nộp.')),
      h('button', { class: 'nut', type: 'button', onclick: tai }, 'Tải file prompt mẫu (.md)'),
      h('label', { class: 'nhan-o' }, 'Dán câu hỏi từ AI', o),
      h('button', { class: 'nut nut-phu', type: 'button', onclick: nhap }, 'Nhập vào form'),
      vungKq,
      h('p', { class: 'phu nho' }, 'AI có thể nhầm hoặc bịa. Bạn chịu trách nhiệm đối chiếu từng câu với tài liệu trước khi nộp.'));
  };

  goc.append(
    h('div', { class: 'card' }, h('p', {}, 'Mỗi câu gồm nội dung, 4 đáp án khác nhau, đáp án đúng và trang hoặc slide nguồn. Không trùng với câu đã có. Bản nháp tự lưu trên máy chủ, bạn thoát ra vào lại vẫn còn.')),
    vungChonMon, theAi(), vungCau);
  veChonMon();
  veCau();
}
