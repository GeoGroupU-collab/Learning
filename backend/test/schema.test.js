import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const { TABS, CAU_HINH_MAC_DINH, MON_MAU } = createRequire(import.meta.url)('../src/schema.js');

describe('schema', () => {
  it('tên tab không trùng nhau', () => {
    const ten = TABS.map((t) => t.name);
    expect(new Set(ten).size).toBe(ten.length);
  });

  it('mỗi tab có tiêu đề cột không trùng', () => {
    for (const t of TABS) expect(new Set(t.headers).size, t.name).toBe(t.headers.length);
  });

  it('khóa cấu hình không trùng', () => {
    const khoa = CAU_HINH_MAC_DINH.map((c) => c[0]);
    expect(new Set(khoa).size).toBe(khoa.length);
  });

  it('có đủ 5 môn mẫu với mã duy nhất', () => {
    expect(new Set(MON_MAU.map((m) => m.maMon)).size).toBe(5);
  });
});
