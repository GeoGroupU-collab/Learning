import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { CAC_CAP, chiSoCap, svgCap } from '../src/anh-cap';

const L = createRequire(import.meta.url)('../backend/src/logic.js') as { CAP_LON: { ten: string }[] };

describe('huy hiệu cấp bậc', () => {
  it('tên và thứ tự cấp khớp với máy chủ, đúng 11 cấp từ Gỗ đến Thách Đấu', () => {
    expect(CAC_CAP.map((c) => c.ten)).toEqual(L.CAP_LON.map((c) => c.ten));
    expect(CAC_CAP).toHaveLength(11);
    expect(CAC_CAP[0].ten).toBe('Gỗ');
    expect(CAC_CAP[10].ten).toBe('Thách Đấu');
  });

  it('mỗi cấp có một hình riêng, là SVG hợp lệ, nhỏ gọn và không chứa mã chạy được', () => {
    const tatCa = CAC_CAP.map((_, i) => svgCap(i));
    expect(new Set(tatCa).size).toBe(11);
    tatCa.forEach((s, i) => {
      expect(s.startsWith('<svg')).toBe(true);
      expect(s.endsWith('</svg>')).toBe(true);
      expect(s).not.toMatch(/<script|onload|onerror|javascript:/i);
      expect(s.length).toBeLessThan(6000);
      expect(s).toContain(`id="c${i}a"`);
    });
  });

  it('tên tệp không trùng, tên cấp tra ngược ra đúng chỉ số; tên lạ thì về cấp đầu', () => {
    expect(new Set(CAC_CAP.map((c) => c.tep)).size).toBe(11);
    expect(chiSoCap('Kim Cương')).toBe(7);
    expect(chiSoCap('  thách đấu ')).toBe(10);
    expect(chiSoCap('Võ Sĩ')).toBe(0);
  });
});
