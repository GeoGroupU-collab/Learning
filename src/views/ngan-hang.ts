import { goi, LoiApi } from '../api';
import { datHuyHieuDuyet, h, xoaHet, thongBao } from '../dom';
import { docCsv, taiXuong, taoCsv } from '../csv';
import { taoMarkdownChoDuyet } from '../xuat-cho-duyet';
import type { CauNganHang, DotChoDuyet, KetQuaNganHang, TuanHienTai, XemTruocNhap } from '../types';

interface HocKyTomTat { maHocKy: string; tenHocKy: string; trangThai: string }

const NHAN_TT: Record<string, string> = { cho_duyet: 'Chờ duyệt', active: 'Đang dùng', tu_choi: 'Bị từ chối', suspended: 'Tạm loại', removed: 'Đã xóa' };
const COT_XUAT = ['id', 'maHocKy', 'soTuan', 'maMon', 'maChuong', 'trangNguon', 'noiDung', 'A', 'B', 'C', 'D', 'dapAn', 'giaiThich', 'tacGia', 'trangThai', 'ghiChuDuyet', 'soBaoSai'];

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
  let dsHocKy: HocKyTomTat[] = [];
  try {
    dsHocKy = await goi<HocKyTomTat[]>('admin.dsHocKy');
  } catch {
    /* không có danh sách học kỳ thì chỉ lọc theo học kỳ đang mở */
  }
  const loc = { maHocKy: '', soTuan: '', maMon: '', trangThai: '', tacGia: '', tuKhoa: '', chiBaoSai: false, trang: 1 };
  const danhSach = h('div', {});
  const vungDuyet = h('div', {});
  const phanTrang = h('div', { class: 'hang' });

  const o = (nhan: string, el: HTMLElement): HTMLElement => h('label', { class: 'nhan-o' }, nhan, el);
  const hocKy = h('select', { class: 'o-chon o-day' }, h('option', { value: '' }, 'Học kỳ đang mở'), h('option', { value: '*' }, 'Tất cả học kỳ'),
    ...dsHocKy.filter((x) => x.trangThai === 'dong').map((x) => h('option', { value: x.maHocKy }, x.tenHocKy))) as HTMLSelectElement;
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
      veVungDuyet(kq.soChoDuyet);
      if (!loc.maHocKy) datHuyHieuDuyet(kq.soChoDuyet); // số trên nút Quản trị chỉ tính học kỳ đang mở
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

  // Duyệt hoặc từ chối: theo danh sách id (một câu) hoặc theo bộ lọc đang chọn (cả loạt).
  const quyetDinh = async (quyet: 'duyet' | 'tu_choi', dieuKien: { ids?: string[]; loc?: Record<string, string> }, lyDo = ''): Promise<void> => {
    try {
      const r = await goi<{ soCau: number }>('admin.duyetCau', { quyetDinh: quyet, lyDo, ...dieuKien });
      thongBao(quyet === 'duyet' ? `Đã duyệt ${r.soCau} câu` : `Đã từ chối ${r.soCau} câu`);
      await tai();
    } catch (e) { baoLoi(e); }
  };

  const tuChoi = (c: CauNganHang): void => {
    const lyDo = prompt('Lý do từ chối (người nộp sẽ thấy). Có thể để trống.', '');
    if (lyDo === null) return;
    void quyetDinh('tu_choi', { ids: [c.id] }, lyDo);
  };

  const xuatDot = async (kemThamKhao: boolean): Promise<void> => {
    try {
      const dot = await goi<DotChoDuyet>('admin.xuatChoDuyet', { kemThamKhao, maHocKy: loc.maHocKy });
      if (!dot.cho.length) { thongBao('Không có câu nào đang chờ duyệt'); return; }
      const ngay = new Date().toISOString().slice(0, 10);
      taiXuong(`cho-duyet-${ngay}.json`, JSON.stringify(dot, null, 2), 'application/json');
      taiXuong(`cho-duyet-${ngay}.md`, taoMarkdownChoDuyet(dot), 'text/markdown');
      thongBao(`Đã xuất ${dot.cho.length} câu chờ duyệt (2 tệp: .json và .md)`);
    } catch (e) { baoLoi(e); }
  };

  const veVungDuyet = (soCho: number): void => {
    xoaHet(vungDuyet);
    const kemThamKhao = h('input', { type: 'checkbox', id: 'kem-tham-khao', checked: true }) as HTMLInputElement;
    const nut: HTMLElement[] = [];
    if (soCho > 0) {
      nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => { trangThai.value = 'cho_duyet'; loc.trangThai = 'cho_duyet'; loc.trang = 1; void tai(); } }, 'Chỉ xem câu chờ duyệt'));
      nut.push(h('button', { class: 'nut nho', onclick: () => {
        const dk = { soTuan: loc.soTuan, maMon: loc.maMon, tacGia: loc.tacGia };
        const mota = [loc.soTuan && `tuần ${loc.soTuan}`, loc.maMon && `môn ${loc.maMon}`, loc.tacGia && `người nộp "${loc.tacGia}"`].filter(Boolean).join(', ') || 'tất cả';
        if (!confirm(`Duyệt mọi câu đang chờ duyệt thuộc bộ lọc: ${mota}?`)) return;
        void quyetDinh('duyet', { loc: dk });
      } }, 'Duyệt cả bộ lọc hiện tại'));
    }
    const khung: (HTMLElement | null)[] = [
      h('span', { class: 'nhan-muc' }, 'Duyệt câu hỏi'),
      h('p', {}, soCho > 0 ? `Có ${soCho} câu đang chờ duyệt. Câu chờ duyệt chưa vào đề nào.` : 'Không có câu nào đang chờ duyệt.'),
      nut.length ? h('div', { class: 'hang-nut' }, ...nut) : null,
    ];
    if (laChu) {
      khung.push(
        h('details', {}, h('summary', {}, 'Rà soát cả đợt bằng AI (xuất, nhập, dọn)'),
          h('p', { class: 'phu nho' }, 'Xuất đợt chờ duyệt ra hai tệp: .md để đọc và .json để ghi kết quả. Đưa cho AI kiểm tra trùng, dở, hay rồi nhận lại file kết quả, nhập ở mục "Xuất và nhập ngân hàng" bên dưới (có bước xem trước). Tác giả trong tệp chỉ hiện bằng mã T01, T02, không lộ email.'),
          h('label', { class: 'dong-chon', for: 'kem-tham-khao' }, kemThamKhao, h('span', {}, 'Kèm các câu đã duyệt để so trùng với ngân hàng')),
          h('div', { class: 'hang-nut' },
            h('button', { class: 'nut nho', disabled: soCho === 0, onclick: () => void xuatDot(kemThamKhao.checked) }, 'Xuất đợt chờ duyệt'),
            h('button', { class: 'nut nut-nguy nho', onclick: async () => {
              if (!confirm('Xóa hẳn mọi câu đang ở trạng thái "Bị từ chối" khỏi Sheet? Hãy chắc là đã lưu tệp rà soát. Câu đã duyệt và câu chờ duyệt không bị đụng tới.')) return;
              try {
                const r = await goi<{ soCau: number }>('admin.donCauTuChoi', { xacNhan: true });
                thongBao(`Đã xóa ${r.soCau} câu bị từ chối`);
                await tai();
              } catch (e) { baoLoi(e); }
            } }, 'Dọn câu bị từ chối'))));
    }
    vungDuyet.append(h('div', { class: 'card' }, ...khung));
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
    if (c.trangThai === 'cho_duyet') {
      nut.push(h('button', { class: 'nut nho', onclick: () => void quyetDinh('duyet', { ids: [c.id] }) }, 'Duyệt'));
      nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => tuChoi(c) }, 'Từ chối'));
    } else if (c.trangThai === 'active') nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => void doiTrangThai(c, 'suspended') }, 'Tạm loại'));
    else if (c.trangThai === 'suspended' || laChu) nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => void doiTrangThai(c, 'active') }, 'Khôi phục'));
    if (laChu) {
      nut.push(h('button', { class: 'nut nut-phu nho', onclick: () => { if (vungSua.firstChild) xoaHet(vungSua); else vungSua.append(theSua(c)); } }, 'Sửa'));
      if (c.trangThai !== 'removed') nut.push(h('button', { class: 'nut nut-nguy nho', onclick: () => void doiTrangThai(c, 'removed') }, 'Xóa'));
    }
    return h('div', { class: `card cau-xem ${c.trangThai !== 'active' ? 'cau-sai' : ''}` },
      h('div', { class: 'hang' },
        h('span', { class: 'phu nho' }, `Tuần ${c.soTuan} · ${c.maMon}${c.maChuong ? ` · ${c.maChuong}` : ''}${c.trangNguon ? ` · ${c.trangNguon}` : ''}`),
        h('span', { class: c.trangThai === 'active' ? 'nhan' : c.trangThai === 'cho_duyet' ? 'nhan nhan-vang' : 'nhan nhan-loi' }, NHAN_TT[c.trangThai] ?? c.trangThai)),
      h('p', { class: 'noi-dung-cau' }, c.noiDung),
      h('ul', { class: 'ds-dap-an' }, ...(['A', 'B', 'C', 'D'] as const).map((k) => h('li', { class: c.dapAn === k ? 'dung' : '' }, `${k}. ${c[k]}`))),
      c.giaiThich ? h('p', { class: 'phu nho' }, `Giải thích: ${c.giaiThich}`) : null,
      c.ghiChuDuyet ? h('p', { class: 'phu nho' }, `Ghi chú duyệt: ${c.ghiChuDuyet}`) : null,
      h('p', { class: 'phu nho' }, `Tác giả: ${c.tenTacGia || c.tacGia} (${c.tacGia}) · ${c.soBaoSai} lượt báo sai`),
      h('div', { class: 'hang-nut' }, ...nut), vungSua);
  };

  noi.append(
    vungDuyet,
    h('div', { class: 'card' }, h('h3', {}, 'Bộ lọc'),
      o('Học kỳ', hocKy), o('Tuần', soTuan), o('Môn', maMon), o('Trạng thái', trangThai), o('Tác giả', tacGia), o('Từ khóa', tuKhoa),
      h('label', { class: 'dong-chon', for: 'chi-bao-sai' }, chiBaoSai, h('span', {}, 'Chỉ câu đã bị báo sai')),
      h('button', { class: 'nut', onclick: () => {
        Object.assign(loc, { maHocKy: hocKy.value, soTuan: soTuan.value, maMon: maMon.value, trangThai: trangThai.value, tacGia: tacGia.value, tuKhoa: tuKhoa.value, chiBaoSai: chiBaoSai.checked, trang: 1 });
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
          ...(xem.soDuyet || xem.soTuChoi ? [h('p', {}, h('b', {}, `Trong đó sẽ duyệt ${xem.soDuyet ?? 0} câu và từ chối ${xem.soTuChoi ?? 0} câu.`))] : []),
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
      h('p', { class: 'phu nho' }, 'Xuất file (kèm trang nguồn) để đối chiếu với PDF bài giảng. Sửa xong chọn lại file, hệ thống khớp theo id, cho xem trước các thay đổi rồi mới áp dụng. Chỉ sửa được nội dung, đáp án, giải thích, trang nguồn, chương, trạng thái và ghi chú duyệt. Ở tệp rà soát, cột quyetDinh bằng duyet hoặc tu_choi sẽ duyệt hoặc từ chối câu đó.'),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut', onclick: () => void xuat('json') }, 'Xuất JSON'),
        h('button', { class: 'nut', onclick: () => void xuat('csv') }, 'Xuất CSV')),
      h('label', { class: 'nhan-o' }, 'Nhập bản đã sửa (.json hoặc .csv)', tep), vungXem));
  }
  noi.append(danhSach, phanTrang);
  await tai();
}
