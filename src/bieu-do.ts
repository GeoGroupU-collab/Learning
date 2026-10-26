// Biểu đồ đường SVG thuần: điểm các nhóm theo tuần. Không dùng thư viện.
import type { TuanDaChot } from './huy-hieu';

const MAU = ['#4cc9f0', '#f4a261', '#80ed99', '#b5179e', '#e5383b', '#ffd166', '#7b9cff', '#ff8fab'];
const NS = 'http://www.w3.org/2000/svg';

function el(ten: string, thuocTinh: Record<string, string | number>, chu?: string): SVGElement {
  const e = document.createElementNS(NS, ten);
  Object.entries(thuocTinh).forEach(([k, v]) => e.setAttribute(k, String(v)));
  if (chu !== undefined) e.textContent = chu;
  return e as SVGElement;
}

export interface DuLieuBieuDo {
  tuan: number[];
  nhom: { ma: string; ten: string; mau: string; diem: (number | null)[]; laToi: boolean }[];
}

// Chuẩn bị dữ liệu: mỗi nhóm có một mảng điểm theo thứ tự các tuần đã chốt (null nếu tuần đó nhóm chưa có).
export function chuanBiBieuDo(cacTuan: TuanDaChot[], nhomToi: string | null): DuLieuBieuDo {
  const ds = cacTuan.filter((t) => t.daChot).sort((a, b) => a.soTuan - b.soTuan);
  const tenNhom = new Map<string, string>();
  ds.forEach((t) => t.nhom.forEach((n) => tenNhom.set(n.maNhom, n.tenNhom)));
  const nhom = [...tenNhom.keys()].sort().map((ma, i) => ({
    ma, ten: tenNhom.get(ma) ?? ma, mau: MAU[i % MAU.length], laToi: ma === nhomToi,
    diem: ds.map((t) => t.nhom.find((n) => n.maNhom === ma)?.diem ?? null),
  }));
  return { tuan: ds.map((t) => t.soTuan), nhom };
}

export function veBieuDo(du: DuLieuBieuDo): SVGElement {
  const R = 340, C = 190, le = { t: 12, p: 12, d: 28, tr: 34 };
  const svg = el('svg', { viewBox: `0 0 ${R} ${C}`, role: 'img', class: 'bieu-do', 'aria-label': `Điểm các nhóm qua ${du.tuan.length} tuần` });
  const rong = R - le.tr - le.p;
  const cao = C - le.t - le.d;
  const x = (i: number): number => le.tr + (du.tuan.length <= 1 ? rong / 2 : (rong * i) / (du.tuan.length - 1));
  const y = (d: number): number => le.t + cao - (cao * Math.max(0, Math.min(100, d))) / 100;

  [0, 25, 50, 75, 100].forEach((m) => {
    svg.append(el('line', { x1: le.tr, x2: R - le.p, y1: y(m), y2: y(m), stroke: 'rgba(140,150,255,0.2)', 'stroke-width': 1 }));
    svg.append(el('text', { x: le.tr - 6, y: y(m) + 4, 'text-anchor': 'end', fill: '#9aa3d4', 'font-size': 10 }, String(m)));
  });
  du.tuan.forEach((t, i) => svg.append(el('text', { x: x(i), y: C - 8, 'text-anchor': 'middle', fill: '#9aa3d4', 'font-size': 10 }, `T${t}`)));

  // Nhóm của tôi vẽ sau cùng để nằm trên.
  [...du.nhom].sort((a, b) => Number(a.laToi) - Number(b.laToi)).forEach((n) => {
    let d = '';
    n.diem.forEach((v, i) => { if (v !== null) d += `${d ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `; });
    if (d.includes('L')) svg.append(el('path', { d: d.trim(), fill: 'none', stroke: n.mau, 'stroke-width': n.laToi ? 3.2 : 1.8, 'stroke-linejoin': 'round', opacity: n.laToi ? 1 : 0.8 }));
    n.diem.forEach((v, i) => { if (v !== null) svg.append(el('circle', { cx: x(i), cy: y(v), r: n.laToi ? 4 : 3, fill: n.mau })); });
  });
  return svg;
}
