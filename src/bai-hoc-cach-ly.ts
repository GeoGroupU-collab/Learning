// Chạy bài học HTML trong khung cách ly (sandbox, không cùng nguồn với web) để mã trong bài học, kể cả script tải từ trang
// ngoài, không đọc được phiên đăng nhập hay dữ liệu của web. Bài học vẫn lưu được tiến độ: localStorage trong khung được
// thay bằng một kho giả, mọi thay đổi gửi về web bằng postMessage và web lưu thật dưới khóa có tiền tố riêng.

export const TIEN_TO_BAI_HOC = 'lg_bh:';
const KHOA_TOI_DA = 200;
const GIA_TRI_TOI_DA = 200000;
const SO_KHOA_TOI_DA = 500;

// Quyền của khung: chạy script, mở link ra tab mới, form, hộp thoại. Không có allow-same-origin.
export const QUYEN_KHUNG = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads';

export interface KhoLuu {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  key(i: number): string | null;
  readonly length: number;
}

// Dữ liệu bài học đã lưu. Bản cũ (trước khi cách ly) nằm thẳng trong localStorage của web với khóa không bắt đầu bằng lg_,
// nên cũng được nạp để không mất tiến độ cũ; lần lưu sau sẽ chuyển sang khóa có tiền tố.
export function docDuLieuBaiHoc(kho: KhoLuu): Record<string, string> {
  const kq: Record<string, string> = {};
  const cu: Record<string, string> = {};
  for (let i = 0; i < kho.length; i++) {
    const k = kho.key(i);
    if (k === null) continue;
    const v = kho.getItem(k);
    if (v === null) continue;
    if (k.startsWith(TIEN_TO_BAI_HOC)) kq[k.slice(TIEN_TO_BAI_HOC.length)] = v;
    else if (!k.startsWith('lg_') && !k.startsWith('g_')) cu[k] = v;
  }
  return { ...cu, ...kq };
}

function demKhoaBaiHoc(kho: KhoLuu): number {
  let n = 0;
  for (let i = 0; i < kho.length; i++) if (kho.key(i)?.startsWith(TIEN_TO_BAI_HOC)) n++;
  return n;
}

// Áp dụng một tin nhắn từ khung bài học. Tin nhắn sai dạng hay quá lớn thì bỏ qua. Trả true nếu đã ghi.
export function apDungTinNhan(kho: KhoLuu, du: unknown): boolean {
  if (!du || typeof du !== 'object' || (du as { __lgBaiHoc?: unknown }).__lgBaiHoc !== 1) return false;
  const { op, k, v } = du as { op?: unknown; k?: unknown; v?: unknown };
  if (op === 'clear') {
    for (let i = kho.length - 1; i >= 0; i--) {
      const khoa = kho.key(i);
      if (khoa?.startsWith(TIEN_TO_BAI_HOC)) kho.removeItem(khoa);
    }
    return true;
  }
  if (typeof k !== 'string' || k.length === 0 || k.length > KHOA_TOI_DA) return false;
  if (op === 'remove') {
    kho.removeItem(TIEN_TO_BAI_HOC + k);
    return true;
  }
  if (op === 'set' && typeof v === 'string' && v.length <= GIA_TRI_TOI_DA) {
    const coSan = kho.getItem(TIEN_TO_BAI_HOC + k) !== null;
    if (!coSan && demKhoaBaiHoc(kho) >= SO_KHOA_TOI_DA) return false;
    kho.setItem(TIEN_TO_BAI_HOC + k, v);
    return true;
  }
  return false;
}

// Mã chạy đầu tiên trong khung: thay localStorage và sessionStorage bằng kho giả.
function maKhoGia(duLieu: Record<string, string>): string {
  // Thoát <, U+2028, U+2029 thành mã thoát để dữ liệu không thể đóng thẻ script hay làm vỡ mã.
  const nguyHiem = new RegExp('[' + String.fromCharCode(60, 0x2028, 0x2029) + ']', 'g');
  const json = JSON.stringify(duLieu).replace(nguyHiem, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  return `(function(){var o=${json};var co=Object.prototype.hasOwnProperty;` +
    `function gui(m){m.__lgBaiHoc=1;try{parent.postMessage(m,'*')}catch(e){}}` +
    `function kho(luu){var d=luu?o:{};var s={getItem:function(k){k=String(k);return co.call(d,k)?d[k]:null},` +
    `setItem:function(k,v){k=String(k);v=String(v);d[k]=v;if(luu)gui({op:'set',k:k,v:v})},` +
    `removeItem:function(k){k=String(k);delete d[k];if(luu)gui({op:'remove',k:k})},` +
    `clear:function(){for(var k in d)if(co.call(d,k))delete d[k];if(luu)gui({op:'clear'})},` +
    `key:function(i){return Object.keys(d)[i]||null}};Object.defineProperty(s,'length',{get:function(){return Object.keys(d).length}});return s}` +
    `var l=kho(true),t=kho(false);` +
    `try{Object.defineProperty(window,'localStorage',{configurable:true,get:function(){return l}})}catch(e){}` +
    `try{Object.defineProperty(window,'sessionStorage',{configurable:true,get:function(){return t}})}catch(e){}` +
    // Thẻ base làm link "#muc" trỏ sang địa chỉ thật của bài và tải lại cả trang (mất kho giả). Giữ link nội bộ trong trang.
    `if(window.document)document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href^="#"]'):null;` +
    `if(!a||a.target==='_blank')return;e.preventDefault();var h=a.getAttribute('href');if(h==='#'){window.scrollTo(0,0);return}` +
    `if(location.hash===h){var el=document.getElementById(decodeURIComponent(h.slice(1)));if(el)el.scrollIntoView();window.dispatchEvent(new HashChangeEvent('hashchange'))}else location.hash=h},true);})();`;
}

function thoatThuocTinh(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Chèn thẻ base (để ảnh, css, script tương đối vẫn tải đúng chỗ) và kho giả vào đầu bài học.
export function chenLopCachLy(html: string, duLieu: Record<string, string>, urlBai: string): string {
  const dau = `<base href="${thoatThuocTinh(urlBai)}"><script>${maKhoGia(duLieu)}</script>`;
  const m = /<head[^>]*>/i.exec(html);
  if (m) return html.slice(0, m.index + m[0].length) + dau + html.slice(m.index + m[0].length);
  const mHtml = /<html[^>]*>/i.exec(html);
  if (mHtml) return html.slice(0, mHtml.index + mHtml[0].length) + '<head>' + dau + '</head>' + html.slice(mHtml.index + mHtml[0].length);
  return dau + html;
}
