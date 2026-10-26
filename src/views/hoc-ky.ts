import { goi, LoiApi } from '../api';
import { h, khungCho, xoaHet, thongBao } from '../dom';
import { taiXuong } from '../csv';
import { htmlTongKet } from '../xuat-de';
import type { HocKyTomTat, TongKetHocKy } from '../types';

function baoLoi(e: unknown): void {
  thongBao((e as LoiApi).message ?? 'Có lỗi xảy ra', 'loi');
}

function bang(tieuDe: string[], hang: (string | number)[][]): HTMLElement {
  const t = h('table', { class: 'bang' }, h('thead', {}, h('tr', {}, ...tieuDe.map((x) => h('th', {}, x)))));
  const tb = h('tbody', {}, ...hang.map((r) => h('tr', {}, ...r.map((c) => h('td', {}, String(c))))));
  t.append(tb);
  return h('div', { class: 'cuon-ngang' }, t);
}

function theTongKet(tk: TongKetHocKy): HTMLElement {
  const moBanIn = (): void => {
    const url = URL.createObjectURL(new Blob([htmlTongKet(tk)], { type: 'text/html;charset=utf-8' }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  return h('div', { class: 'card' },
    h('h3', {}, `Tổng kết ${tk.tenHocKy}`),
    h('p', { class: 'phu nho' }, `${tk.thongKe.soTuanDaChot} tuần · ${tk.thongKe.soThanhVien} thành viên · ${tk.thongKe.soCauHoi} câu hỏi · ${tk.thongKe.soLuotThi} lượt thi · ${tk.thongKe.soDeTuTao} đề tự tạo`),
    h('div', { class: 'card vinh-danh' }, h('div', { class: 'phu nho' }, 'Nhóm vô địch học kỳ'),
      h('div', { class: 'mon-ten' }, tk.nhomVoDich.length ? tk.nhomVoDich.map((n) => `${n.tenNhom} (${n.diem})`).join(', ') : 'Chưa có')),
    h('h4', {}, 'Xếp hạng nhóm (điểm lũy kế)'), bang(['Hạng', 'Nhóm', 'Điểm'], tk.bangNhom.map((n) => [n.hang, n.tenNhom, n.diem])),
    h('h4', {}, `Tham gia theo tuần (trung bình ${tk.thamGiaTrungBinh}%)`), bang(['Tuần', 'Đã thi', 'Tính', '%'], tk.tuan.map((t) => [t.soTuan, t.soThamGia, t.soTinh, t.tiLe])),
    h('h4', {}, 'Điểm thi trung bình cao nhất'), bang(['Tên', 'Điểm TB', 'Số tuần'], tk.topCaNhan.map((c) => [c.hoTen, c.diemTB, c.soTuan])),
    h('h4', {}, 'Cấp bậc cao nhất'), bang(['Tên', 'Cấp', 'Lv', 'Điểm'], tk.topCapBac.map((c) => [c.hoTen, c.tenCapLon, c.level, c.tong])),
    tk.danhHieu.length ? h('div', {}, h('h4', {}, 'Danh hiệu cá nhân của tuần'), bang(['Tên', 'Số lần'], tk.danhHieu.map((d) => [d.hoTen, d.soLan]))) : null,
    h('div', { class: 'hang-nut' },
      h('button', { class: 'nut', onclick: moBanIn }, 'In hoặc lưu PDF'),
      h('button', { class: 'nut nut-phu', onclick: () => taiXuong(`tong-ket-${tk.maHocKy}.json`, JSON.stringify(tk, null, 2), 'application/json') }, 'Tải JSON')));
}

export async function veHocKy(noi: HTMLElement, laChu: boolean): Promise<void> {
  noi.append(khungCho(2));
  let ds: HocKyTomTat[];
  try {
    ds = await goi<HocKyTomTat[]>('admin.dsHocKy');
  } catch (e) {
    xoaHet(noi);
    noi.append(h('p', { class: 'loi' }, (e as Error).message));
    return;
  }
  xoaHet(noi);
  const lamMoi = async (): Promise<void> => { xoaHet(noi); await veHocKy(noi, laChu); };
  const dangMo = ds.find((x) => x.trangThai === 'mo');

  noi.append(h('h2', {}, 'Học kỳ'));
  ds.forEach((x) => noi.append(h('div', { class: 'card hang' },
    h('div', {}, h('div', { class: 'mon-ten' }, x.tenHocKy), h('div', { class: 'phu nho' }, `${x.maHocKy}${x.batDau ? ` · từ ${x.batDau}` : ''}${x.ketThuc ? ` · đến ${x.ketThuc}` : ''}`)),
    h('span', { class: x.trangThai === 'mo' ? 'nhan' : 'nhan nhan-xam' }, x.trangThai === 'mo' ? 'Đang mở' : 'Đã kết thúc'))));
  if (!ds.length) noi.append(h('p', { class: 'phu' }, 'Chưa có học kỳ nào.'));

  if (dangMo && laChu) {
    // Thêm môn mới
    const ma = h('input', { class: 'o-nhap', type: 'text', placeholder: 'giai-tich-1', maxlength: 40 }) as HTMLInputElement;
    const ten = h('input', { class: 'o-nhap', type: 'text', placeholder: 'Giải tích 1', maxlength: 80 }) as HTMLInputElement;
    const mau = h('input', { class: 'o-nhap', type: 'color', value: '#4cc9f0', 'aria-label': 'Màu môn' }) as HTMLInputElement;
    const kq = h('div', {});
    noi.append(h('details', { class: 'card' }, h('summary', {}, 'Thêm môn mới vào học kỳ đang mở'),
      h('label', { class: 'nhan-o' }, 'Mã môn (chữ thường không dấu, dùng gạch ngang)', ma),
      h('label', { class: 'nhan-o' }, 'Tên môn', ten), h('label', { class: 'nhan-o' }, 'Màu', mau),
      h('button', { class: 'nut', onclick: async () => {
        try {
          const r = await goi<{ duongDan: string; monJson: string; maHocKy: string; maMon: string }>('admin.themMon', { maMon: ma.value, tenMon: ten.value, mau: mau.value });
          xoaHet(kq);
          kq.append(h('p', { class: 'tt-tot' }, 'Đã thêm môn. Để đăng bài học cho môn này, làm tiếp 2 bước:'),
            h('ol', { class: 'huong-dan' },
              h('li', {}, `Trên GitHub, tạo thư mục và file: ${r.duongDan}`),
              h('li', {}, 'Dán nội dung bên dưới vào file đó, rồi bấm Commit. Sau đó upload các file bài học .html vào cùng thư mục.')),
            h('pre', { class: 'khoi-ma' }, r.monJson),
            h('button', { class: 'nut nut-phu', onclick: async () => { try { await navigator.clipboard.writeText(r.monJson); thongBao('Đã sao chép'); } catch { thongBao('Không sao chép được, hãy bôi đen và copy tay', 'loi'); } } }, 'Sao chép nội dung mon.json'));
        } catch (e) { baoLoi(e); }
      } }, 'Thêm môn'), kq));

    // Kết thúc học kỳ
    noi.append(h('div', { class: 'card' }, h('h3', {}, 'Kết thúc học kỳ'),
      h('p', { class: 'phu nho' }, 'Chốt các tuần đã diễn ra, hủy các tuần chưa diễn ra, tính tổng kết (nhóm vô địch, thống kê tham gia, cá nhân nổi bật) và đóng học kỳ. Sau đó bạn tạo học kỳ mới. Nên sao lưu trước (tab Sao lưu).'),
      h('button', { class: 'nut nut-nguy', onclick: async () => {
        if (!confirm(`Kết thúc "${dangMo.tenHocKy}"?\n\nCác tuần chưa diễn ra sẽ bị hủy. Không hoàn tác được.`)) return;
        try { await goi('admin.ketThucHocKy', { xacNhan: true }); thongBao('Đã kết thúc học kỳ'); await lamMoi(); } catch (e) { baoLoi(e); }
      } }, 'Kết thúc học kỳ này')));
  }

  if (!dangMo && laChu) {
    const maHk = h('input', { class: 'o-nhap', type: 'text', placeholder: 'hk2-2026-2027', maxlength: 40 }) as HTMLInputElement;
    const tenHk = h('input', { class: 'o-nhap', type: 'text', placeholder: 'Học kỳ 2 năm học 2026-2027', maxlength: 80 }) as HTMLInputElement;
    const bd = h('input', { class: 'o-nhap', type: 'date' }) as HTMLInputElement;
    const kt = h('input', { class: 'o-nhap', type: 'date' }) as HTMLInputElement;
    const saoChep = h('input', { type: 'checkbox', id: 'sao-chep-mon', checked: true }) as HTMLInputElement;
    const giuNhom = h('input', { type: 'checkbox', id: 'giu-nhom' }) as HTMLInputElement;
    noi.append(h('div', { class: 'card' }, h('h3', {}, 'Tạo học kỳ mới'),
      h('p', { class: 'phu nho' }, 'Hiện không có học kỳ nào đang mở. Thành viên vẫn giữ nguyên danh sách; ngân hàng câu hỏi và lịch tuần của học kỳ mới bắt đầu trống.'),
      h('label', { class: 'nhan-o' }, 'Mã học kỳ (chữ thường không dấu)', maHk), h('label', { class: 'nhan-o' }, 'Tên học kỳ', tenHk),
      h('label', { class: 'nhan-o' }, 'Ngày bắt đầu (không bắt buộc)', bd), h('label', { class: 'nhan-o' }, 'Ngày kết thúc (không bắt buộc)', kt),
      h('label', { class: 'dong-chon', for: 'sao-chep-mon' }, saoChep, h('span', {}, 'Sao chép các môn và danh sách chương của học kỳ trước')),
      h('label', { class: 'dong-chon', for: 'giu-nhom' }, giuNhom, h('span', {}, 'Giữ nguyên nhóm cũ (không thì chia lại bằng Form GPA mới)')),
      h('button', { class: 'nut', onclick: async () => {
        try {
          const r = await goi<{ maHocKy: string; soMon: number; soNhom: number; thuMucBaiHoc: string }>('admin.taoHocKy', {
            maHocKy: maHk.value, tenHocKy: tenHk.value, batDau: bd.value, ketThuc: kt.value, saoChepMon: saoChep.checked, giuNhom: giuNhom.checked,
          });
          thongBao(`Đã tạo học kỳ, sao chép ${r.soMon} môn, ${r.soNhom} nhóm. Bài học để trong thư mục ${r.thuMucBaiHoc}`);
          await lamMoi();
        } catch (e) { baoLoi(e); }
      } }, 'Tạo học kỳ')));
  }

  const dong = ds.filter((x) => x.coTongKet);
  if (dong.length) {
    noi.append(h('h2', {}, 'Tổng kết các học kỳ đã kết thúc'));
    dong.forEach((x) => {
      const vung = h('div', {});
      noi.append(h('details', { class: 'card' }, h('summary', {}, x.tenHocKy), vung));
      let daTai = false;
      (vung.parentElement as HTMLDetailsElement).addEventListener('toggle', async (ev) => {
        if (!(ev.target as HTMLDetailsElement).open || daTai) return;
        daTai = true;
        try { vung.append(theTongKet(await goi<TongKetHocKy>('admin.tongKet', { maHocKy: x.maHocKy }))); } catch (e) { baoLoi(e); daTai = false; }
      });
    });
  }
}
