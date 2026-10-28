// Huy hiệu cấp bậc vẽ bằng SVG (không cần tệp ảnh). Mỗi cấp một màu kim loại hoặc đá quý riêng, cấp càng cao càng nhiều
// cánh, mũ, đá. Hàm chỉ sinh chuỗi SVG nên kiểm thử được; script scripts/tao-anh-cap.ts ghi ra tệp .svg trong public/anh/cap/.
import { h } from './dom';

export interface Cap {
  ten: string;
  tep: string; // tên tệp không có đuôi
}

// Thứ tự phải khớp CAP_LON trong backend/src/logic.js.
export const CAC_CAP: Cap[] = [
  { ten: 'Gỗ', tep: '01-go' },
  { ten: 'Sắt', tep: '02-sat' },
  { ten: 'Đồng', tep: '03-dong' },
  { ten: 'Bạc', tep: '04-bac' },
  { ten: 'Vàng', tep: '05-vang' },
  { ten: 'Bạch Kim', tep: '06-bach-kim' },
  { ten: 'Lục Bảo', tep: '07-luc-bao' },
  { ten: 'Kim Cương', tep: '08-kim-cuong' },
  { ten: 'Cao Thủ', tep: '09-cao-thu' },
  { ten: 'Đại Cao Thủ', tep: '10-dai-cao-thu' },
  { ten: 'Thách Đấu', tep: '11-thach-dau' },
];

interface KieuCap {
  sang: string; // màu sáng của thân
  vua: string;
  toi: string; // màu viền và bóng
  da: string; // màu đá giữa
  daSang: string;
  canh: number; // số lông cánh mỗi bên (0 là không có cánh)
  gai: number; // số gai trên đỉnh
  da_loai: 'van' | 'tron' | 'luc' | 'kim' | 'sao';
  sao: number; // số sao nhỏ dưới chân
}

const KIEU: KieuCap[] = [
  { sang: '#d9a066', vua: '#a8703a', toi: '#5a3515', da: '#7a4a22', daSang: '#c58b4d', canh: 0, gai: 0, da_loai: 'van', sao: 0 },
  { sang: '#cfd6dc', vua: '#8b96a1', toi: '#3d454e', da: '#59626c', daSang: '#aeb7c0', canh: 0, gai: 0, da_loai: 'tron', sao: 0 },
  { sang: '#f4bb88', vua: '#cf7a3a', toi: '#7a3d12', da: '#a85a25', daSang: '#efae78', canh: 0, gai: 0, da_loai: 'sao', sao: 1 },
  { sang: '#f7fafc', vua: '#c3ced8', toi: '#707f8d', da: '#98a7b5', daSang: '#ffffff', canh: 0, gai: 0, da_loai: 'sao', sao: 2 },
  { sang: '#ffe98f', vua: '#f4bb2f', toi: '#9a6200', da: '#d99208', daSang: '#fff4b8', canh: 1, gai: 0, da_loai: 'sao', sao: 3 },
  { sang: '#effdff', vua: '#93d9e3', toi: '#2d8493', da: '#35b3c7', daSang: '#d8fbff', canh: 2, gai: 0, da_loai: 'tron', sao: 3 },
  { sang: '#c9ffe2', vua: '#2fc87d', toi: '#0b6a43', da: '#10a463', daSang: '#9bf5c6', canh: 2, gai: 0, da_loai: 'luc', sao: 3 },
  { sang: '#e6f5ff', vua: '#5fbaff', toi: '#1b5fb5', da: '#2e8fe8', daSang: '#c4e8ff', canh: 3, gai: 0, da_loai: 'kim', sao: 3 },
  { sang: '#eddcff', vua: '#9f62f2', toi: '#4a22a1', da: '#7b3fe0', daSang: '#d9bcff', canh: 3, gai: 3, da_loai: 'kim', sao: 4 },
  { sang: '#ffd9d9', vua: '#ee5050', toi: '#86101f', da: '#d12a3d', daSang: '#ffb3b3', canh: 4, gai: 5, da_loai: 'kim', sao: 5 },
  { sang: '#fff7c9', vua: '#ffd24f', toi: '#b17400', da: '#27c9e6', daSang: '#c8faff', canh: 5, gai: 7, da_loai: 'kim', sao: 5 },
];

const f = (n: number): string => String(Math.round(n * 10) / 10);

// Một cánh bên trái gồm n lông, lông ngoài cùng dài nhất.
function canhTrai(n: number, mau: string, vien: string): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = 26 + i * 11;
    const dai = 24 + (n - i) * 5;
    s += `<path d="M24 ${f(y)} L${f(24 - dai)} ${f(y + 5 - i * 1.5)} L${f(24 - dai * 0.62)} ${f(y + 11)} L24 ${f(y + 15)} Z" fill="${mau}" stroke="${vien}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  return s;
}

function gaiTren(n: number, mau: string, vien: string): string {
  if (!n) return '';
  const rong = 54;
  const buoc = rong / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x0 = 33 + i * buoc;
    const cao = i === Math.floor(n / 2) ? 14 : 9;
    s += `<path d="M${f(x0)} 16 L${f(x0 + buoc / 2)} ${f(16 - cao)} L${f(x0 + buoc)} 16 Z" fill="${mau}" stroke="${vien}" stroke-width="1.6" stroke-linejoin="round"/>`;
  }
  return s;
}

function daGiua(k: KieuCap): string {
  const cx = 60;
  const cy = 60;
  const lo = `fill="${k.da}" stroke="${k.toi}" stroke-width="2.2" stroke-linejoin="round"`;
  const sang = `fill="${k.daSang}" opacity="0.8"`;
  switch (k.da_loai) {
    case 'van':
      return `<circle cx="${cx}" cy="${cy}" r="17" ${lo}/><circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${k.daSang}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${k.daSang}" stroke-width="2"/>`;
    case 'tron':
      return `<circle cx="${cx}" cy="${cy}" r="16" ${lo}/><ellipse cx="${cx - 5}" cy="${cy - 6}" rx="6" ry="4" ${sang} transform="rotate(-30 ${cx - 5} ${cy - 6})"/>`;
    case 'luc':
      return `<path d="M60 40 L74 48 V68 L60 80 L46 68 V48 Z" ${lo}/><path d="M60 40 L74 48 L60 56 L46 48 Z" ${sang}/><path d="M60 56 V80 M46 48 L60 56 L74 48" stroke="${k.toi}" stroke-width="1.2" fill="none" opacity=".6"/>`;
    case 'kim':
      return `<path d="M44 52 L52 41 H68 L76 52 L60 82 Z" ${lo}/><path d="M44 52 H76 M52 41 L58 52 L60 82 M68 41 L62 52 L60 82" stroke="${k.toi}" stroke-width="1.2" fill="none" opacity=".65"/><path d="M52 41 H68 L62 52 H58 Z" ${sang}/>`;
    default: {
      // ngôi sao năm cánh
      const diem: string[] = [];
      for (let i = 0; i < 10; i++) {
        const g = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 18 : 7.6;
        diem.push(`${f(cx + r * Math.cos(g))},${f(cy + r * Math.sin(g))}`);
      }
      return `<polygon points="${diem.join(' ')}" ${lo}/><polygon points="${diem.slice(0, 4).join(' ')} ${cx},${cy}" ${sang}/>`;
    }
  }
}

// Trả chuỗi SVG hoàn chỉnh của một cấp (chỉ số 0 đến 10).
export function svgCap(chiSo: number): string {
  const k = KIEU[Math.max(0, Math.min(KIEU.length - 1, chiSo))];
  const id = `c${chiSo}`;
  const than = 'M60 14 L98 27 V64 C98 88 80 103 60 111 C40 103 22 88 22 64 V27 Z';
  const trong = 'M60 22 L90 32 V63 C90 83 75 95 60 102 C45 95 30 83 30 63 V32 Z';
  const sao = Array.from({ length: k.sao }, (_, i) => {
    const x = 60 + (i - (k.sao - 1) / 2) * 9;
    return `<circle cx="${f(x)}" cy="92" r="2.8" fill="${k.sang}" stroke="${k.toi}" stroke-width="1"/>`;
  }).join('');
  const canh = k.canh
    ? `<g>${canhTrai(k.canh, `url(#${id}c)`, k.toi)}</g><g transform="translate(120 0) scale(-1 1)">${canhTrai(k.canh, `url(#${id}c)`, k.toi)}</g>`
    : '';
  const dinh = k.da_loai === 'van' ? '' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${CAC_CAP[chiSo]?.ten ?? ''}">` +
    `<defs>` +
    `<linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${k.sang}"/><stop offset=".55" stop-color="${k.vua}"/><stop offset="1" stop-color="${k.toi}"/></linearGradient>` +
    `<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k.vua}"/><stop offset="1" stop-color="${k.toi}"/></linearGradient>` +
    `<linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${k.toi}"/><stop offset="1" stop-color="${k.vua}"/></linearGradient>` +
    `</defs>` +
    canh + gaiTren(k.gai, `url(#${id}a)`, k.toi) + dinh +
    `<path d="${than}" fill="url(#${id}a)" stroke="${k.toi}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${trong}" fill="url(#${id}b)" stroke="${k.sang}" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M60 22 L90 32 V44 C78 38 70 34 60 33 C50 34 42 38 30 44 V32 Z" fill="#fff" opacity=".18"/>` +
    daGiua(k) + sao +
    `</svg>`;
}

// Chỉ số cấp theo tên (không phân biệt hoa thường). Không thấy thì trả 0.
export function chiSoCap(ten: string): number {
  const t = String(ten ?? '').trim().toLowerCase();
  const i = CAC_CAP.findIndex((c) => c.ten.toLowerCase() === t);
  return i < 0 ? 0 : i;
}

// Phần tử ảnh dùng ngay trong giao diện. Ảnh SVG nhúng bằng img nên không chạy được mã nào.
export function anhCap(ten: string, kichThuoc = 56): HTMLElement {
  const i = chiSoCap(ten);
  return h('img', {
    class: 'anh-cap', alt: `Huy hiệu ${CAC_CAP[i].ten}`, width: kichThuoc, height: kichThuoc,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCap(i))}`,
  });
}
