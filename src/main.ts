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
import { docCache, ghiCache, goi, goiNhanh, LoiApi, xoaCache } from './api';
import { daDangNhap, dangXuat, layPhien, luuPhien, veNutDangNhap } from './auth';
import { h, khungCho, xoaHet, thongBao } from './dom';
import { layManifest, veBaiHoc, veDanhSachBai, veDanhSachMon, laMoi } from './views/bai-hoc';
import { veNhom } from './views/nhom';
import { veSuKien, veNopCauHoi } from './views/su-kien';
import { vePhongThi } from './views/phong-thi';
import { veXepHang } from './views/xep-hang';
import { veTaoDe } from './views/tao-de';
import { veXemLai } from './views/xem-lai';
import { veThongBao, datThongBaoMoiNhat, coThongBaoMoi, capNhatCham } from './views/thong-bao';
import { veCauHoiCuaToi } from './views/cau-hoi-cua-toi';
import { theCap } from './cap';
import { bayGio, dungDongHo, datGioMayChu, demNguoc, dinhDangNgay } from './gio';
import { capNhatNhacNgu } from './nhac-ngu';
import type { KetQuaXepHang, KetQuaXepHangCaNhan, Me, TrangChuData } from './types';

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
let lanHoiVinhDanh = 0;

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
    datThongBaoMoiNhat(cu.tbMoiNhat);
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
    datThongBaoMoiNhat(moi.tbMoiNhat);
    capNhatNhacNgu(moi.nhacNgu);
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
  const chuCai = chuCaiDau(me!);
  goc.append(
    h('header', { class: 'dau-trang' },
      h('a', { class: 'logo', href: '#/' }, dauHieu(30) as unknown as HTMLElement, h('span', {}, CONFIG.TEN_WEB)),
      thanhDuoi,
      h('div', { class: 'dau-phai' },
        h('a', { class: 'chu-cai', href: '#/cai-dat', 'aria-label': 'Tài khoản' }, chuCai))),
    vungNoiDung
  );
  capNhatCham();
}

function danhDauMuc(hash: string): void {
  const goc2 = hash.split('/').slice(0, 2).join('/') || '#/';
  const khop = hash.startsWith('#/doc') || hash.startsWith('#/tao-de') ? '#/bai-hoc' : goc2 === '#' ? '#/' : goc2;
  thanhDuoi.querySelectorAll('a').forEach((a) => a.classList.toggle('dang', a.getAttribute('data-href') === khop));
}

async function dinhTuyen(): Promise<void> {
  if (!me) return;
  const hash = location.hash || '#/';
  const [, muc = '', a = '', b = '', c = ''] = hash.split('/');
  danhDauMuc(hash);
  vungNoiDung.classList.toggle('noi-dung-2cot', muc === '' || (muc === 'su-kien' && (a === '' || a === 'thong-bao')));
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
        if (a === 'thong-bao') return await veThongBao(vungNoiDung);
        if (a === 'xem-lai') return await veXemLai(vungNoiDung, b ? Number(b) : null);
        return a === 'nop' ? await veNopCauHoi(vungNoiDung) : await veSuKien(vungNoiDung);
      case 'cau-hoi':
        return await veCauHoiCuaToi(vungNoiDung);
      case 'xep-hang':
        return await veXepHang(vungNoiDung, a === 'ca-nhan' ? 'ca-nhan' : 'nhom');
      case 'tao-de':
        return await veTaoDe(vungNoiDung);
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
    datThongBaoMoiNhat(moi.tbMoiNhat);
    capNhatNhacNgu(moi.nhacNgu);
    if ((location.hash || '#/') === '#/') veTrangChu(vungNoiDung);
  } catch {
    /* giữ dữ liệu cũ */
  }
}

// Vẽ trang chủ ngay từ dữ liệu đã có, không cần chờ mạng (trừ danh sách bài học và dải vinh danh, tải riêng bên dưới).
function veTrangChu(noi: HTMLElement): void {
  dungDongHo();
  xoaHet(noi);
  const m = me!;
  const d = duLieuTrangChu;
  const ten = tenNganHienThi(m);
  const lienKet = (href: string, bieuTuong: string, tieuDe: string, mo: string, lop = ''): HTMLElement =>
    h('a', { class: `card the-lien-ket ${lop}`.trim(), href }, icon(bieuTuong, 22) as unknown as HTMLElement,
      h('div', {}, h('div', { class: 'mon-ten' }, tieuDe), h('div', { class: 'phu nho' }, mo)));
  const vungChay = h('div', { class: 'chay' });
  const cotChinh = h('div', { class: 'cot-chinh' });
  dungDaiVinhDanh(vungChay, [], []);
  noi.append(
    h('section', { class: 'hero hero-chu' },
      h('span', { class: 'hero-nhan' }, `${m.hocKy ? m.hocKy.tenHocKy : 'Chưa có học kỳ đang mở'} · ${homNay()}`),
      h('h1', { class: 'hero-tieu-de' }, `${loiChao()}, ${ten}`),
      h('p', { class: 'hero-phu' }, 'Mỗi tuần một đề, cả lớp cùng ôn. Hôm nay bạn làm gì cho nhóm mình?')),
    vungChay,
    h('div', { class: 'bo-cuc-2 bo-cuc-trang-chu' }, cotChinh,
      h('div', { class: 'cot-phu' },
        ...(coThongBaoMoi() ? [lienKet('#/su-kien/thong-bao', 'chuong', 'Có thông báo mới', 'Bấm để đọc tin từ lớp trưởng', 'the-tb-moi')] : []),
        ...(d ? [theCap(d.cap)] : []),
        ...(d ? theTienDoTuan(d) : []),
        lienKet('#/nhom', 'nhom', m.nhom ? m.nhom.tenNhom : 'Chưa có nhóm', m.nhom ? 'Xem thành viên và link Zalo' : 'Lớp trưởng sẽ chia nhóm sau khi đóng Form đăng ký'),
        theMeoHoc()))
  );
  cotChinh.append(d ? theSuKien(d) : h('div', { class: 'card' }, h('div', { class: 'mon-ten' }, 'Đang tải...')));

  // Dải chữ chạy vinh danh: nhóm cao điểm nhất tuần gần nhất đã chốt, và cá nhân xuất sắc. Hiện ngay từ bản lưu nếu có.
  let nhomVd: string[] = [];
  let nguoiVd: string[] = [];
  const ve = (): void => { if (vungChay.isConnected) dungDaiVinhDanh(vungChay, nhomVd, nguoiVd); };
  const nhom = (kq: KetQuaXepHang): void => {
    nhomVd = kq.vinhDanh ? kq.vinhDanh.nhom.map((n) => `${n.tenNhom} dẫn đầu tuần ${kq.vinhDanh!.soTuan} với ${n.diem.toFixed(1)} điểm`) : [];
    ve();
  };
  const nguoi = (kq: KetQuaXepHangCaNhan): void => {
    nguoiVd = kq.vinhDanh ? kq.vinhDanh.nguoi.map((n) => `${n.hoTen} nhận danh hiệu ${n.danhHieu} (${n.diem.toFixed(1)} điểm)`) : [];
    ve();
  };
  // Vinh danh chỉ đổi khi chốt tuần, nên mỗi tab hỏi máy chủ nhiều nhất 5 phút một lần; còn lại dùng bản đã lưu.
  const cuNhom = docCache<KetQuaXepHang>('xepHang');
  const cuNguoi = docCache<KetQuaXepHangCaNhan>('xepHangCaNhan');
  if (cuNhom) nhom(cuNhom);
  if (cuNguoi) nguoi(cuNguoi);
  if (Date.now() - lanHoiVinhDanh > 300000 || !cuNhom || !cuNguoi) {
    lanHoiVinhDanh = Date.now();
    void goiNhanh<KetQuaXepHang>('xepHang', {}, nhom).catch(() => undefined);
    void goiNhanh<KetQuaXepHangCaNhan>('xepHangCaNhan', {}, nguoi).catch(() => undefined);
  }

  const vungMon = h('div', { class: 'khu-mon' });
  noi.querySelector('.bo-cuc-trang-chu')!.append(vungMon);
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

// Giờ và ngày theo giờ Việt Nam, lấy theo đồng hồ máy chủ để không lệch khi máy người dùng chỉnh sai giờ.
function gioVN(): number {
  return Number(new Date(bayGio()).toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' })) % 24;
}

function loiChao(): string {
  const g = gioVN();
  return g >= 5 && g < 11 ? 'Chào buổi sáng' : g >= 11 && g < 13 ? 'Chào buổi trưa' : g >= 13 && g < 18 ? 'Chào buổi chiều' : g >= 18 && g < 23 ? 'Chào buổi tối' : 'Khuya rồi';
}

function homNay(): string {
  return new Date(bayGio()).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
}

// Vòng tròn tiến độ nộp câu hỏi của tuần (chỉ hiện khi tuần đang nhận câu hỏi và bạn không được miễn).
function theTienDoTuan(d: TrangChuData): HTMLElement[] {
  const tt = d.tuan;
  const can = tt.soCauCanNop ?? 0;
  if (!tt.tuan || tt.tuan.trangThai !== 'nop_cau_hoi' || tt.mien || can <= 0) return [];
  const da = Math.min(tt.soCauDaNop ?? 0, can);
  const R = 26;
  const chuVi = 2 * Math.PI * R;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('width', '64');
  svg.setAttribute('height', '64');
  svg.setAttribute('class', 'vong-tien-do');
  const vong = (lop: string, tiLe: number): SVGElement => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '32'); c.setAttribute('cy', '32'); c.setAttribute('r', String(R));
    c.setAttribute('class', lop);
    c.setAttribute('stroke-dasharray', `${chuVi * tiLe} ${chuVi}`);
    return c;
  };
  svg.append(vong('vong-nen', 1), vong('vong-dung', da / can));
  const so = document.createElementNS(NS, 'text');
  so.setAttribute('x', '32'); so.setAttribute('y', '37'); so.setAttribute('text-anchor', 'middle'); so.setAttribute('class', 'vong-so');
  so.textContent = `${da}/${can}`;
  svg.append(so);
  const xong = da >= can;
  return [h('a', { class: 'card the-tien-do-tuan', href: '#/su-kien' }, svg as unknown as HTMLElement,
    h('div', {}, h('div', { class: 'mon-ten' }, xong ? 'Đã nộp đủ câu hỏi' : 'Tiến độ nộp câu hỏi'),
      h('div', { class: 'phu nho' }, xong ? 'Bạn đã được vào phòng thi tuần này.' : `Còn ${can - da} câu nữa để được vào phòng thi.`)))];
}

const MEO_HOC = [
  'Học 25 phút rồi nghỉ 5 phút hiệu quả hơn ngồi liền hai tiếng.',
  'Tự giải thích bài cho bạn bên cạnh nghe, chỗ nào ấp úng là chỗ chưa hiểu.',
  'Ra câu hỏi cho nhóm cũng là cách ôn bài tốt nhất.',
  'Ngủ đủ giấc giúp não ghi nhớ bài vừa học. Thức khuya học dồn ít khi đọng lại.',
  'Làm sai một câu thì xem kỹ giải thích, câu sai là câu dạy bạn nhiều nhất.',
  'Học xong nhớ đóng điện thoại lại. Mỗi lần xem tin nhắn là mất vài phút lấy lại tập trung.',
  'Chia bài thành từng phần nhỏ, xong phần nào gạch phần đó cho có động lực.',
  'Uống nước và đứng dậy vươn vai giữa giờ học, đầu óc sẽ tỉnh hơn.',
  'Ôn lại bài sau một ngày, rồi sau một tuần. Lặp lại cách quãng nhớ lâu hơn.',
  'Viết tay những ý chính bằng lời của mình thay vì chép nguyên văn.',
  'Hỏi bạn trong nhóm khi chưa hiểu, ai cũng từng không biết.',
  'Bắt đầu bằng phần khó nhất khi còn tỉnh táo, phần dễ để lúc mệt.',
  'Tự tạo một đề luyện tập trước khi thi, làm xong nhớ xem lại câu sai.',
  'Đặt mục tiêu nhỏ cho hôm nay, ví dụ ôn xong một chương.',
  'Nhóm mạnh là nhóm cả người giỏi lẫn người mới đều thi, đừng bỏ thi nhé.',
  'Mỗi câu hỏi tự soạn nên có trang nguồn, sau này ôn lại tìm rất nhanh.',
  'Đọc đề thật kỹ, gạch chân từ khóa như "không", "đúng nhất", "ngoại trừ".',
  'Gặp câu chưa chắc, loại bớt hai đáp án sai rõ ràng trước rồi mới chọn.',
  'Học ở chỗ sáng, thoáng, bàn gọn. Chỗ học gọn gàng giúp đầu óc gọn hơn.',
  'Thưởng cho mình một việc nhỏ sau khi học xong, ví dụ ly trà hay một bài hát.',
];

// Mẹo đổi theo ngày (theo ngày Việt Nam), cả lớp cùng thấy một mẹo mỗi ngày.
function theMeoHoc(): HTMLElement {
  const ngay = Math.floor((bayGio() + 7 * 3600000) / 86400000);
  return h('div', { class: 'card the-meo' }, icon('den', 22) as unknown as HTMLElement,
    h('div', {}, h('div', { class: 'nhan-muc' }, 'Mẹo học hôm nay'), h('p', { class: 'the-meo-chu' }, MEO_HOC[ngay % MEO_HOC.length])));
}

function tenNganHienThi(m: Me): string {
  return tenHienThi(m).split(/\s+/).pop() || 'bạn';
}

// Dải chữ chạy ngang. Nội dung được lặp hai lần để vòng lặp liền mạch. Chỉ dùng textContent nên tên người không thể chèn mã.
function dungDaiVinhDanh(vung: HTMLElement, nhom: string[], nguoi: string[]): void {
  xoaHet(vung);
  const cau = [...nhom, ...nguoi];
  const noiDung = cau.length ? cau : ['Tuần đầu tiên chưa chốt điểm. Nhóm nào sẽ là nhóm đầu bảng?'];
  const doan = (lan: number): HTMLElement => h('div', { class: 'chay-doan' }, ...Array.from({ length: lan }, () => noiDung).flat().map((c) => h('span', { class: 'chay-muc' }, c)));
  const dai = h('div', { class: 'chay-dai' });
  vung.append(
    h('span', { class: 'chay-nhan' }, icon('cup', 14) as unknown as HTMLElement, 'Vinh danh'),
    h('div', { class: 'chay-khung' }, dai));
  // Lặp nội dung đủ dài để một đoạn luôn phủ hết khung (không để hở), rồi lặp đoạn đó hai lần cho vòng chạy liền mạch.
  let lan = 1;
  dai.append(doan(lan), doan(lan));
  requestAnimationFrame(() => {
    const khung = dai.parentElement;
    const mot = dai.firstElementChild as HTMLElement | null;
    if (!khung || !mot || !mot.offsetWidth) return;
    lan = Math.max(1, Math.ceil(khung.clientWidth / mot.offsetWidth));
    xoaHet(dai);
    dai.append(doan(lan), doan(lan));
    const rong = (dai.firstElementChild as HTMLElement).offsetWidth;
    dai.style.animationDuration = `${Math.max(12, Math.round(rong / 55))}s`; // khoảng 55 điểm ảnh mỗi giây
  });
}

function theSuKien(d: TrangChuData): HTMLElement {
  const tt = d.tuan;
  const the = h('a', { class: 'the-su-kien-lon', href: '#/su-kien' });
  const t = tt.tuan;
  if (!t) {
    the.append(h('span', { class: 'nhan-muc' }, 'Sự kiện tuần này'), h('div', { class: 'mon-ten' }, 'Chưa có lịch sự kiện'));
    return the;
  }
  const canNop = tt.soCauCanNop ?? 0;
  const viec = tt.mien ? 'Bạn được miễn tuần này'
    : t.trangThai === 'nop_cau_hoi' ? ((tt.soCauDaNop ?? 0) >= canNop ? 'Đã nộp đủ câu hỏi' : `Cần nộp câu hỏi (${tt.soCauDaNop ?? 0}/${canNop})`)
    : t.trangThai === 'cho_mo_cua' ? 'Chờ mở phòng thi'
    : t.trangThai === 'mo' ? 'Phòng thi đang mở'
    : 'Tuần này đã đóng';
  the.append(h('div', { class: 'hang' }, h('span', { class: 'nhan-muc' }, `Sự kiện tuần ${t.soTuan}`), icon('phai', 18) as unknown as HTMLElement),
    h('div', { class: 'su-kien-viec' }, viec));
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
