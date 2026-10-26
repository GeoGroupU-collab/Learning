// Gom các file backend/src/*.js thành một Code.gs duy nhất để dán vào Apps Script.
// Thứ tự gom: schema.js trước (các file khác dùng nó), còn lại theo bảng chữ cái.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = join(dirname(fileURLToPath(import.meta.url)), '..');
const thuMucSrc = join(goc, 'backend', 'src');
const thuMucDich = join(goc, 'backend', 'dist');

const uuTien = ['schema.js'];
const tatCa = readdirSync(thuMucSrc).filter((f) => f.endsWith('.js'));
const thuTu = [...uuTien.filter((f) => tatCa.includes(f)), ...tatCa.filter((f) => !uuTien.includes(f)).sort()];

const phan = thuTu.map((f) => `// ===== ${f} =====\n${readFileSync(join(thuMucSrc, f), 'utf8')}`);
mkdirSync(thuMucDich, { recursive: true });
writeFileSync(join(thuMucDich, 'Code.gs'), phan.join('\n\n'), 'utf8');
copyFileSync(join(goc, 'backend', 'appsscript.json'), join(thuMucDich, 'appsscript.json'));
console.log(`Đã gom ${thuTu.length} file (${thuTu.join(', ')}) vào backend/dist/Code.gs`);
