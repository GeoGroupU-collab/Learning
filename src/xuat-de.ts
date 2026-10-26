// Xuất đề thi ra file in được (HTML, in ra PDF từ trình duyệt), JSON và CSV. Không dùng DOM nên kiểm thử được.
import { taoCsv } from './csv';
import type { DeThiDayDu } from './types';

export function escHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const CSS = `
  body { font: 14px/1.5 'Times New Roman', serif; color: #000; max-width: 780px; margin: 24px auto; padding: 0 16px; }
  h1 { font-size: 20px; text-align: center; margin: 0 0 4px; }
  .phu { text-align: center; color: #444; margin-bottom: 14px; }
  .ky { display: flex; justify-content: space-between; margin: 10px 0 16px; }
  .cau { margin: 0 0 12px; page-break-inside: avoid; }
  .cau p { margin: 0 0 4px; font-weight: bold; }
  .dap-an { margin: 0 0 0 18px; }
  .nguon { color: #555; font-size: 12px; }
  table { border-collapse: collapse; margin: 10px 0 18px; }
  td, th { border: 1px solid #000; padding: 3px 8px; text-align: center; }
  .dung { font-weight: bold; }
  @media print { .khong-in { display: none; } body { margin: 0; } }
`;

function khung(tieuDe: string, thanToan: string, tuIn: boolean): string {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>${escHtml(tieuDe)}</title><style>${CSS}</style></head>
<body>${thanToan}
<p class="khong-in phu"><button onclick="window.print()">In hoặc lưu thành PDF</button></p>
${tuIn ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},400)})</script>' : ''}
</body></html>`;
}

// Bản đề (không đáp án) hoặc bản đáp án kèm giải thích.
export function htmlDe(de: DeThiDayDu, coDapAn: boolean, tuIn = false, tenWeb = 'Learning Group'): string {
  const soCau = de.cau.length;
  if (!coDapAn) {
    const ds = de.cau.map((c, i) => `<div class="cau"><p>Câu ${i + 1}. ${escHtml(c.noiDung)}</p><div class="dap-an">
      <div>A. ${escHtml(c.A)}</div><div>B. ${escHtml(c.B)}</div><div>C. ${escHtml(c.C)}</div><div>D. ${escHtml(c.D)}</div></div></div>`).join('\n');
    return khung(de.tenDe, `<h1>${escHtml(de.tenDe)}</h1><div class="phu">${escHtml(tenWeb)} · ${soCau} câu trắc nghiệm</div>
      <div class="ky"><span>Họ và tên: ................................................</span><span>Lớp: ..............</span></div>${ds}`, tuIn);
  }
  const hang = de.cau.map((c, i) => `<tr><td>${i + 1}</td><td class="dung">${escHtml(c.dapAn)}</td></tr>`).join('');
  const giai = de.cau.map((c, i) => `<div class="cau"><p>Câu ${i + 1}. ${escHtml(c.noiDung)}</p><div class="dap-an">
      ${(['A', 'B', 'C', 'D'] as const).map((k) => `<div class="${c.dapAn === k ? 'dung' : ''}">${k}. ${escHtml(c[k])}${c.dapAn === k ? ' ✓' : ''}</div>`).join('')}</div>
      <div class="nguon">${escHtml(c.tenMon)}${c.maChuong ? ` · ${escHtml(c.maChuong)}` : ''}${c.trangNguon ? ` · ${escHtml(c.trangNguon)}` : ''}</div>
      ${c.giaiThich ? `<div class="nguon">Giải thích: ${escHtml(c.giaiThich)}</div>` : ''}</div>`).join('\n');
  return khung(`${de.tenDe} - Đáp án`, `<h1>${escHtml(de.tenDe)} – ĐÁP ÁN</h1><div class="phu">${soCau} câu</div>
    <table><tr><th>Câu</th><th>Đáp án</th></tr>${hang}</table>${giai}`, tuIn);
}

const COT_CSV = ['stt', 'id', 'maMon', 'tenMon', 'maChuong', 'trangNguon', 'noiDung', 'A', 'B', 'C', 'D', 'dapAn', 'giaiThich'];

export function csvDe(de: DeThiDayDu): string {
  return taoCsv(de.cau.map((c, i) => ({ stt: i + 1, ...c })) as unknown as Record<string, unknown>[], COT_CSV);
}

export function jsonDe(de: DeThiDayDu): string {
  return JSON.stringify({
    idDe: de.idDe,
    tenDe: de.tenDe,
    soCau: de.cau.length,
    cau: de.cau.map((c, i) => ({ stt: i + 1, id: c.id, mon: c.tenMon, chuong: c.maChuong, trangNguon: c.trangNguon, noiDung: c.noiDung, dapAn: { A: c.A, B: c.B, C: c.C, D: c.D }, dapAnDung: c.dapAn, giaiThich: c.giaiThich })),
  }, null, 2);
}
