import './style.css';
import { CONFIG, DEV_MOCK, chuaCauHinh } from './config';
import { docCache, ghiCache, goi, LoiApi, xoaCache } from './api';
import { daDangNhap, dangXuat, layPhien, luuPhien, veNutDangNhap } from './auth';
import { h, khungCho, xoaHet, thongBao } from './dom';
import { layManifest, veBaiHoc, veDanhSachBai, veDanhSachMon, laMoi } from './views/bai-hoc';
import { veNhom } from './views/nhom';
import { veQuanTri } from './views/quan-tri';
import { veSuKien, veNopCauHoi } from './views/su-kien';
import { vePhongThi } from './views/phong-thi';
import { veXepHang } from './views/xep-hang';
import { veTaoDe } from './views/tao-de';
import { veXemLai } from './views/xem-lai';
import { veCauHoiCuaToi } from './views/cau-hoi-cua-toi';
import { theCap } from './cap';
import { dungDongHo, datGioMayChu, demNguoc, dinhDangNgay } from './gio';
import type { Me, TrangChuData } from './types';

const goc = document.getElementById('app') as HTMLElement;
let me: Me | null = null;
let duLieuTrangChu: TrangChuData | null = null;
let thoiDiemTaiTrangChu = 0;

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
  veNutDangNhap(khungNut, () => void doiLayPhien()).catch((e: Error) => khungNut.append(h('p', { class: 'loi' }, e.message)));
}

// Sau khi Google xác nhận, đổi lấy mã phiên dài hạn để lần sau khỏi đăng nhập lại.
async function doiLayPhien(): Promise<void> {
  manHinhDon(h('p', { class: 'phu' }, 'Đang đăng nhập...'));
  try {
    xoaCache(); // tránh hiện nhầm dữ liệu của người dùng trước trên cùng một máy
    const r = await goi<{ phien: string }>('dangNhap');
    luuPhien(r.phien);
  } catch (e) {
    return manHinhChuaDuyet((e as Error).message);
  }
  await khoiDong();
}

function manHinhChuaDuyet(thongDiep: string): void {
  manHinhDon(
    h('h1', {}, 'Chưa vào được'),
    h('p', {}, thongDiep),
    h('button', { class: 'nut nut-phu', onclick: () => { void thoat(); } }, 'Đăng nhập tài khoản khác')
  );
}

// Mở web nhanh: nếu đã có bản lưu của lần trước thì vẽ giao diện ngay, rồi hỏi máy chủ một yêu cầu duy nhất
// (trangChu) để cập nhật. Quyền thật sự luôn do máy chủ kiểm tra ở mỗi yêu cầu.
async function khoiDong(): Promise<void> {
  const cu = docCache<TrangChuData>('trangChu');
  let daVe = false;
  if (cu) {
    me = cu.me;
    duLieuTrangChu = cu;
    veKhung();
    void dinhTuyen();
    daVe = true;
  } else {
    xoaHet(goc);
    goc.append(h('main', { class: 'noi-dung' }, khungCho(3)));
  }
  try {
    const moi = await goi<TrangChuData>('trangChu');
    ghiCache('trangChu', {}, moi);
    const doiVaiTro = !me || me.vaiTro !== moi.me.vaiTro;
    me = moi.me;
    duLieuTrangChu = moi;
    thoiDiemTaiTrangChu = Date.now();
    datGioMayChu(moi.tuan.now);
    if (!daVe || doiVaiTro) {
      veKhung();
      void dinhTuyen();
    } else if ((location.hash || '#/') === '#/' || location.hash === '') {
      veTrangChu(vungNoiDung);
    }
  } catch (e) {
    const loi = e as LoiApi;
    if (loi.ma === 'chua_duyet') return manHinhChuaDuyet(loi.message);
    if (loi.ma === 'token_expired' || loi.ma === 'unauthorized' || loi.ma === 'phien_het_han') return manHinhDangNhap();
    if (daVe) {
      thongBao('Chưa cập nhật được, đang hiện dữ liệu lần trước.', 'loi');
      return;
    }
    return manHinhChuaDuyet(loi.message);
  }
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
        veTrangChu(vungNoiDung);
        if (Date.now() - thoiDiemTaiTrangChu > 20000) void lamMoiTrangChu();
        return;
      case 'bai-hoc':
        return a && b ? await veDanhSachBai(vungNoiDung, a, b) : await veDanhSachMon(vungNoiDung, hk);
      case 'doc':
        return veBaiHoc(vungNoiDung, a, b, decodeURIComponent(c));
      case 'nhom':
        return await veNhom(vungNoiDung, me);
      case 'su-kien':
        if (a === 'thi') return await vePhongThi(vungNoiDung);
        if (a === 'xem-lai') return await veXemLai(vungNoiDung, b ? Number(b) : null);
        return a === 'nop' ? await veNopCauHoi(vungNoiDung) : await veSuKien(vungNoiDung);
      case 'cau-hoi':
        return await veCauHoiCuaToi(vungNoiDung);
      case 'xep-hang':
        return await veXepHang(vungNoiDung, a === 'ca-nhan' ? 'ca-nhan' : 'nhom');
      case 'tao-de':
        return await veTaoDe(vungNoiDung);
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

// Làm mới dữ liệu trang chủ ở nền khi quay lại trang chủ sau một lúc.
async function lamMoiTrangChu(): Promise<void> {
  try {
    const moi = await goi<TrangChuData>('trangChu');
    ghiCache('trangChu', {}, moi);
    me = moi.me;
    duLieuTrangChu = moi;
    thoiDiemTaiTrangChu = Date.now();
    datGioMayChu(moi.tuan.now);
    if ((location.hash || '#/') === '#/') veTrangChu(vungNoiDung);
  } catch {
    /* giữ dữ liệu cũ */
  }
}

// Vẽ trang chủ ngay từ dữ liệu đã có, không cần chờ mạng (trừ danh sách bài học, tải riêng bên dưới).
function veTrangChu(noi: HTMLElement): void {
  dungDongHo();
  xoaHet(noi);
  const m = me!;
  const d = duLieuTrangChu;
  noi.append(
    h('h1', {}, `Chào ${m.hoTen || 'bạn'}`),
    ...(m.hocKy ? [h('p', { class: 'phu' }, m.hocKy.tenHocKy)] : []),
    h('a', { class: 'card', href: '#/nhom' },
      h('div', { class: 'phu nho' }, 'Nhóm của tôi'),
      h('div', { class: 'mon-ten' }, m.nhom ? m.nhom.tenNhom : 'Chưa có nhóm'),
      h('div', { class: 'phu nho' }, m.nhom ? 'Xem thành viên và link Zalo' : 'Lớp trưởng sẽ chia nhóm sau khi đóng Form đăng ký')),
    ...(d ? [theCap(d.cap)] : []),
    h('a', { class: 'card', href: '#/tao-de' },
      h('div', { class: 'mon-ten' }, 'Tạo đề thi'),
      h('div', { class: 'phu nho' }, 'Chọn môn, chọn chương, làm đề 30 câu. Mỗi đề làm xong +20 điểm, tối đa 120 điểm mỗi tuần.')),
    d ? theSuKien(d) : h('div', { class: 'card' }, h('div', { class: 'mon-ten' }, 'Đang tải...'))
  );
  const vungMon = h('div', {});
  noi.append(vungMon);
  void layManifest().then((mf) => {
    const hk = mf.hocKy.find((x) => x.ma === m.hocKy?.maHocKy) ?? mf.hocKy[0];
    if (!hk || !hk.mon.length) return;
    const luoi = h('div', { class: 'luoi' });
    hk.mon.forEach((mon) =>
      luoi.append(h('a', { class: 'card card-mon', href: `#/bai-hoc/${hk.ma}/${mon.ma}`, style: `--mau:${mon.mau || '#4cc9f0'}` },
        h('div', { class: 'mon-ten' }, mon.ten),
        mon.baiHoc.some((b) => laMoi(b.capNhat)) ? h('span', { class: 'nhan-moi' }, 'Mới cập nhật') : null)));
    vungMon.append(h('h2', {}, 'Các môn'), luoi);
  });
}

function theSuKien(d: TrangChuData): HTMLElement {
  const tt = d.tuan;
  const the = h('a', { class: 'card', href: '#/su-kien' }, h('div', { class: 'phu nho' }, 'Sự kiện tuần này'));
  const t = tt.tuan;
  if (!t) {
    the.append(h('div', { class: 'mon-ten' }, 'Chưa có lịch sự kiện'));
    return the;
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
  return the;
}

async function thoat(): Promise<void> {
  const coPhien = layPhien() !== null;
  try {
    if (coPhien) await goi('dangXuat', { phien: layPhien() });
  } catch {
    /* máy chủ không trả lời vẫn đăng xuất ở máy này */
  }
  dangXuat();
  xoaCache();
  me = null;
  duLieuTrangChu = null;
  location.hash = '#/';
  manHinhDangNhap();
}

function veCaiDat(noi: HTMLElement): void {
  xoaHet(noi);
  noi.append(
    h('h1', {}, 'Tài khoản'),
    h('div', { class: 'card' },
      h('div', { class: 'mon-ten' }, me!.hoTen),
      h('div', { class: 'phu nho' }, me!.email),
      h('a', { class: 'nut nut-phu', href: '#/cau-hoi' }, 'Câu hỏi của tôi'),
      h('button', { class: 'nut nut-nguy', onclick: () => { void thoat(); } }, 'Đăng xuất'))
  );
}

// ---------- Khởi động ----------

window.addEventListener('hashchange', () => void dinhTuyen());
window.addEventListener('phien-het-han', () => {
  me = null;
  duLieuTrangChu = null;
  manHinhDangNhap();
});

if (laTrinhDuyetTrongUngDung()) canhBaoTrinhDuyet();
else if (!DEV_MOCK && chuaCauHinh())
  manHinhDon(h('h1', {}, 'Chưa cấu hình'), h('p', {}, 'Cần điền GOOGLE_CLIENT_ID và API_URL trong src/config.ts (xem HUONG-DAN-CHU.md, Phần 2).'));
else if (DEV_MOCK || daDangNhap()) void khoiDong();
else manHinhDangNhap();
