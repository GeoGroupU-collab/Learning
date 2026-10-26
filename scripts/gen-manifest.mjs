// Quét public/bai-hoc/<học kỳ>/<môn>/ và sinh public/bai-hoc/manifest.json.
// Ngày cập nhật lấy từ lịch sử git (commit gần nhất của file); không có git thì dùng ngày sửa file.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const goc = join(dirname(fileURLToPath(import.meta.url)), '..');
const thuMucBaiHoc = join(goc, 'public', 'bai-hoc');

function ngayCapNhat(duongDan) {
  try {
    const kq = execFileSync('git', ['log', '-1', '--format=%cI', '--', duongDan], { cwd: goc, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (kq) return kq;
  } catch {
    /* không có git, dùng ngày sửa file */
  }
  return statSync(duongDan).mtime.toISOString();
}

function tenBai(duongDan, file) {
  const noiDung = readFileSync(duongDan, 'utf8');
  const m = noiDung.match(/<title[^>]*>([^<]*)<\/title>/i);
  const ten = m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';
  return ten || file.replace(/\.html$/i, '');
}

const thuMuc = (p) => readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

const manifest = { hocKy: [] };
if (existsSync(thuMucBaiHoc)) {
  for (const hk of thuMuc(thuMucBaiHoc)) {
    const mon = [];
    for (const maMon of thuMuc(join(thuMucBaiHoc, hk))) {
      const dir = join(thuMucBaiHoc, hk, maMon);
      const fileMon = join(dir, 'mon.json');
      const thongTin = existsSync(fileMon) ? JSON.parse(readFileSync(fileMon, 'utf8')) : {};
      const baiHoc = readdirSync(dir)
        .filter((f) => f.toLowerCase().endsWith('.html'))
        .sort()
        .map((f) => ({ file: f, ten: tenBai(join(dir, f), f), capNhat: ngayCapNhat(join(dir, f)) }));
      mon.push({ ma: maMon, ten: thongTin.ten || maMon, mau: thongTin.mau || '#4cc9f0', chuong: thongTin.chuong || [], baiHoc });
    }
    manifest.hocKy.push({ ma: hk, mon });
  }
}
writeFileSync(join(thuMucBaiHoc, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`manifest.json: ${manifest.hocKy.length} học kỳ, ${manifest.hocKy.reduce((s, h) => s + h.mon.reduce((t, m) => t + m.baiHoc.length, 0), 0)} bài học`);
