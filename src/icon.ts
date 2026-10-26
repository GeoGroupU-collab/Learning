// Bộ biểu tượng nét mảnh (SVG, 24x24, màu theo chữ). Vẽ tay, không dùng thư viện.
const NS = 'http://www.w3.org/2000/svg';

const NET: Record<string, string[]> = {
  nha: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  sach: ['M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z', 'M12 6.5v13'],
  lich: ['M5 4.5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2z', 'M3 9.5h18', 'M8 3v3.5', 'M16 3v3.5'],
  nhom: ['M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5', 'M9 11.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z', 'M16.5 4.9a3 3 0 0 1 0 5.8', 'M17.5 14.6c2 .6 3.5 2.2 3.5 5.4'],
  cup: ['M8 4h8v5a4 4 0 0 1-8 0z', 'M8 5.5H5v1.5a3 3 0 0 0 3 3', 'M16 5.5h3v1.5a3 3 0 0 1-3 3', 'M12 13v3.5', 'M8.5 20h7', 'M10 16.5h4V20h-4z'],
  nguoi: ['M12 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z', 'M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6'],
  khien: ['M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z', 'M9 12l2 2 4-4'],
  trai: ['M19 12H5', 'M11 6l-6 6 6 6'],
  phai: ['M9 6l6 6-6 6'],
  tick: ['M5 12.5l4.5 4.5L19 7.5'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  sao: ['M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z'],
  dongHo: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  but: ['M4 20l1-4 11-11 3 3L8 19z', 'M14 7l3 3'],
  tep: ['M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  dangXuat: ['M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5', 'M15 8l4 4-4 4', 'M19 12H9'],
  bangTu: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
};

export function icon(ten: string, kichThuoc = 20): SVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(kichThuoc));
  svg.setAttribute('height', String(kichThuoc));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  (NET[ten] ?? []).forEach((d) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  });
  return svg as SVGElement;
}

// Dấu hiệu thương hiệu: các đường đồng mức của bản đồ địa hình, lồng nhau quanh một điểm mốc.
export function dauHieu(kichThuoc = 28): SVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', String(kichThuoc));
  svg.setAttribute('height', String(kichThuoc));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const khung = document.createElementNS(NS, 'rect');
  for (const [k, v] of Object.entries({ width: 32, height: 32, rx: 7, fill: 'var(--nhan)' })) khung.setAttribute(k, String(v));
  svg.append(khung);
  const duong = [
    'M5 21c1-5 4-8.5 8.5-9.5S23 11 26 7.5',
    'M5 26c1.8-4.6 5.4-8.2 10-9.2 4.7-1 8.3-1.2 11-4.3',
    'M9 27c2.4-3 5.6-5.2 9-6 3.3-.8 5.6-1 8-2.8',
  ];
  duong.forEach((d, i) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'var(--tren-nhan)');
    p.setAttribute('stroke-width', i === 0 ? '2' : '1.6');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('opacity', i === 0 ? '1' : '0.7');
    svg.append(p);
  });
  const diem = document.createElementNS(NS, 'circle');
  for (const [k, v] of Object.entries({ cx: 22, cy: 9.5, r: 2.2, fill: 'var(--tren-nhan)' })) diem.setAttribute(k, String(v));
  svg.append(diem);
  return svg as SVGElement;
}

// Nền đường đồng mức (bản đồ địa hình) cho màn hình đăng nhập: nét mảnh, trong suốt, vẽ tĩnh.
export function duongDongMuc(): SVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 300');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('class', 'duong-dong-muc');
  svg.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 9; i++) {
    const p = document.createElementNS(NS, 'path');
    const y = 30 + i * 32;
    const bien = 18 + (i % 3) * 7;
    p.setAttribute('d', `M-10 ${y} C 60 ${y - bien}, 110 ${y + bien}, 180 ${y - 4} S 300 ${y - bien}, 410 ${y + bien - 6}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'var(--tren-nhan)');
    p.setAttribute('stroke-width', i % 4 === 0 ? '1.6' : '1');
    p.setAttribute('opacity', i % 4 === 0 ? '0.32' : '0.16');
    svg.append(p);
  }
  return svg as SVGElement;
}
