// Tạo file PDF thông báo một trang để gửi cho các bạn chưa tham gia, kèm hai mã QR (Form đăng ký và web).
// Cách dùng: node scripts/tao-pdf-thong-bao.mjs "<link Google Form>"
// Kết quả: phat-cho-lop/THONG-BAO-LEARNING-GROUP.pdf (thư mục này nằm trong .gitignore). Cần Google Chrome.
import { writeFileSync, mkdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import QRCode from 'qrcode';

const goc = join(dirname(fileURLToPath(import.meta.url)), '..');
const linkForm = process.argv[2] ?? '';
if (!/^https:\/\/docs\.google\.com\/forms\/[^\s"<>]+$/.test(linkForm)) {
  console.error('Thiếu hoặc sai link Google Form. Ví dụ: node scripts/tao-pdf-thong-bao.mjs "https://docs.google.com/forms/d/e/.../viewform"');
  process.exit(1);
}
const linkWeb = 'https://geogroupu-collab.github.io/Learning/';

const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find((p) => existsSync(p));
if (!chrome) {
  console.error('Không tìm thấy Google Chrome. Đặt biến môi trường CHROME_PATH trỏ tới chrome.exe.');
  process.exit(1);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const qr = (link) => QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b3d2e', light: '#ffffff' } });
const [qrForm, qrWeb] = await Promise.all([qr(linkForm), qr(linkWeb)]);

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Learning Group - Thông báo</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font: 10pt/1.42 'Segoe UI', Arial, sans-serif; color: #16202a; width: 210mm; height: 297mm; padding: 0; background: #fff; }
  .trang { padding: 9mm 13mm 7mm; height: 297mm; display: flex; flex-direction: column; gap: 2.8mm; }
  .trang > * { flex-shrink: 0; }

  header { background: #0b4a3d; color: #fff; border-radius: 3.5mm; padding: 5mm 7mm 4.6mm; position: relative; overflow: hidden; }
  header::after { content: ''; position: absolute; right: -9mm; top: -9mm; width: 34mm; height: 34mm; border-radius: 50%; background: #d9a93a; opacity: .3; }
  header .nho { font: 600 7.6pt 'Consolas', monospace; letter-spacing: .1em; text-transform: uppercase; color: #bfe3d6; }
  header h1 { margin: 1mm 0 1.2mm; font-size: 24pt; line-height: 1.1; }
  header p { margin: 0; font-size: 10.6pt; color: #e3f5ee; max-width: 160mm; }

  .khong-bat-buoc { margin: 0; padding: 2.4mm 4mm; border-radius: 2.6mm; background: #e1f1ed; border: 1px solid #b6dccf; color: #0b4a3d; font-size: 10.4pt; text-align: center; }
  .gioi-thieu { margin: 0; font-size: 10.4pt; }
  .gioi-thieu b { color: #0b6e5a; }

  h2 { margin: 0 0 1.6mm; font-size: 12pt; color: #0b4a3d; }
  .ba { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .the { border: 1px solid #cfd8d4; border-radius: 3mm; padding: 3.4mm 3.6mm; background: #f6faf8; }
  .the .so { display: inline-grid; place-items: center; width: 6.2mm; height: 6.2mm; border-radius: 50%; background: #0b6e5a; color: #fff; font-weight: 700; font-size: 9pt; margin-right: 1.6mm; }
  .the h3 { margin: 0 0 1.4mm; font-size: 10.6pt; color: #0b4a3d; display: flex; align-items: center; }
  .the p { margin: 0 0 1mm; font-size: 9.2pt; }
  .the ul { margin: 1mm 0 0 4.2mm; padding: 0; font-size: 9.2pt; }
  .the li { margin: .6mm 0; }

  .diem { border: 1px solid #e0c36f; background: #fbf3dc; border-radius: 3mm; padding: 3mm 4mm; font-size: 9.4pt; display: grid; grid-template-columns: auto 1fr; gap: 0 4mm; align-items: center; }
  .diem .lon { font: 700 21pt/1 'Segoe UI', Arial, sans-serif; color: #7a4f00; }
  .diem .lon small { display: block; font: 500 7.4pt 'Segoe UI', Arial, sans-serif; color: #7a4f00; }
  .diem b { color: #7a4f00; }

  .thuong { display: grid; grid-template-columns: auto 1fr; gap: 3.4mm; align-items: center; background: #0b4a3d; color: #fff; border-radius: 3mm; padding: 3mm 4.4mm; font-size: 9.8pt; }
  .thuong .bieu { width: 9mm; height: 9mm; border-radius: 50%; background: #d9a93a; color: #2b1d00; display: grid; place-items: center; font-size: 14pt; }
  .buoc { display: grid; grid-template-columns: 1fr 1fr; gap: 3.4mm; }
  .qr-the { display: grid; grid-template-columns: 33mm 1fr; gap: 3.4mm; align-items: center; border: 2px solid #0b6e5a; border-radius: 3.4mm; padding: 3.4mm; }
  .qr-the.phu { border-color: #cfd8d4; }
  .qr-the .qr { width: 33mm; height: 33mm; }
  .qr-the .qr svg { width: 100%; height: 100%; display: block; }
  .qr-the h3 { margin: 0 0 1mm; font-size: 11pt; color: #0b4a3d; }
  .qr-the p { margin: 0 0 1mm; font-size: 9pt; }
  .link { font-size: 7.2pt; color: #3a4a55; word-break: break-all; }
  .link-web { font: 700 8.4pt 'Segoe UI', Arial, sans-serif; color: #0b4a3d; white-space: nowrap; }
  .han { display: inline-block; background: #0b6e5a; color: #fff; border-radius: 99px; padding: .3mm 2.6mm; font-weight: 700; font-size: 8.6pt; }

  .sap { margin: 0; font-size: 9.2pt; color: #3a4a55; border-top: 1px dashed #b7c4be; padding-top: 2.4mm; }
  footer { margin-top: auto; text-align: center; font-size: 8pt; color: #5b6a75; }
</style></head>
<body><div class="trang">

<header>
  <div class="nho">Câu lạc bộ học tập của lớp</div>
  <h1>Learning Group</h1>
  <p>Cùng ôn, cùng thi, cùng lên cấp. Web học nhóm do lớp mình tự làm, mời cả lớp tham gia.</p>
</header>

<p class="khong-bat-buoc"><b>Đây là hoạt động không bắt buộc</b>, nhưng đều mang lại lợi ích cho các bạn mà công sức bỏ ra <b>gần như bằng 0</b>.</p>

<p class="gioi-thieu">Học nhóm giúp điểm số tốt lên và rèn thêm nhiều kỹ năng khác. Web sẽ <b>chia nhóm theo học lực (GPA) rồi lấy trung bình</b>, nên điểm trung bình các nhóm ngang nhau. Bạn điểm cao kèm bạn điểm chưa cao, còn bạn nào cũng có thế mạnh riêng (như Anh văn) để cùng kéo nhau lên.</p>

<div>
  <h2>Web có gì?</h2>
  <div class="ba">
    <div class="the">
      <h3><span class="so">1</span>Bài học trực quan</h3>
      <p>Bài học làm từ slide của thầy cô, có <b>hình minh họa và công cụ tương tác</b> cho những môn khó hình dung khi đọc sách.</p>
    </div>
    <div class="the">
      <h3><span class="so">2</span>Tự tạo đề luyện tập</h3>
      <p>Chọn môn, chọn chương và làm đề 30 câu để ôn thi.</p>
      <ul>
        <li>Mỗi tuần <b>nộp 15 câu hỏi</b> (3 môn, mỗi môn 5 câu) từ <b>Thứ 2 đến Thứ 6</b> mới mở khóa tính năng này.</li>
        <li>Khó soạn câu hỏi? Có <b>prompt mẫu</b> để nhờ AI soạn giúp. Đây cũng là cách tập <b>dùng AI trong học tập</b>.</li>
      </ul>
    </div>
    <div class="the">
      <h3><span class="so">3</span>Sự kiện hằng tuần</h3>
      <p><b>Thứ 7 và Chủ nhật</b> mở phòng thi: tự chọn 2 môn, mỗi môn 20 câu, <b>40 câu trong 40 phút</b>.</p>
      <ul>
        <li>Điểm nhóm = <b>trung bình điểm các thành viên</b>. Ai không thi tính <b>0 điểm</b>.</li>
        <li>Cùng nhau nhắc nhau thi nhé!</li>
      </ul>
    </div>
  </div>
</div>

<div class="diem">
  <div class="lon">+50<small>điểm cho nhóm nhất tuần</small></div>
  <div>Nhóm có điểm cao nhất tuần được <b>+50 điểm</b> và <b>vinh danh ở trang chủ</b> (nhóm nhì +30, các nhóm còn lại +10). Mỗi bạn còn có <b>rank riêng</b> với huy hiệu từ <b>Gỗ lên Thách Đấu</b>: làm đề luyện tập được thêm điểm để lên cấp, bạn điểm cao nhất tuần nhận danh hiệu.</div>
</div>

<div class="thuong">
  <div class="bieu">★</div>
  <div><b>Phần thưởng cá nhân của học kỳ này: một chuyến đi thực địa cùng Thầy Cô trong khoa.</b> Cơ hội để cả lớp vừa học vừa trải nghiệm ngoài thực tế.</div>
</div>

<div>
  <h2>Tham gia chỉ 2 bước</h2>
  <div class="buoc">
    <div class="qr-the">
      <div class="qr">${qrForm}</div>
      <div>
        <h3>Bước 1. Điền Form đăng ký</h3>
        <p><span class="han">Trước 5/11</span></p>
        <p>Điền họ tên và <b>GPA thang 4</b>, hãy điền trung thực để chia nhóm công bằng. GPA chỉ lớp trưởng xem, không ai khác thấy.</p>
        <div class="link">${esc(linkForm)}</div>
      </div>
    </div>
    <div class="qr-the phu">
      <div class="qr">${qrWeb}</div>
      <div>
        <h3>Bước 2. Đăng nhập web</h3>
        <p>Điền Form xong thì vào web, bấm <b>Đăng nhập bằng Google</b> bằng <b>đúng tài khoản đã dùng khi điền Form</b>. Nên mở bằng Chrome hoặc Safari.</p>
        <div class="link-web">${esc(linkWeb.replace('https://', ''))}</div>
      </div>
    </div>
  </div>
</div>

<p class="sap"><b>Sắp tới:</b> các hoạt động nghiên cứu khoa học và Anh văn sẽ được cập nhật và thông báo trên web. Sẽ có <b>nhiều hoạt động định hướng cho tương lai</b> của các bạn. Mình cũng sẽ thêm tài liệu các môn đại cương để bạn nào cần cải thiện có thể lấy về ôn lại. Có gì chưa rõ cứ hỏi lớp trưởng.</p>

<footer>Learning Group · ${esc(linkWeb)}</footer>
</div></body></html>`;

const thuMuc = join(goc, 'phat-cho-lop');
mkdirSync(thuMuc, { recursive: true });
const fileHtml = join(thuMuc, 'thong-bao-learning-group.html');
const filePdf = join(thuMuc, 'THONG-BAO-LEARNING-GROUP.pdf');
writeFileSync(fileHtml, html, 'utf8');

const hoSo = mkdtempSync(join(tmpdir(), 'chrome-pdf-'));
execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${hoSo}`, `--print-to-pdf=${filePdf}`, pathToFileURL(fileHtml).href], { stdio: 'ignore', timeout: 120000 });
if (!existsSync(filePdf)) {
  console.error('Chrome không tạo được file PDF.');
  process.exit(1);
}
console.log(`Đã tạo ${filePdf}`);
