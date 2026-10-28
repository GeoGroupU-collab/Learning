// Ghi huy hiệu 11 cấp bậc ra tệp SVG (public/anh/cap/) và một tờ xem trước. Chạy: npx vite-node scripts/tao-anh-cap.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAC_CAP, svgCap } from '../src/anh-cap';

mkdirSync('public/anh/cap', { recursive: true });
CAC_CAP.forEach((c, i) => writeFileSync(`public/anh/cap/${c.tep}.svg`, svgCap(i), 'utf8'));
const o = CAC_CAP.map((c, i) => `<figure><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCap(i))}" width="150" height="150"><figcaption>${c.ten}</figcaption></figure>`).join('');
writeFileSync('phat-cho-lop/cap-bac-xem-truoc.html', `<!doctype html><meta charset="utf-8"><title>Cấp bậc</title><style>body{font:16px Segoe UI,Arial;background:#eceff0;margin:24px}.l{display:flex;flex-wrap:wrap;gap:18px}figure{margin:0;text-align:center;background:#fff;border-radius:12px;padding:14px;width:180px}figcaption{font-weight:600;margin-top:6px}</style><div class="l">${o}</div>`, 'utf8');
console.log('Đã ghi', CAC_CAP.length, 'huy hiệu');
