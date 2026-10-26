// CSV đọc ghi đơn giản, đủ cho ngân hàng câu hỏi: có dấu ngoặc kép, dấu phẩy và xuống dòng trong ô.

function thoatO(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Thêm BOM để Excel mở đúng tiếng Việt.
export function taoCsv(rows: Record<string, unknown>[], cot: string[]): string {
  const dong = [cot.map(thoatO).join(',')];
  rows.forEach((r) => dong.push(cot.map((c) => thoatO(r[c])).join(',')));
  return `﻿${dong.join('\r\n')}`;
}

export function docCsv(chuoi: string): Record<string, string>[] {
  const text = chuoi.replace(/^﻿/, '');
  const hang: string[][] = [];
  let o = '';
  let dong: string[] = [];
  let trongNgoac = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (trongNgoac) {
      if (c === '"' && text[i + 1] === '"') { o += '"'; i++; }
      else if (c === '"') trongNgoac = false;
      else o += c;
    } else if (c === '"') trongNgoac = true;
    else if (c === ',') { dong.push(o); o = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      dong.push(o); o = '';
      if (dong.some((x) => x !== '')) hang.push(dong);
      dong = [];
    } else o += c;
  }
  dong.push(o);
  if (dong.some((x) => x !== '')) hang.push(dong);
  if (!hang.length) return [];
  const tieuDe = hang[0].map((x) => x.trim());
  return hang.slice(1).map((r) => Object.fromEntries(tieuDe.map((t, i) => [t, r[i] ?? ''])));
}

export function taiXuong(tenFile: string, noiDung: string, loai: string): void {
  const url = URL.createObjectURL(new Blob([noiDung], { type: `${loai};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = tenFile;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
