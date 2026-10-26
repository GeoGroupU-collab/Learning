import './style.css';
import { CONFIG, DEV_MOCK, chuaCauHinh } from './config';
import { goi, LoiApi } from './api';
import { daDangNhap, dangXuat, veNutDangNhap } from './auth';
import { h, xoaHet, thongBao } from './dom';
import { layManifest, veBaiHoc, veDanhSachBai, veDanhSachMon, laMoi } from './views/bai-hoc';
import { veNhom } from './views/nhom';
import { veQuanTri } from './views/quan-tri';
import { veSuKien, veNopCauHoi } from './views/su-kien';
import { veCauHoiCuaToi } from './views/cau-hoi-cua-toi';
import { dungDongHo, datGioMayChu, demNguoc, dinhDangNgay } from './gio';
import type { TuanHienTai } from './types';
import type { Me } from './types';

const goc = document.getElementById('app') as HTMLElement;
let me: Me | null = null;

function laTrinhDuyetTrongUngDung(): boolean {
  return /(Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram)/i.test(navigator.userAgent);
}

function manHinhDon(...con: (Node | string)[]): void {
  xoaHet(goc);
  goc.append(h('main', { class: 'man-giua' }, h('div', { class: 'card card-giua' }, ...con)));
}

function canhBaoTrinhDuyet(): void {
  manHinhDon(
    h('h1', {}, 'Hãy mở bằng Chrome hoặc Safari'),
    h('p', {}, 'Google không cho đăng nhập trong trình duyệt của Zalo, Facebook, Messenger hay Instagram. Bấm sao chép link, rồi dán vào Chrome hoặc Safari.'),
    h('button', {
      class: 'nut',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          thongBao('Đã sao chép link');
        } catch {
          prompt('Sao chép link này:', location.href);
        }
      },
    }, 'Sao chép link')
  );
}

function manHinhDangNhap(): void {
  const khungNut = h('div', { class: 'khung-nut' });
  manHinhDon(
    h('h1', {}, CONFIG.TEN_WEB),
    h('p', { class: 'phu' }, 'Đăng nhập bằng tài khoản Google đã đăng ký với lớp trưởng.'),
    khungNut,
    h('p', { class: 'phu nho' }, 'Web chỉ đọc email, tên và ảnh đại diện. Xem thông báo quyền riêng tư ở Form đăng ký.')
  );
  if (DEV_MOCK) {
    khungNut.append(h('button', { class: 'nut', onclick: () => khoiDong() }, 'Đăng nhập thử (chế độ phát triển)'));
    return;
  }
  veNutDangNhap(khungNut, () => khoiDong()).catch((e: Error) => khungNut.append(h('p', { class: 'loi' }, e.message)));
}

function manHinhChuaDuyet(thongDiep: string): void {
  manHinhDon(
    h('h1', {}, 'Chưa vào được'),
    h('p', {}, thongDiep),
    h('button', { class: 'nut nut-phu', onclick: () => { dangXuat(); manHinhDangNhap(); } }, 'Đăng nhập tài khoản khác')
  );
}

async function khoiDong(): Promise<void> {
  manHinhDon(h('p', { class: 'phu' }, 'Đang kiểm tra tài khoản...'));
  try {
    me = await goi<Me>('me');
  } catch (e) {
    const loi = e as LoiApi;
    if (loi.ma === 'chua_duyet') return manHinhChuaDuyet(loi.message);
    if (loi.ma === 'token_expired' || loi.ma === 'unauthorized') return manHinhDangNhap();
    return manHinhChuaDuyet(loi.message);
  }
  veKhung();
  dinhTuyen();
}

// ---------- Khung chính và định tuyến ----------

const MUC_DUOI: [string, string, string][] = [
  ['#/', 'Trang chủ', '⌂'],
  ['#/bai-hoc', 'Bài học', '▤'],
  ['#/su-kien', 'Sự kiện', '✦'],
  ['#/nhom', 'Nhóm', '☰'],
  ['#/xep-hang', 'Xếp hạng', '★'],
];

let vungNoiDung: HTMLElement;
let thanhDuoi: HTMLElement;

function veKhung(): void {
  xoaHet(goc);
  vungNoiDung = h('main', { class: 'noi-dung' });
  thanhDuoi = h('nav', { class: 'thanh-duoi', 'aria-label': 'Điều hướng chính' },
    ...MUC_DUOI.map(([href, ten, bieuTuong]) => h('a', { href, 'data-href': href }, h('span', { class: 'bt', 'aria-hidden': 'true' }, bieuTuong), h('span', {}, ten))));
  const laQuanTri = me!.vaiTro !== 'member';
  goc.append(
    h('header', { class: 'dau-trang' },
      h('a', { class: 'logo', href: '#/' }, CONFIG.TEN_WEB),
      h('div', { class: 'hang-nut' },
        laQuanTri ? h('a', { class: 'nut nut-phu nho', href: '#/quan-tri/thanh-vien' }, 'Quản trị') : null,
        h('a', { class: 'nut nut-phu nho', href: '#/cai-dat' }, 'Tài khoản'))),
    vungNoiDung,
    thanhDuoi
  );
}

function danhDauMuc(hash: string): void {
  const goc2 = hash.split('/').slice(0, 2).join('/') || '#/';
  const khop = hash.startsWith('#/doc') ? '#/bai-hoc' : goc2 === '#' ? '#/' : goc2;
  thanhDuoi.querySelectorAll('a').forEach((a) => a.classList.toggle('dang', a.getAttribute('data-href') === khop));
}

async function dinhTuyen(): Promise<void> {
  if (!me) return;
  const hash = location.hash || '#/';
  const [, muc = '', a = '', b = '', c = ''] = hash.split('/');
  danhDauMuc(hash);
  dungDongHo();
  window.scrollTo(0, 0);
  const hk = me.hocKy?.maHocKy ?? null;
  try {
    switch (muc) {
      case '':
        return await veTrangChu(vungNoiDung);
      case 'bai-hoc':
        return a && b ? await veDanhSachBai(vungNoiDung, a, b) : await veDanhSachMon(vungNoiDung, hk);
      case 'doc':
        return veBaiHoc(vungNoiDung, a, b, decodeURIComponent(c));
      case 'nhom':
        return await veNhom(vungNoiDung, me);
      case 'su-kien':
        return a === 'nop' ? await veNopCauHoi(vungNoiDung) : await veSuKien(vungNoiDung);
      case 'cau-hoi':
        return await veCauHoiCuaToi(vungNoiDung);
      case 'xep-hang':
        return veSapCo('Xếp hạng', 'Bảng xếp hạng nhóm sẽ hiện sau khi có điểm của sự kiện đầu tiên.');
      case 'quan-tri':
        if (me.vaiTro === 'member') return veSapCo('Quản trị', 'Bạn không có quyền vào trang này.');
        return await veQuanTri(vungNoiDung, me, a || 'thanh-vien');
      case 'cai-dat':
        return veCaiDat(vungNoiDung);
      default:
        return veSapCo('Không tìm thấy trang', 'Đường dẫn này không tồn tại.');
    }
  } catch (e) {
    xoaHet(vungNoiDung);
    vungNoiDung.append(h('p', { class: 'loi' }, (e as Error).message));
  }
}

function veSapCo(tieuDe: string, noiDung: string): void {
  xoaHet(vungNoiDung);
  vungNoiDung.append(h('h1', {}, tieuDe), h('div', { class: 'card' }, h('p', { class: 'phu' }, noiDung)));
}

async function veTrangChu(noi: HTMLElement): Promise<void> {
  xoaHet(noi);
  const m = me!;
  const theSuKien = h('a', { class: 'card', href: '#/su-kien' }, h('div', { class: 'phu nho' }, 'Sự kiện tuần này'), h('div', { class: 'mon-ten' }, 'Đang tải...'));
  noi.append(
    h('h1', {}, `Chào ${m.hoTen || 'bạn'}`),
    ...(m.hocKy ? [h('p', { class: 'phu' }, m.hocKy.tenHocKy)] : []),
    h('a', { class: 'card', href: '#/nhom' },
      h('div', { class: 'phu nho' }, 'Nhóm của tôi'),
      h('div', { class: 'mon-ten' }, m.nhom ? m.nhom.tenNhom : 'Chưa có nhóm'),
      h('div', { class: 'phu nho' }, m.nhom ? 'Xem thành viên và link Zalo' : 'Lớp trưởng sẽ chia nhóm sau khi đóng Form đăng ký')),
    theSuKien
  );
  void capNhatTheSuKien(theSuKien);
  const mf = await layManifest();
  const hk = mf.hocKy.find((x) => x.ma === m.hocKy?.maHocKy) ?? mf.hocKy[0];
  if (hk && hk.mon.length) {
    const luoi = h('div', { class: 'luoi' });
    hk.mon.forEach((mon) =>
      luoi.append(h('a', { class: 'card card-mon', href: `#/bai-hoc/${hk.ma}/${mon.ma}`, style: `--mau:${mon.mau || '#4cc9f0'}` },
        h('div', { class: 'mon-ten' }, mon.ten),
        mon.baiHoc.some((b) => laMoi(b.capNhat)) ? h('span', { class: 'nhan-moi' }, 'Mới cập nhật') : null)));
    noi.append(h('h2', {}, 'Các môn'), luoi);
  }
}

async function capNhatTheSuKien(the: HTMLElement): Promise<void> {
  xoaHet(the);
  try {
    const tt = await goi<TuanHienTai>('tuanHienTai');
    datGioMayChu(tt.now);
    const t = tt.tuan;
    the.append(h('div', { class: 'phu nho' }, 'Sự kiện tuần này'));
    if (!t) {
      the.append(h('div', { class: 'mon-ten' }, 'Chưa có lịch sự kiện'));
      return;
    }
    const canNop = tt.soCauCanNop ?? 0;
    const viec = tt.mien ? 'Bạn được miễn tuần này'
      : t.trangThai === 'nop_cau_hoi' ? ((tt.soCauDaNop ?? 0) >= canNop ? 'Đã nộp đủ câu hỏi' : `Cần nộp câu hỏi (${tt.soCauDaNop ?? 0}/${canNop})`)
      : t.trangThai === 'cho_mo_cua' ? 'Chờ mở phòng thi'
      : t.trangThai === 'mo' ? 'Phòng thi đang mở'
      : 'Tuần này đã đóng';
    the.append(h('div', { class: 'mon-ten' }, `Tuần ${t.soTuan}: ${viec}`));
    if (t.moc) {
      const so = h('div', { class: 'dem-nguoc nho-dem' });
      demNguoc(so, t.moc.luc);
      the.append(h('div', { class: 'phu nho' }, `${t.moc.nhan} (${dinhDangNgay(t.moc.luc)}) còn:`), so);
    }
  } catch (e) {
    the.append(h('div', { class: 'phu nho' }, 'Sự kiện tuần này'), h('div', { class: 'loi' }, (e as Error).message));
  }
}

function veCaiDat(noi: HTMLElement): void {
  xoaHet(noi);
  noi.append(
    h('h1', {}, 'Tài khoản'),
    h('div', { class: 'card' },
      h('div', { class: 'mon-ten' }, me!.hoTen),
      h('div', { class: 'phu nho' }, me!.email),
      h('a', { class: 'nut nut-phu', href: '#/cau-hoi' }, 'Câu hỏi của tôi'),
      h('button', { class: 'nut nut-nguy', onclick: () => { dangXuat(); me = null; location.hash = '#/'; manHinhDangNhap(); } }, 'Đăng xuất'))
  );
}

// ---------- Khởi động ----------

window.addEventListener('hashchange', () => void dinhTuyen());

if (laTrinhDuyetTrongUngDung()) canhBaoTrinhDuyet();
else if (!DEV_MOCK && chuaCauHinh())
  manHinhDon(h('h1', {}, 'Chưa cấu hình'), h('p', {}, 'Cần điền GOOGLE_CLIENT_ID và API_URL trong src/config.ts (xem HUONG-DAN-CHU.md, Phần 2).'));
else if (DEV_MOCK || daDangNhap()) void khoiDong();
else manHinhDangNhap();
