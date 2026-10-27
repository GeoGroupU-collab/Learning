import { describe, expect, it } from 'vitest';
import { khoaDem } from '../src/nhac-ngu';

const gioVN = (s: string): number => Date.parse(`${s}+07:00`);

describe('khóa của một "đêm" nhắc ngủ', () => {
  it('từ 23:30 hôm trước đến 7:00 sáng hôm sau cùng một khóa, để bấm "đi ngủ" là tắt cả đêm', () => {
    const k = khoaDem(gioVN('2026-11-03T23:30:00'));
    expect(khoaDem(gioVN('2026-11-03T23:59:00'))).toBe(k);
    expect(khoaDem(gioVN('2026-11-04T00:01:00'))).toBe(k);
    expect(khoaDem(gioVN('2026-11-04T06:59:00'))).toBe(k);
  });
  it('đêm sau có khóa khác', () => {
    expect(khoaDem(gioVN('2026-11-04T23:40:00'))).not.toBe(khoaDem(gioVN('2026-11-03T23:40:00')));
  });
});
