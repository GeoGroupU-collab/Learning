import { describe, expect, it, vi } from 'vitest';
import { TIEN_TO_BAI_HOC, apDungTinNhan, chenLopCachLy, docDuLieuBaiHoc, type KhoLuu } from '../src/bai-hoc-cach-ly';

function khoGia(dau: Record<string, string> = {}): KhoLuu & { du: Map<string, string> } {
  const du = new Map(Object.entries(dau));
  return {
    du,
    getItem: (k) => (du.has(k) ? du.get(k)! : null),
    setItem: (k, v) => { du.set(k, v); },
    removeItem: (k) => { du.delete(k); },
    key: (i) => [...du.keys()][i] ?? null,
    get length() { return du.size; },
  };
}

// Chạy đoạn script đã chèn trong một "cửa sổ" giả, trả về cửa sổ và các tin nhắn đã gửi lên web.
function chayTrongKhung(html: string): { win: Record<string, unknown>; tin: unknown[] } {
  const ma = /<script>([\s\S]*?)<\/script>/.exec(html)![1];
  const tin: unknown[] = [];
  const win: Record<string, unknown> = {};
  const parent = { postMessage: (m: unknown) => tin.push(JSON.parse(JSON.stringify(m))) };
  new Function('window', 'parent', ma)(win, parent);
  return { win, tin };
}

describe('chèn lớp cách ly vào bài học', () => {
  it('chèn base và script ngay sau thẻ head', () => {
    const kq = chenLopCachLy('<!doctype html><html><head><title>x</title></head><body>hi</body></html>', {}, 'https://a.b/bai-hoc/hk/mon/bai 1.html');
    expect(kq).toMatch(/^<!doctype html><html><head><base href="https:\/\/a\.b\/bai-hoc\/hk\/mon\/bai 1\.html"><script>/);
    expect(kq).toContain('<title>x</title>');
  });

  it('bài không có thẻ head vẫn được chèn', () => {
    expect(chenLopCachLy('<html><body>x</body></html>', {}, 'u')).toMatch(/^<html><head><base href="u"><script>.*<\/script><\/head><body>/);
    expect(chenLopCachLy('<p>x</p>', {}, 'u').startsWith('<base href="u"><script>')).toBe(true);
  });

  it('dữ liệu đã lưu có chứa </script> không phá được khung', () => {
    const kq = chenLopCachLy('<head></head>', { a: '</script><img src=x onerror=alert(1)>' }, 'u');
    expect(kq.split('</script>').length - 1).toBe(1);
    const { win } = chayTrongKhung(kq);
    expect((win.localStorage as Storage).getItem('a')).toBe('</script><img src=x onerror=alert(1)>');
  });

  it('localStorage trong khung đọc dữ liệu cũ, ghi thì báo lên web; sessionStorage chỉ nằm trong khung', () => {
    const { win, tin } = chayTrongKhung(chenLopCachLy('<head></head>', { tienDo: '3' }, 'u'));
    const ls = win.localStorage as Storage;
    expect(ls.getItem('tienDo')).toBe('3');
    expect(ls.length).toBe(1);
    ls.setItem('tienDo', 4 as unknown as string);
    ls.removeItem('cu');
    ls.clear();
    expect(ls.getItem('tienDo')).toBeNull();
    (win.sessionStorage as Storage).setItem('tam', '1');
    expect(tin).toEqual([
      { op: 'set', k: 'tienDo', v: '4', __lgBaiHoc: 1 },
      { op: 'remove', k: 'cu', __lgBaiHoc: 1 },
      { op: 'clear', __lgBaiHoc: 1 },
    ]);
  });
});

describe('web nhận tin nhắn từ khung bài học', () => {
  it('lưu dưới khóa có tiền tố riêng, không đụng khóa của web', () => {
    const kho = khoGia({ lg_phien: 'bi-mat' });
    expect(apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'set', k: 'lg_phien', v: 'x' })).toBe(true);
    expect(kho.getItem('lg_phien')).toBe('bi-mat');
    expect(kho.getItem(TIEN_TO_BAI_HOC + 'lg_phien')).toBe('x');
  });

  it('clear chỉ xóa dữ liệu bài học', () => {
    const kho = khoGia({ lg_phien: 'p', [TIEN_TO_BAI_HOC + 'a']: '1', [TIEN_TO_BAI_HOC + 'b']: '2' });
    apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'clear' });
    expect([...kho.du.keys()]).toEqual(['lg_phien']);
  });

  it('bỏ qua tin sai dạng, khóa rỗng, giá trị quá lớn', () => {
    const kho = khoGia();
    expect(apDungTinNhan(kho, null)).toBe(false);
    expect(apDungTinNhan(kho, { op: 'set', k: 'a', v: '1' })).toBe(false);
    expect(apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'set', k: '', v: '1' })).toBe(false);
    expect(apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'set', k: 'a', v: 'x'.repeat(200001) })).toBe(false);
    expect(apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'xoaHet' })).toBe(false);
    expect(kho.length).toBe(0);
  });

  it('giới hạn 500 khóa, nhưng vẫn sửa được khóa đã có', () => {
    const dau: Record<string, string> = {};
    for (let i = 0; i < 500; i++) dau[TIEN_TO_BAI_HOC + i] = 'v';
    const kho = khoGia(dau);
    expect(apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'set', k: 'moi', v: '1' })).toBe(false);
    expect(apDungTinNhan(kho, { __lgBaiHoc: 1, op: 'set', k: '7', v: 'sua' })).toBe(true);
    expect(kho.getItem(TIEN_TO_BAI_HOC + '7')).toBe('sua');
  });

  it('đọc dữ liệu: lấy tiến độ cũ (trước khi cách ly), không lấy khóa của web, bản mới ưu tiên hơn bản cũ', () => {
    const kho = khoGia({ lg_phien: 'p', lg_theme: 'toi', g_state: 'x', diemQuiz: 'cu', [TIEN_TO_BAI_HOC + 'diemQuiz']: 'moi', [TIEN_TO_BAI_HOC + 'b']: '2' });
    expect(docDuLieuBaiHoc(kho)).toEqual({ diemQuiz: 'moi', b: '2' });
    vi.restoreAllMocks();
  });
});
