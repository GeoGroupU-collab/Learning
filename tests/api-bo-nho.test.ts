import { beforeEach, describe, expect, it, vi } from 'vitest';

// Kiểm tra bộ nhớ tạm của web quản trị: lệnh đọc được nhớ, lệnh ghi xóa bộ nhớ, web lớp không bị ảnh hưởng.
let soLan: Record<string, number>;

async function taiApi() {
  vi.resetModules();
  soLan = {};
  vi.stubGlobal('fetch', vi.fn(async (_u: string, init: { body: string }) => {
    const { action } = JSON.parse(init.body) as { action: string };
    soLan[action] = (soLan[action] ?? 0) + 1;
    return { json: async () => ({ ok: true, data: { lan: soLan[action], ds: [1, 2] } }) };
  }));
  return await import('../src/api');
}

beforeEach(() => vi.unstubAllGlobals());

describe('bộ nhớ tạm web quản trị', () => {
  it('chưa bật thì không nhớ gì (web lớp)', async () => {
    const { goi } = await taiApi();
    await goi('admin.dsThanhVien');
    await goi('admin.dsThanhVien');
    expect(soLan['admin.dsThanhVien']).toBe(2);
  });

  it('bật rồi: lệnh đọc gọi một lần, lần sau lấy từ bộ nhớ, khác tham số thì gọi lại', async () => {
    const { goi, batBoNhoAdmin } = await taiApi();
    batBoNhoAdmin();
    await goi('admin.dsThanhVien');
    await goi('admin.dsThanhVien');
    expect(soLan['admin.dsThanhVien']).toBe(1);
    await goi('admin.nganHang', { trang: 1 });
    await goi('admin.nganHang', { trang: 2 });
    expect(soLan['admin.nganHang']).toBe(2);
  });

  it('gọi trùng lúc đang chờ chỉ gửi một yêu cầu (gọi sẵn rồi mở tab)', async () => {
    const { goi, batBoNhoAdmin } = await taiApi();
    batBoNhoAdmin();
    await Promise.all([goi('admin.dsThongBao'), goi('admin.dsThongBao')]);
    expect(soLan['admin.dsThongBao']).toBe(1);
  });

  it('lệnh ghi xóa bộ nhớ nên đọc lại số liệu mới; lệnh xem trước/xuất không xóa', async () => {
    const { goi, batBoNhoAdmin } = await taiApi();
    batBoNhoAdmin();
    await goi('admin.dsThongBao');
    await goi('admin.xemTruocNhap', { rows: [] });
    await goi('admin.dsThongBao');
    expect(soLan['admin.dsThongBao']).toBe(1);
    await goi('admin.guiThongBao', { tieuDe: 'x' });
    await goi('admin.dsThongBao');
    expect(soLan['admin.dsThongBao']).toBe(2);
  });

  it('kết quả trả về là bản sao: sửa tại chỗ không làm hỏng bộ nhớ', async () => {
    const { goi, batBoNhoAdmin } = await taiApi();
    batBoNhoAdmin();
    const a = await goi<{ ds: number[] }>('admin.dsTuan');
    a.ds.push(99);
    const b = await goi<{ ds: number[] }>('admin.dsTuan');
    expect(b.ds).toEqual([1, 2]);
  });

  it('hết 60 giây thì gọi lại', async () => {
    vi.useFakeTimers();
    const { goi, batBoNhoAdmin } = await taiApi();
    batBoNhoAdmin();
    await goi('admin.dsMon');
    vi.setSystemTime(Date.now() + 61000);
    await goi('admin.dsMon');
    expect(soLan['admin.dsMon']).toBe(2);
    vi.useRealTimers();
  });
});
