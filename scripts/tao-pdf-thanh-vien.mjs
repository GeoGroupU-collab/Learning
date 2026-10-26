// Tạo file PDF hướng dẫn thành viên, kèm mã QR dẫn tới Google Form đăng ký.
// Cách dùng: node scripts/tao-pdf-thanh-vien.mjs "<link Google Form>"
// Kết quả: phat-cho-lop/HUONG-DAN-THANH-VIEN.pdf (thư mục này nằm trong .gitignore, không bị đưa lên GitHub).
// Cần Google Chrome (dùng chế độ in ra PDF không giao diện).
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { marked } from 'marked';
import QRCode from 'qrcode';

const goc = join(dirname(fileURLToPath(import.meta.url)), '..');
const linkForm = process.argv[2] ?? '';
if (!/^https:\/\/docs\.google\.com\/forms\/[^\s"<>]+$/.test(linkForm)) {
  console.error('Thiếu hoặc sai link Google Form. Ví dụ: node scripts/tao-pdf-thanh-vien.mjs "https://docs.google.com/forms/d/e/.../viewform"');
  process.exit(1);
}
const linkWeb = 'https://geogroupu-collab.github.io/Learning/';

const chromeUngVien = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chrome = chromeUngVien.find((p) => existsSync(p));
if (!chrome) {
  console.error('Không tìm thấy Google Chrome. Đặt biến môi trường CHROME_PATH trỏ tới chrome.exe.');
  process.exit(1);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = readFileSync(join(goc, 'HUONG-DAN-THANH-VIEN.md'), 'utf8').replace(/^# .*\n/, '');
const noiDung = marked.parse(md, { gfm: true });
const qr = await QRCode.toString(linkForm, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b0f2e', light: '#ffffff' } });

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Learning Group - Hướng dẫn thành viên</title>
<style>
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; }
  body { font: 11pt/1.5 'Segoe UI', Arial, sans-serif; color: #1b1f3b; margin: 0; }
  header { background: #232a6b; color: #fff; padding: 14px 18px; border-radius: 10px; margin-bottom: 14px; }
  header h1 { margin: 0; font-size: 19pt; }
  header p { margin: 2px 0 0; color: #c9d1ff; }
  .dang-ky { display: flex; gap: 18px; align-items: center; border: 2px solid #4cc9f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; break-inside: avoid; }
  .dang-ky .chu { flex: 1; }
  .dang-ky h2 { margin: 0 0 4px; font-size: 14pt; color: #232a6b; }
  .dang-ky ol { margin: 4px 0 6px 18px; padding: 0; }
  .dang-ky .link { font-size: 8.5pt; word-break: break-all; color: #3340a8; }
  .dang-ky .qr { width: 42mm; height: 42mm; flex: none; }
  .dang-ky .qr svg { width: 100%; height: 100%; display: block; }
  .dang-ky .qr-chu { text-align: center; font-size: 8.5pt; margin-top: 2px; }
  h2 { font-size: 14pt; color: #232a6b; border-bottom: 2px solid #e1e5ff; padding-bottom: 2px; margin: 16px 0 6px; break-after: avoid; }
  ul, ol { margin: 4px 0 8px 20px; padding: 0; }
  li { margin: 2px 0; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0 10px; font-size: 10pt; break-inside: avoid; }
  th, td { border: 1px solid #b9c0ee; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #eef0ff; }
  blockquote { margin: 6px 0; padding: 4px 10px; border-left: 4px solid #4cc9f0; background: #f4f8ff; }
  a { color: #3340a8; text-decoration: none; }
  code { background: #eef0ff; padding: 0 3px; border-radius: 3px; }
  footer { margin-top: 14px; font-size: 8.5pt; color: #666; text-align: center; }
</style></head>
<body>
<header><h1>Learning Group</h1><p>Hướng dẫn dành cho thành viên</p></header>

<section class="dang-ky">
  <div class="chu">
    <h2>Đăng ký tham gia</h2>
    <ol>
      <li>Quét mã QR bên phải bằng camera điện thoại.</li>
      <li>Mở bằng <b>Chrome hoặc Safari</b>, đăng nhập tài khoản Google bạn muốn dùng.</li>
      <li>Điền họ tên và GPA, tích đồng ý, gửi. Mỗi người điền <b>một lần</b>.</li>
    </ol>
    <div>GPA chỉ lớp trưởng xem được và dùng để chia nhóm cân bằng. Hạn đăng ký: đến hết <b>5/11</b>.</div>
    <div class="link">Không quét được: ${esc(linkForm)}</div>
    <div class="link">Sau khi được duyệt, vào web tại: ${esc(linkWeb)}</div>
  </div>
  <div>
    <div class="qr">${qr}</div>
    <div class="qr-chu">Quét để đăng ký</div>
  </div>
</section>

${noiDung}

<footer>Learning Group · ${esc(linkWeb)}</footer>
</body></html>`;

const thuMuc = join(goc, 'phat-cho-lop');
mkdirSync(thuMuc, { recursive: true });
const fileHtml = join(thuMuc, 'huong-dan-thanh-vien.html');
const filePdf = join(thuMuc, 'HUONG-DAN-THANH-VIEN.pdf');
writeFileSync(fileHtml, html, 'utf8');

const hoSo = mkdtempSync(join(tmpdir(), 'chrome-pdf-'));
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${hoSo}`,
  `--print-to-pdf=${filePdf}`, pathToFileURL(fileHtml).href,
], { stdio: 'ignore', timeout: 120000 });

if (!existsSync(filePdf)) {
  console.error('Chrome không tạo được file PDF.');
  process.exit(1);
}
console.log(`Đã tạo ${filePdf}`);
