import { goi, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import { taiXuong } from '../csv';
import { csvDe, htmlDe, jsonDe } from '../xuat-de';
import type { CauDe, CauNganHang, DeThiDayDu, DeThiTomTat, KetQuaNganHang, MonQuanTri, TuanQuanTri } from '../types';

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

const NHAN_TT: Record<string, string> = { nhap: 'Nháp', phat_hanh: 'Đã phát hành', luu_tru: 'Lưu trữ' };

function moBanIn(html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function tenFile(ten: string): string {
  return ten.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'de-thi';
}

export async function veDeThi(noi: HTMLElement): Promise<void> {
  noi.append(khungCho(2));
  let mon: MonQuanTri[];
  let tuan: TuanQuanTri[];
  try {
    [mon, tuan] = await Promise.all([
      goi<{ mon: MonQuanTri[] }>('admin.dsMon').then((r) => r.mon),
      goi<{ tuan: TuanQuanTri[] }>('admin.dsTuan').then((r) => r.tuan),
    ]);
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(noi);

  // ----- Trạng thái đề đang soạn -----
  let idDeDangSua: string | null = null;
  let cau: CauDe[] = [];
  const tenMon = new Map(mon.map((m) => [m.ma, m.ten]));

  const vungDs = h('div', {});
  const vungXay = h('div', {});
  const vungCau = h('div', {});
  const vungThieu = h('div', {});
  const oTen = h('input', { class: 'o-nhap', type: 'text', placeholder: 'Ví dụ: Đề chung kết học kỳ 1', maxlength: 80 }) as HTMLInputElement;

  // ----- Danh sách đề đã lưu -----
  const taiDs = async (): Promise<void> => {
    xoaHet(vungDs);
    vungDs.append(khungCho(1));
    try {
      const ds = await goi<DeThiTomTat[]>('admin.dsDeThi');
      xoaHet(vungDs);
      vungDs.append(h('h2', {}, `Đề đã lưu (${ds.length})`));
      if (!ds.length) vungDs.append(h('p', { class: 'phu' }, 'Chưa có đề nào. Tạo đề mới ở bên dưới.'));
      ds.forEach((d) => vungDs.append(theDe(d)));
    } catch (e) {
      xoaHet(vungDs);
      vungDs.append(h('p', { class: 'loi' }, (e as Error).message));
    }
  };

  const layDe = async (idDe: string): Promise<DeThiDayDu | null> => {
    try { return await goi<DeThiDayDu>('admin.layDeThi', { idDe }); } catch (e) { baoLoi(e); return null; }
  };

  const theDe = (d: DeThiTomTat): HTMLElement => {
    const chonTuan = h('select', { class: 'o-chon', 'aria-label': 'Gán cho tuần' },
      h('option', { value: '' }, 'Chọn tuần...'),
      ...tuan.map((t) => h('option', { value: t.soTuan, disabled: Date.now() >= t.moCua }, `Tuần ${t.soTuan}${Date.now() >= t.moCua ? ' (đã mở cửa)' : ''}`))) as HTMLSelectElement;
    const xuat = (kieu: 'json' | 'csv' | 'de' | 'dapan' | 'in-de' | 'in-dapan') => async (): Promise<void> => {
      const day = await layDe(d.idDe);
      if (!day) return;
      const f = tenFile(day.tenDe);
      if (kieu === 'json') taiXuong(`${f}.json`, jsonDe(day), 'application/json');
      else if (kieu === 'csv') taiXuong(`${f}.csv`, csvDe(day), 'text/csv');
      else if (kieu === 'de') taiXuong(`${f}-de.html`, htmlDe(day, false), 'text/html');
      else if (kieu === 'dapan') taiXuong(`${f}-dap-an.html`, htmlDe(day, true), 'text/html');
      else moBanIn(htmlDe(day, kieu === 'in-dapan', true));
    };
    return h('details', { class: 'card' },
      h('summary', {}, h('span', {}, `${d.tenDe} · ${d.soCau} câu`), h('span', { class: d.trangThai === 'phat_hanh' ? 'nhan' : 'nhan nhan-xam' }, NHAN_TT[d.trangThai])),
      d.tuanGan ? h('p', { class: 'tt-tot' }, `Đang là đề cố định của tuần ${d.tuanGan}.`) : null,
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut nho', onclick: async () => {
          const day = await layDe(d.idDe);
          if (!day) return;
          idDeDangSua = day.idDe;
          cau = day.cau;
          oTen.value = day.tenDe;
          veCau();
          vungXay.scrollIntoView({ behavior: 'smooth' });
        } }, 'Mở để sửa'),
        d.trangThai === 'phat_hanh'
          ? h('button', { class: 'nut nut-phu nho', onclick: async () => { try { await goi('admin.doiTrangThaiDe', { idDe: d.idDe, trangThai: 'luu_tru' }); thongBao('Đã gỡ phát hành'); await taiDs(); } catch (e) { baoLoi(e); } } }, 'Gỡ phát hành')
          : h('button', { class: 'nut nut-phu nho', onclick: async () => { try { await goi('admin.doiTrangThaiDe', { idDe: d.idDe, trangThai: 'phat_hanh' }); thongBao('Đã phát hành cho thành viên'); await taiDs(); } catch (e) { baoLoi(e); } } }, 'Phát hành cho thành viên')),
      h('div', { class: 'hang-nut' }, chonTuan,
        h('button', { class: 'nut nut-phu nho', onclick: async () => {
          if (!chonTuan.value) { thongBao('Hãy chọn tuần', 'loi'); return; }
          try { await goi('admin.ganDeChoTuan', { soTuan: Number(chonTuan.value), idDe: d.idDe }); thongBao(`Đã gán làm đề cố định của tuần ${chonTuan.value}`); await taiDs(); } catch (e) { baoLoi(e); }
        } }, 'Gán làm đề sự kiện'),
        d.tuanGan ? h('button', { class: 'nut nut-nguy nho', onclick: async () => { try { await goi('admin.ganDeChoTuan', { soTuan: d.tuanGan, idDe: '' }); thongBao('Đã bỏ gán'); await taiDs(); } catch (e) { baoLoi(e); } } }, 'Bỏ gán') : null),
      h('p', { class: 'phu nho' }, 'In ra PDF: bấm "In đề" hoặc "In đáp án", trong hộp thoại in chọn "Lưu dưới dạng PDF".'),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut nho', onclick: xuat('in-de') }, 'In đề'),
        h('button', { class: 'nut nho', onclick: xuat('in-dapan') }, 'In đáp án'),
        h('button', { class: 'nut nut-phu nho', onclick: xuat('de') }, 'Tải đề .html'),
        h('button', { class: 'nut nut-phu nho', onclick: xuat('dapan') }, 'Tải đáp án .html'),
        h('button', { class: 'nut nut-phu nho', onclick: xuat('json') }, 'JSON'),
        h('button', { class: 'nut nut-phu nho', onclick: xuat('csv') }, 'CSV')));
  };

  // ----- Xây đề: bộ lọc và phân bổ -----
  const soTuanLoc = h('input', { class: 'o-nhap', type: 'text', placeholder: 'Ví dụ: 1, 2 (để trống là mọi tuần)' }) as HTMLInputElement;
  const truTacGia = h('input', { class: 'o-nhap', type: 'text', placeholder: 'Email tác giả, cách nhau bằng dấu phẩy' }) as HTMLInputElement;
  const tranh = h('input', { type: 'checkbox', id: 'tranh-da-dung', checked: true }) as HTMLInputElement;
  const loc = (): { soTuan: number[]; truTacGia: string[]; tranhDaDung: boolean } => ({
    soTuan: soTuanLoc.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0),
    truTacGia: truTacGia.value.split(',').map((x) => x.trim()).filter((x) => x),
    tranhDaDung: tranh.checked,
  });

  const dongMon = mon.map((m) => {
    const dung = h('input', { type: 'checkbox', id: `de-mon-${m.ma}` }) as HTMLInputElement;
    const so = h('input', { class: 'o-nhap o-so-cau', type: 'number', min: 1, max: 200, value: 10, 'aria-label': `Số câu ${m.ten}` }) as HTMLInputElement;
    const chuong = new Set<string>();
    const vungChuong = h('div', { class: 'chuong-chon' }, ...m.chuong.map((c, i) => {
      const o = h('input', { type: 'checkbox', id: `de-ch-${m.ma}-${i}` }) as HTMLInputElement;
      o.addEventListener('change', () => { if (o.checked) chuong.add(c.ma); else chuong.delete(c.ma); });
      return h('label', { class: 'nhan-nho', for: `de-ch-${m.ma}-${i}` }, o, ` ${c.ten}`);
    }));
    return {
      m, dung, so, chuong,
      the: h('div', { class: 'card card-mon', style: `--mau:${m.mau || '#4cc9f0'}` },
        h('label', { class: 'dong-chon', for: `de-mon-${m.ma}` }, dung, h('span', {}, `${m.ten} (${m.soCau} câu)`)),
        h('label', { class: 'nhan-o' }, 'Số câu', so),
        m.chuong.length ? h('details', {}, h('summary', {}, 'Chỉ lấy một số chương (không chọn = tất cả)'), vungChuong) : null),
    };
  });

  const veCau = (): void => {
    xoaHet(vungCau);
    vungCau.append(h('h3', {}, `Các câu trong đề: ${cau.length}${idDeDangSua ? ' (đang sửa đề đã lưu)' : ''}`));
    if (!cau.length) vungCau.append(h('p', { class: 'phu' }, 'Chưa có câu nào. Rút ngẫu nhiên hoặc thêm thủ công.'));
    cau.forEach((c, i) => {
      vungCau.append(h('div', { class: 'card cau-xem' },
        h('div', { class: 'phu nho' }, `${i + 1}. ${c.tenMon}${c.maChuong ? ` · ${c.maChuong}` : ''} · tuần ${c.soTuan}${c.trangNguon ? ` · ${c.trangNguon}` : ''}`),
        h('p', { class: 'noi-dung-cau' }, c.noiDung),
        h('p', { class: 'phu nho' }, `Đáp án đúng: ${c.dapAn}. ${c[c.dapAn as 'A' | 'B' | 'C' | 'D']}`),
        h('div', { class: 'hang-nut' },
          h('button', { class: 'nut nut-phu nho', onclick: async () => {
            try {
              const r = await goi<{ cau: CauDe | null }>('admin.thayCauDe', { loc: loc(), maMon: c.maMon, chuong: c.maChuong ? [c.maChuong] : [], loaiTruId: cau.map((x) => x.id) });
              if (!r.cau) { thongBao('Không còn câu nào khác cùng môn và chương', 'loi'); return; }
              cau[i] = r.cau;
              veCau();
            } catch (e) { baoLoi(e); }
          } }, 'Thay câu khác'),
          h('button', { class: 'nut nut-nguy nho', onclick: () => { cau.splice(i, 1); veCau(); } }, 'Bỏ'),
          i > 0 ? h('button', { class: 'nut nut-phu nho', onclick: () => { [cau[i - 1], cau[i]] = [cau[i], cau[i - 1]]; veCau(); } }, '↑') : null)));
    });
  };

  const rut = async (): Promise<void> => {
    const phanBo = dongMon.filter((x) => x.dung.checked).map((x) => ({ maMon: x.m.ma, chuong: [...x.chuong], soCau: Number(x.so.value) }));
    if (!phanBo.length) { thongBao('Hãy tích chọn ít nhất một môn', 'loi'); return; }
    try {
      const r = await goi<{ cau: CauDe[]; thieu: { maMon: string; can: number; co: number }[]; soUngVien: number }>('admin.xemTruocDeThi', { phanBo, loc: loc() });
      cau = r.cau;
      veCau();
      xoaHet(vungThieu);
      if (r.thieu.length) vungThieu.append(h('p', { class: 'loi' }, `Không đủ câu: ${r.thieu.map((t) => `${tenMon.get(t.maMon) ?? t.maMon} cần ${t.can}, chỉ có ${t.co}`).join('; ')}.`));
      else thongBao(`Đã rút ${r.cau.length} câu`);
    } catch (e) { baoLoi(e); }
  };

  // ----- Thêm thủ công từ ngân hàng -----
  const vungTim = h('div', {});
  const timMon = h('select', { class: 'o-chon o-day' }, h('option', { value: '' }, 'Mọi môn'), ...mon.map((m) => h('option', { value: m.ma }, m.ten))) as HTMLSelectElement;
  const timTu = h('input', { class: 'o-nhap', type: 'search', placeholder: 'Từ khóa trong nội dung câu hỏi' }) as HTMLInputElement;
  const tim = async (): Promise<void> => {
    xoaHet(vungTim);
    try {
      const r = await goi<KetQuaNganHang>('admin.nganHang', { maMon: timMon.value, tuKhoa: timTu.value, trangThai: 'active', trang: 1 });
      vungTim.append(h('p', { class: 'phu nho' }, `${r.tong} câu phù hợp${r.tong > r.cauHoi.length ? `, hiện ${r.cauHoi.length} câu đầu, hãy thu hẹp từ khóa` : ''}.`));
      r.cauHoi.forEach((c: CauNganHang) => {
        const co = cau.some((x) => x.id === c.id);
        vungTim.append(h('div', { class: 'card cau-xem' },
          h('div', { class: 'phu nho' }, `${tenMon.get(c.maMon) ?? c.maMon}${c.maChuong ? ` · ${c.maChuong}` : ''} · tuần ${c.soTuan}`),
          h('p', {}, c.noiDung),
          h('button', { class: 'nut nut-phu nho', disabled: co, onclick: () => {
            cau.push({ ...c, tenMon: tenMon.get(c.maMon) ?? c.maMon });
            veCau();
            void tim();
          } }, co ? 'Đã có trong đề' : 'Thêm vào đề')));
      });
    } catch (e) { baoLoi(e); }
  };

  const luu = async (trangThai: 'nhap' | 'phat_hanh'): Promise<void> => {
    try {
      const r = await goi<{ idDe: string }>('admin.luuDeThi', { idDe: idDeDangSua ?? undefined, tenDe: oTen.value, dsIdCau: cau.map((c) => c.id), trangThai });
      idDeDangSua = r.idDe;
      thongBao(trangThai === 'phat_hanh' ? 'Đã lưu và phát hành' : 'Đã lưu đề');
      await taiDs();
    } catch (e) { baoLoi(e); }
  };

  vungXay.append(
    h('h2', {}, 'Tạo đề mới'),
    h('div', { class: 'card' }, h('h3', {}, '1. Chọn môn, số câu, chương'), ...dongMon.map((x) => x.the)),
    h('div', { class: 'card' }, h('h3', {}, '2. Bộ lọc'),
      h('label', { class: 'nhan-o' }, 'Chỉ lấy câu của các tuần', soTuanLoc),
      h('label', { class: 'nhan-o' }, 'Loại trừ tác giả', truTacGia),
      h('label', { class: 'dong-chon', for: 'tranh-da-dung' }, tranh, h('span', {}, 'Tránh câu đã dùng trong các đề trước')),
      h('p', { class: 'phu nho' }, 'Luôn chỉ lấy câu đang dùng (không lấy câu bị tạm loại hoặc xóa).'),
      h('button', { class: 'nut', onclick: () => void rut() }, 'Rút ngẫu nhiên')),
    vungThieu,
    vungCau,
    h('details', { class: 'card' }, h('summary', {}, 'Thêm câu thủ công từ ngân hàng'), timMon, timTu, h('button', { class: 'nut nut-phu', onclick: () => void tim() }, 'Tìm'), vungTim),
    h('div', { class: 'card' }, h('h3', {}, '3. Lưu đề'),
      h('label', { class: 'nhan-o' }, 'Tên đề', oTen),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut', onclick: () => void luu('nhap') }, 'Lưu nháp'),
        h('button', { class: 'nut nut-phu', onclick: () => void luu('phat_hanh') }, 'Lưu và phát hành cho thành viên'),
        h('button', { class: 'nut nut-nguy', onclick: () => { idDeDangSua = null; cau = []; oTen.value = ''; veCau(); } }, 'Làm lại từ đầu')),
      h('p', { class: 'phu nho' }, 'Đề phát hành: thành viên làm ở mục Tạo đề thi, lần đầu được +20 điểm, xem đáp án sau khi nộp. Đề gán cho một tuần: cả lớp thi cùng bộ câu trong phòng thi sự kiện.')));

  noi.append(vungDs, vungXay);
  veCau();
  await taiDs();
}
