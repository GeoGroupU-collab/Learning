import { goiNhanh } from '../api';
import { h, xoaHet } from '../dom';
import { icon } from '../icon';
import { mauMon } from '../mau';
import { khiRoiTrang } from '../gio';
import { QUYEN_KHUNG, apDungTinNhan, chenLopCachLy, docDuLieuBaiHoc } from '../bai-hoc-cach-ly';
import type { Manifest, MonHoc, TuanHienTai } from '../types';

let boNho: Manifest | null = null;

export async function layManifest(): Promise<Manifest> {
  if (boNho) return boNho;
  try {
    const res = await fetch(new URL('bai-hoc/manifest.json', document.baseURI).href, { cache: 'no-cache' });
    boNho = res.ok ? ((await res.json()) as Manifest) : { hocKy: [] };
  } catch {
    boNho = { hocKy: [] };
  }
  return boNho;
}

export function laMoi(capNhat: string): boolean {
  const t = Date.parse(capNhat);
  return !isNaN(t) && Date.now() - t < 7 * 86400000;
}

function theMon(hocKy: string, m: MonHoc): HTMLElement {
  const moi = m.baiHoc.some((b) => laMoi(b.capNhat));
  return h(
    'a',
    { class: 'card card-mon', href: `#/bai-hoc/${hocKy}/${m.ma}`, style: mauMon(m.mau) },
    h('div', {}, h('div', { class: 'mon-ten' }, m.ten), h('div', { class: 'mon-phu' }, `${m.baiHoc.length} bài học`)),
    moi ? h('span', { class: 'nhan-moi' }, 'Mới') : null
  );
}

// Thẻ Tự tạo đề: hiện khóa khi chưa nộp đủ câu hỏi của tuần (lấy từ tuần hiện tại, hiện ngay từ bản đã lưu rồi cập nhật).
function theTuTaoDe(): HTMLElement {
  const the = h('a', { class: 'card the-lien-ket', href: '#/tao-de' });
  const ve = (tt: TuanHienTai | null): void => {
    xoaHet(the);
    const can = tt?.soCauCanNop ?? 0;
    const da = tt?.soCauDaNop ?? 0;
    const khoa = !!tt && !!tt.khoaTaoDe;
    the.setAttribute('href', khoa ? '#/su-kien/nop' : '#/tao-de');
    the.classList.toggle('the-khoa-nho', khoa);
    the.append(icon(khoa ? 'khoa' : 'but', 22) as unknown as HTMLElement,
      h('div', {},
        h('div', { class: 'hang-the' }, h('div', { class: 'mon-ten' }, 'Tự tạo đề luyện tập'), khoa ? h('span', { class: 'nhan nhan-vang' }, 'Đang khóa') : null),
        h('div', { class: 'phu nho' }, khoa
          ? `Nộp đủ ${can} câu hỏi của tuần này (đã nộp ${da}/${can}) để mở khóa. Bấm để nộp câu hỏi.`
          : 'Chọn môn, chọn chương, làm đề 30 câu từ ngân hàng. Mỗi đề làm xong +20 điểm, tối đa 120 điểm mỗi tuần.')));
  };
  ve(null);
  void goiNhanh<TuanHienTai>('tuanHienTai', {}, (tt) => ve(tt)).catch(() => undefined);
  return the;
}

export async function veDanhSachMon(goc: HTMLElement, maHocKyDangMo: string | null): Promise<void> {
  xoaHet(goc);
  goc.append(h('h1', {}, 'Bài học'), theTuTaoDe());
  const mf = await layManifest();
  const hk = mf.hocKy.find((x) => x.ma === maHocKyDangMo) ?? mf.hocKy[0];
  if (!hk || hk.mon.length === 0) {
    goc.append(h('p', { class: 'phu' }, 'Chưa có bài học nào được đăng.'));
    return;
  }
  const luoi = h('div', { class: 'luoi' });
  hk.mon.forEach((m) => luoi.append(theMon(hk.ma, m)));
  goc.append(luoi);
}

export async function veDanhSachBai(goc: HTMLElement, maHocKy: string, maMon: string): Promise<void> {
  xoaHet(goc);
  const mf = await layManifest();
  const mon = mf.hocKy.find((x) => x.ma === maHocKy)?.mon.find((m) => m.ma === maMon);
  goc.append(h('a', { class: 'quay-lai', href: '#/bai-hoc' }, icon('trai', 16) as unknown as HTMLElement, 'Các môn'));
  if (!mon) {
    goc.append(h('p', { class: 'phu' }, 'Không tìm thấy môn này.'));
    return;
  }
  goc.append(h('h1', {}, mon.ten));
  if (mon.baiHoc.length === 0) goc.append(h('p', { class: 'phu' }, 'Môn này chưa có bài học.'));
  mon.baiHoc.forEach((b) =>
    goc.append(
      h(
        'a',
        { class: 'card card-mon', style: mauMon(mon.mau), href: `#/doc/${maHocKy}/${maMon}/${encodeURIComponent(b.file)}` },
        h('div', { class: 'mon-ten' }, b.ten),
        laMoi(b.capNhat) ? h('span', { class: 'nhan-moi' }, 'Mới') : null
      )
    )
  );
}

// Mở bài trong cùng tab ở chế độ toàn màn hình: ẩn thanh trên và thanh dưới của web, chỉ còn một thanh nhỏ có nút quay lại.
// Bài học chạy trong khung cách ly (xem bai-hoc-cach-ly.ts): không đọc được phiên đăng nhập, vẫn lưu được tiến độ.
export function veBaiHoc(goc: HTMLElement, maHocKy: string, maMon: string, file: string): void {
  xoaHet(goc);
  document.body.classList.add('dang-doc');
  const duongDan = `bai-hoc/${encodeURIComponent(maHocKy)}/${encodeURIComponent(maMon)}/${encodeURIComponent(file)}`;
  const urlBai = new URL(duongDan, document.baseURI).href;
  const khung = h('iframe', { class: 'khung-bai', title: 'Bài học', sandbox: QUYEN_KHUNG }) as HTMLIFrameElement;
  const nghe = (e: MessageEvent): void => {
    if (e.source !== khung.contentWindow) return; // chỉ nhận tin từ đúng khung bài học này
    try { apDungTinNhan(localStorage, e.data); } catch { /* bộ nhớ đầy hoặc bị chặn */ }
  };
  window.addEventListener('message', nghe);
  khiRoiTrang(() => {
    document.body.classList.remove('dang-doc');
    window.removeEventListener('message', nghe);
  });
  const thongBaoLoi = h('p', { class: 'loi', hidden: true }, 'Không tải được bài học. Kiểm tra mạng rồi thử lại.');
  goc.append(
    h('div', { class: 'thanh-doc' }, h('a', { class: 'quay-lai', href: `#/bai-hoc/${maHocKy}/${maMon}` }, icon('trai', 16) as unknown as HTMLElement, 'Quay lại')),
    thongBaoLoi,
    khung
  );
  void (async () => {
    try {
      const res = await fetch(urlBai, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      let duLieu: Record<string, string> = {};
      try { duLieu = docDuLieuBaiHoc(localStorage); } catch { /* không đọc được bộ nhớ thì bài học bắt đầu trống */ }
      khung.srcdoc = chenLopCachLy(await res.text(), duLieu, urlBai);
    } catch {
      thongBaoLoi.hidden = false;
    }
  })();
}
