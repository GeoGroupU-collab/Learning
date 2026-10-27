import { describe, expect, it } from 'vitest';
import { boDauCode, chuTomTat, laDapAnCode, tachDoan } from '../src/van-ban-cau';

describe('tách khối code trong câu hỏi', () => {
  it('chữ thường và khối code xen kẽ', () => {
    const d = tachDoan('Đoạn code sau in ra gì?\n```\nx = 1\nprint(x)\n```\nChọn đáp án.');
    expect(d.map((x) => x.ma)).toEqual([false, true, false]);
    expect(d[1].chu).toBe('x = 1\nprint(x)');
    expect(d[0].chu).toBe('Đoạn code sau in ra gì?\n');
  });
  it('giữ nguyên thụt lề trong code', () => {
    expect(tachDoan('```\nfor i in r:\n    print(i)\n```')[0].chu).toBe('for i in r:\n    print(i)');
  });
  it('không có khối code thì chỉ là một đoạn chữ; khối chưa đóng coi như code', () => {
    expect(tachDoan('Câu thường')).toEqual([{ ma: false, chu: 'Câu thường' }]);
    expect(tachDoan('Hỏi\n```\nx = 1').map((x) => x.ma)).toEqual([false, true]);
    expect(tachDoan('')).toEqual([]);
  });
});

describe('đáp án là code', () => {
  it('bọc trọn trong dấu ` thì là code, giữ khoảng trắng bên trong', () => {
    expect(laDapAnCode('`[   An][8.5]`')).toBe(true);
    expect(boDauCode('`[   An][8.5]`')).toBe('[   An][8.5]');
    expect(boDauCode('`a\n    b`')).toBe('a\n    b');
  });
  it('đáp án thường hoặc có dấu ` giữa chữ thì không bị đổi', () => {
    expect(laDapAnCode('(1) str (2) float')).toBe(false);
    expect(laDapAnCode('dùng `len` ở đây')).toBe(false);
    expect(boDauCode('(1) str (2) float')).toBe('(1) str (2) float');
    expect(laDapAnCode('`')).toBe(false);
  });
  it('tóm tắt một dòng', () => {
    expect(chuTomTat('A\n```\nx = 1\n```\nB')).toBe('A x = 1 B');
    expect(chuTomTat('x'.repeat(100)).length).toBe(73);
  });
});
