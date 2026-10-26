// Giả lập tối thiểu các dịch vụ của Apps Script để chạy mã máy chủ thật trong Vitest.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const thuMucSrc = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

class TrangTinh {
  constructor(ten, id) {
    this.ten = ten;
    this.id = id;
    this.dong = [];
  }
  getName() { return this.ten; }
  setName(t) { this.ten = t; }
  getSheetId() { return this.id; }
  getLastRow() { return this.dong.length; }
  getLastColumn() { return this.dong.reduce((m, r) => Math.max(m, r.length), 0); }
  setFrozenRows() {}
  appendRow(arr) { this.dong.push(arr.slice()); }
  deleteRow(r) { this.dong.splice(r - 1, 1); }
  getRange(r, c, nr = 1, nc = 1) {
    const sheet = this;
    return {
      getValues() {
        const kq = [];
        for (let i = 0; i < nr; i++) {
          const row = sheet.dong[r - 1 + i] || [];
          kq.push(Array.from({ length: nc }, (_, j) => (row[c - 1 + j] === undefined ? '' : row[c - 1 + j])));
        }
        return kq;
      },
      setValues(vals) {
        vals.forEach((rowVals, i) => {
          while (sheet.dong.length < r + i) sheet.dong.push([]);
          const row = sheet.dong[r - 1 + i];
          rowVals.forEach((v, j) => { row[c - 1 + j] = v; });
        });
      },
      setValue(v) { this.setValues([[v]]); },
      setFontWeight() { return this; },
    };
  }
}

export function taoMoiTruong() {
  let demId = 1;
  const cacTrang = [];
  const ss = {
    getId: () => 'ss1',
    getSheetByName: (ten) => cacTrang.find((s) => s.ten === ten) || null,
    insertSheet(ten) { const s = new TrangTinh(ten, demId++); cacTrang.push(s); return s; },
    getSheets: () => cacTrang.slice(),
    deleteSheet(s) { cacTrang.splice(cacTrang.indexOf(s), 1); },
  };
  const props = { GOOGLE_CLIENT_ID: 'client-test', OWNER_EMAIL: 'chu@x.vn' };
  const boNho = new Map();
  let dangGiu = false;
  const theo = { soLanGiuKhoa: 0 };
  const token = {};

  const env = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: {
      getScriptCache: () => ({
        get(k) { const e = boNho.get(k); if (!e) return null; if (e.het < Date.now()) { boNho.delete(k); return null; } return e.v; },
        put(k, v, giay) { boNho.set(k, { v: String(v), het: Date.now() + (giay || 600) * 1000 }); },
        remove(k) { boNho.delete(k); },
      }),
    },
    LockService: {
      getScriptLock: () => ({
        tryLock() { if (dangGiu) throw new Error('Khóa bị giữ lồng nhau'); dangGiu = true; theo.soLanGiuKhoa++; return true; },
        releaseLock() { dangGiu = false; },
      }),
    },
    UrlFetchApp: {
      fetch(url) {
        const t = decodeURIComponent(url.split('id_token=')[1]);
        const d = token[t];
        return { getResponseCode: () => (d ? 200 : 400), getContentText: () => JSON.stringify(d || {}) };
      },
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, s) => Array.from(createHash('sha256').update(String(s)).digest()).map((b) => (b > 127 ? b - 256 : b)),
      getUuid: () => randomUUID(),
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s) => ({ s, setMimeType() { return this; } }),
    },
    Logger: { log() {} },
    console: { error() {}, log() {} },
  };

  const cacFile = readdirSync(thuMucSrc).filter((f) => f.endsWith('.js'));
  const thuTu = ['schema.js', ...cacFile.filter((f) => f !== 'schema.js').sort()];
  const ma = thuTu.map((f) => readFileSync(join(thuMucSrc, f), 'utf8')).join('\n');
  const tenDichVu = Object.keys(env);
  const xuat = new Function(...tenDichVu, ma + '\nreturn { doPost, khoiTao, chotTuanTuDong };')(...tenDichVu.map((k) => env[k]));

  return {
    ...xuat,
    ss,
    props,
    boNho,
    theo,
    // Đăng ký một token Google giả cho email.
    datToken(email) {
      const t = `tok-${email}`;
      token[t] = { aud: 'client-test', email, email_verified: 'true', exp: String(Math.floor(Date.now() / 1000) + 3600) };
      return t;
    },
    // Gọi doPost như trình duyệt: body JSON, trả về đối tượng đã parse.
    goi(body) {
      return JSON.parse(xuat.doPost({ postData: { contents: JSON.stringify(body) } }).s);
    },
    docTab(ten) {
      const s = ss.getSheetByName(ten);
      if (!s || s.dong.length < 2) return [];
      const [tieuDe, ...hang] = s.dong;
      return hang.map((r) => Object.fromEntries(tieuDe.map((h, i) => [h, r[i] === undefined ? '' : r[i]])));
    },
    themDong(ten, obj) {
      const s = ss.getSheetByName(ten);
      s.appendRow(s.dong[0].map((h) => (obj[h] === undefined ? '' : obj[h])));
    },
  };
}
