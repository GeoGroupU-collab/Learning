import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/vietnamese-500.css';
import './style.css';
import { icon, dauHieu, duongDongMuc } from './icon';
import { datCheDo, docCheDo, type CheDo } from './theme';
import { mauMon } from './mau';
import { CONFIG, DEV_MOCK, chuaCauHinh } from './config';
import { docCache, ghiCache, goi, LoiApi, xoaCache } from './api';
import { daDangNhap, dangXuat, layPhien, luuPhien, veNutDangNhap } from './auth';
import { h, khungCho, xoaHet, thongBao } from './dom';
import { layManifest, veBaiHoc, veDanhSachBai, veDanhSachMon, laMoi } from './views/bai-hoc';
import { veNhom } from './views/nhom';
import { veSuKien, veNopCauHoi } from './views/su-kien';
import { vePhongThi } from './views/phong-thi';
import { veXepHang } from './views/xep-hang';
import { veTaoDe } from './views/tao-de';
import { veXemLai } from './views/xem-lai';
import { veCauHoiCuaToi } from './views/cau-hoi-cua-toi';
import { theCap } from './cap';
import { dungDongHo, datGioMayChu, demNguoc, dinhDangNgay } from './gio';
import type { Me, TrangChuData } from './types';

// Tên để hiển thị. Tên trống hoặc đã bị xóa dữ liệu thì dùng phần đầu của email.
function tenHienThi(m: Me): string {
  const ten = (m.hoTen || '').trim();
  return ten && ten !== '(đã xóa)' ? ten : (m.email || '').split('@')[0];
}

function chuCaiDau(m: Me): string {
  const ky = /\p{L}/u.exec(tenHienThi(m));
  return (ky ? ky[0] : '?').toUpperCase();
}

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
  lamNongMayChu();
  const khungNut = h('div', { class: 'khung-nut' });
  xoaHet(goc);
  goc.append(h('main', { class: 'man-giua' }, h('div', { class: 'dang-nhap' },
    h('div', { class: 'dang-nhap-ban-do' },
      duongDongMuc() as unknown as HTMLElement,
      h('span', { class: 'nhan-muc' }, 'Câu lạc bộ học tập'),
      h('h2', {}, 'Mỗi tuần một đề, cả lớp cùng ôn.')),
    h('div', { class: 'dang-nhap-the' },
      h('span', { class: 'logo' }, dauHieu(32) as unknown as HTMLElement, h('span', {}, CONFIG.TEN_WEB)),
      h('h1', {}, 'Đăng nhập'),
      h('p', { class: 'phu' }, 'Dùng tài khoản Google đã đăng ký với lớp trưởng.'),
      khungNut,
      h('p', { class: 'phu nho' }, 'Web chỉ đọc email, tên và ảnh đại diện. Chưa đăng ký thì hỏi lớp trưởng link Form.')))));
  if (DEV_MOCK) {
    khungNut.append(h('button', { class: 'nut', onclick: () => khoiDong() }, 'Đăng nhập thử (chế độ phát triển)'));
    return;
  }
  veNutDangNhap(khungNut, () => void doiLayPhien()).catch((e: Error) => khungNut.append(h('p', { class: 'loi' }, e.message)));
}

// Apps Script nguội cần vài giây ở lần gọi đầu. Gọi sẵn một yêu cầu rẻ lúc người dùng còn đang ở màn đăng nhập
// để lúc bấm vào đã nóng. Không đọc kết quả, lỗi thì bỏ qua.
function lamNongMayChu(): void {
  if (DEV_MOCK || chuaCauHinh()) return;
  fetch(CONFIG.API_URL, { mode: 'no-cors', cache: 'no-store' }).catch(() => undefined);
}

// Sau khi vào được trang chủ, tải trước bảng xếp hạng và nhóm (một lần mỗi phiên) để bấm sang là hiện ngay.
function taiTruocCacMuc(): void {
  try {
    if (sessionStorage.getItem('lg_taitruoc')) return;
    sessionStorage.setItem('lg_taitruoc', '1');
  } catch {
    return;
  }
  setTimeout(async () => {
    try {
      ghiCache('xepHang', {}, await goi('xepHang'));
      const nhom = await goi('nhomCuaToi');
      if (nhom) ghiCache('nhomCuaToi', {}, nhom);
    } catch {
      /* tải trước thất bại thì không sao */
    }
  }, 1500);
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
    taiTruocCacMuc();
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
  ['#/', 'Trang chủ', 'nha'],
  ['#/bai-hoc', 'Bài học', 'sach'],
  ['#/su-kien', 'Sự kiện', 'lich'],
  ['#/nhom', 'Nhóm', 'nhom'],
  ['#/xep-hang', 'Xếp hạng', 'cup'],
];

let vungNoiDung: HTMLElement;
let thanhDuoi: HTMLElement;

function veKhung(): void {
  xoaHet(goc);
  vungNoiDung = h('main', { class: 'noi-dung' });
  thanhDuoi = h('nav', { class: 'thanh-duoi', 'aria-label': 'Điều hướng chính' },
    ...MUC_DUOI.map(([href, ten, bieuTuong]) => h('a', { href, 'data-href': href }, icon(bieuTuong, 22) as unknown as HTMLElement, h('span', {}, ten))));
  const laQuanTri = me!.vaiTro !== 'member';
  const chuCai = chuCaiDau(me!);
  goc.append(
    h('header', { class: 'dau-trang' },
      h('a', { class: 'logo', href: '#/' }, dauHieu(30) as unknown as HTMLElement, h('span', {}, CONFIG.TEN_WEB)),
      thanhDuoi,
      h('div', { class: 'dau-phai' },
        laQuanTri ? h('a', { class: 'nut-dau', href: '#/quan-tri/thanh-vien' }, icon('khien', 16) as unknown as HTMLElement, h('span', {}, 'Quản trị')) : null,
        h('a', { class: 'chu-cai', href: '#/cai-dat', 'aria-label': 'Tài khoản' }, chuCai))),
    vungNoiDung
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
        {
          const { veQuanTri } = await import('./views/quan-tri'); // chỉ tải khi quản trị viên mở trang này
          return await veQuanTri(vungNoiDung, me, a || 'thanh-vien');
        }
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
  const ten = tenHienThi(m).split(/\s+/).pop() || 'bạn';
  const lienKet = (href: string, bieuTuong: string, tieuDe: string, mo: string, lop = ''): HTMLElement =>
    h('a', { class: `card the-lien-ket ${lop}`.trim(), href }, icon(bieuTuong, 22) as unknown as HTMLElement,
      h('div', {}, h('div', { class: 'mon-ten' }, tieuDe), h('div', { class: 'phu nho' }, mo)));
  noi.append(
    h('div', { class: 'chao' },
      h('span', { class: 'nhan-muc' }, m.hocKy ? m.hocKy.tenHocKy : 'Chưa có học kỳ đang mở'),
      h('h1', {}, `Chào ${ten}`)),
    h('div', { class: 'luoi-chu' },
      d ? theSuKien(d) : h('div', { class: 'card rong' }, h('div', { class: 'mon-ten' }, 'Đang tải...')),
      ...(d ? [theCap(d.cap)] : []),
      lienKet('#/nhom', 'nhom', m.nhom ? m.nhom.tenNhom : 'Chưa có nhóm', m.nhom ? 'Xem thành viên và link Zalo' : 'Lớp trưởng sẽ chia nhóm sau khi đóng Form đăng ký'),
      lienKet('#/tao-de', 'but', 'Tự tạo đề luyện tập', 'Chọn môn, chọn chương, làm đề 30 câu từ ngân hàng. Mỗi đề làm xong +20 điểm, tối đa 120 điểm mỗi tuần.', 'rong'))
  );
  const vungMon = h('div', {});
  noi.append(vungMon);
  void layManifest().then((mf) => {
    const hk = mf.hocKy.find((x) => x.ma === m.hocKy?.maHocKy) ?? mf.hocKy[0];
    if (!hk || !hk.mon.length) return;
    const luoi = h('div', { class: 'luoi' });
    hk.mon.forEach((mon) =>
      luoi.append(h('a', { class: 'card card-mon', href: `#/bai-hoc/${hk.ma}/${mon.ma}`, style: mauMon(mon.mau) },
        h('div', {}, h('div', { class: 'mon-ten' }, mon.ten), h('div', { class: 'mon-phu' }, `${mon.baiHoc.length} bài học`)),
        mon.baiHoc.some((b) => laMoi(b.capNhat)) ? h('span', { class: 'nhan-moi' }, 'Mới') : null)));
    vungMon.append(h('h2', {}, 'Các môn'), luoi);
  });
}

function theSuKien(d: TrangChuData): HTMLElement {
  const tt = d.tuan;
  const the = h('a', { class: 'card the-su-kien rong', href: '#/su-kien' }, h('span', { class: 'nhan-muc' }, 'Sự kiện tuần này'));
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
  const cheDo = docCheDo();
  const nutCheDo = (gt: CheDo, nhan: string): HTMLElement => {
    const b = h('button', { class: 'nut nut-phu nho', type: 'button', 'aria-pressed': cheDo === gt }, nhan);
    b.addEventListener('click', () => {
      datCheDo(gt);
      veCaiDat(noi);
    });
    return b;
  };
  const ohoTen = h('input', { class: 'o-nhap', type: 'text', id: 'ho-ten', maxlength: 60, value: me!.hoTen === '(đã xóa)' ? '' : me!.hoTen, placeholder: 'Họ và tên hiển thị cho cả lớp' }) as HTMLInputElement;
  const nutLuuTen = h('button', { class: 'nut nho', type: 'button' }, 'Lưu tên') as HTMLButtonElement;
  nutLuuTen.addEventListener('click', async () => {
    nutLuuTen.disabled = true;
    try {
      const r = await goi<{ hoTen: string }>('capNhatHoTen', { hoTen: ohoTen.value });
      me = { ...me!, hoTen: r.hoTen };
      if (duLieuTrangChu) {
        duLieuTrangChu = { ...duLieuTrangChu, me: me };
        ghiCache('trangChu', {}, duLieuTrangChu);
      }
      thongBao('Đã lưu tên');
      veKhung();
      void dinhTuyen();
    } catch (e) {
      thongBao((e as LoiApi).message, 'loi');
      nutLuuTen.disabled = false;
    }
  });
  noi.append(
    h('h1', {}, 'Tài khoản'),
    h('div', { class: 'card' },
      h('span', { class: 'nhan-muc' }, 'Giao diện'),
      h('div', { class: 'hang-nut' }, nutCheDo('tu-dong', 'Theo thiết bị'), nutCheDo('sang', 'Sáng'), nutCheDo('toi', 'Tối'))),
    h('div', { class: 'card' },
      h('span', { class: 'nhan-muc' }, 'Thông tin'),
      h('div', { class: 'tai-khoan-dong' }, h('span', { class: 'chu-cai chu-cai-lon' }, chuCaiDau(me!)),
        h('div', {}, h('div', { class: 'mon-ten' }, tenHienThi(me!)), h('div', { class: 'phu nho dong-dai' }, me!.email))),
      ohoTen,
      h('div', { class: 'hang-nut' }, nutLuuTen)),
    h('div', { class: 'card' },
      h('div', { class: 'hang-nut' },
        h('a', { class: 'nut nut-phu', href: '#/cau-hoi' }, 'Câu hỏi của tôi'),
        h('button', { class: 'nut nut-nguy', onclick: () => { void thoat(); } }, 'Đăng xuất')))
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
