// Tạo phần tử DOM an toàn: văn bản luôn đi qua textContent, không chèn HTML thô.

type Con = Node | string | null | undefined | false;
type ThuocTinh = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;

export function h(tag: string, thuocTinh: ThuocTinh = {}, ...con: Con[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(thuocTinh)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of con) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function xoaHet(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function thongBao(noiDung: string, loai: 'ok' | 'loi' = 'ok'): void {
  const el = h('div', { class: `toast toast-${loai}`, role: 'status' }, noiDung);
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}

// Khung chờ tĩnh (không chuyển động) hiện trong lúc tải, để trang không bị trống.
export function khungCho(soThe = 3): HTMLElement {
  const goc = h('div', { class: 'khung-cho', 'aria-busy': 'true', 'aria-label': 'Đang tải' });
  for (let i = 0; i < soThe; i++) goc.append(h('div', { class: 'card the-cho' }, h('div', { class: 'dong-cho dai' }), h('div', { class: 'dong-cho' }), h('div', { class: 'dong-cho ngan' })));
  return goc;
}
