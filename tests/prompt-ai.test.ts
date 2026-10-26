import { describe, expect, it } from 'vitest';
import { docCauHoiTuAi, taoPromptMd } from '../src/prompt-ai';
import { nhanHuyHieu, tinhHuyHieu } from '../src/huy-hieu';
import type { MonNop } from '../src/types';

const MON: MonNop[] = [
  { ma: 'kh', ten: 'Khoa học dữ liệu', mau: '#fff', chuong: [{ ma: 'c1', ten: 'Chương 1: Mở đầu' }, { ma: 'c2', ten: 'Chương 2: Thống kê' }] },
  { ma: 'dc', ten: 'Địa chất kiến trúc', mau: '#fff', chuong: [] },
  { ma: 'tr', ten: 'Triết học Mác-Lênin', mau: '#fff', chuong: [{ ma: 'c1', ten: 'Chương 1' }] },
];

describe('file prompt mẫu cho AI', () => {
  const md = taoPromptMd([MON[0], MON[1]], 5);

  it('có phần hướng dẫn cho người dùng: bỏ file cho AI, đưa tài liệu, nêu môn và chương', () => {
    expect(md).toContain('Bỏ file .md này vào AI');
    expect(md).toContain('Đưa thêm tài liệu tham khảo');
    expect(md).toContain('Nói rõ môn và chương');
    expect(md).toContain('Tự kiểm tra từng câu với tài liệu gốc');
  });

  it('có 5 câu mẫu cho mỗi môn đã chọn và không có môn khác', () => {
    expect(md).toContain('## Môn: Khoa học dữ liệu');
    expect(md).toContain('## Môn: Địa chất kiến trúc');
    expect(md).not.toContain('## Môn: Triết học');
    const phanMau = md.slice(md.indexOf('### Mẫu cần điền'));
    expect((phanMau.match(/### Câu \d/g) ?? []).length).toBe(10);
    expect((phanMau.match(/^Đáp án đúng:/gm) ?? []).length).toBe(10);
  });

  it('liệt kê đúng tên chương của từng môn để AI ghi chính xác', () => {
    expect(md).toContain('- Chương 1: Mở đầu');
    expect(md).toContain('- Chương 2: Thống kê');
    expect(md).toContain('chưa có danh sách chương');
  });

  it('nêu quy tắc: 4 đáp án, 1 đúng, trang nguồn bắt buộc, chỉ dựa trên tài liệu', () => {
    expect(md).toContain('đúng 4 đáp án A, B, C, D');
    expect(md).toContain('Trang nguồn');
    expect(md).toContain('chỉ dựa trên tài liệu');
  });

  it('phần mẫu điền sẵn của AI đọc lại được (vòng khứ hồi, toàn bộ là chỗ trống)', () => {
    const r = docCauHoiTuAi(md.slice(md.indexOf('### Mẫu cần điền')), [MON[0], MON[1]], 5);
    expect(r.mon.map((m) => m.ma)).toEqual(['kh', 'dc']);
    r.mon.forEach((m) => expect(m.cau).toHaveLength(5));
    expect(r.mon[0].cau[0].noiDung).toBe(''); // <...> được coi là chỗ trống
  });
});

const VD_AI = `Đây là câu hỏi bạn yêu cầu:

## Môn: Khoa học dữ liệu

### Câu 1
**Chương:** Chương 2: Thống kê
**Trang nguồn:** tr. 14
**Câu hỏi:** Giá trị trung vị của dãy số 3, 5, 9 là bao nhiêu?
A. 3
B. 5
C. 9
D. 17/3
**Đáp án đúng:** B
**Giải thích:** Sắp xếp tăng dần thì số ở giữa là 5.

### Câu 2
Chương: Chương 1
Trang nguồn: slide 3
Câu hỏi: Dữ liệu có cấu trúc thường được lưu ở đâu?
(tiếp tục câu hỏi trên dòng thứ hai)
A) Bảng quan hệ
B) Ảnh
C) Âm thanh
D) Video
Đáp án đúng: A. Bảng quan hệ
Giải thích: Dữ liệu có cấu trúc dạng bảng.
Dòng giải thích thứ hai.
`;

describe('đọc câu hỏi AI trả về', () => {
  it('đọc đủ trường, bỏ in đậm, nối các dòng, khớp chương theo tên', () => {
    const r = docCauHoiTuAi(VD_AI, MON, 5);
    expect(r.mon).toHaveLength(1);
    const [c1, c2] = r.mon[0].cau;
    expect(c1).toMatchObject({ maChuong: 'c2', trangNguon: 'tr. 14', noiDung: 'Giá trị trung vị của dãy số 3, 5, 9 là bao nhiêu?', A: '3', B: '5', C: '9', D: '17/3', dapAn: 'B' });
    expect(c1.giaiThich).toContain('số ở giữa là 5');
    expect(c2.dapAn).toBe('A');
    expect(c2.maChuong).toBe('c1'); // "Chương 1" khớp "Chương 1: Mở đầu" (chứa nhau)
    expect(c2.noiDung).toContain('dòng thứ hai');
    expect(c2.A).toBe('Bảng quan hệ');
    expect(c2.giaiThich).toContain('thứ hai');
  });

  it('báo mới có 2 trên 5 câu', () => {
    const r = docCauHoiTuAi(VD_AI, MON, 5);
    expect(r.mon[0].canhBao.join(' ')).toContain('Mới có 2/5 câu');
    expect(r.tongCau).toBe(2);
  });

  it('báo chương không khớp và trường thiếu', () => {
    const van = `## Môn: Khoa học dữ liệu\n### Câu 1\nChương: Chương 9 không có\nCâu hỏi: Hỏi gì đó?\nA. a\nB. b\nC. c\nĐáp án đúng: Z\n`;
    const r = docCauHoiTuAi(van, MON, 1);
    const cb = r.mon[0].canhBao.join('|');
    expect(cb).toContain('chương "Chương 9 không có" không có trong danh sách');
    expect(cb).toContain('thiếu đáp án D');
    expect(cb).toContain('chưa có đáp án đúng');
    expect(cb).toContain('thiếu trang nguồn');
    expect(r.mon[0].cau[0].maChuong).toBe('');
  });

  it('môn không có danh sách chương thì giữ nguyên chữ AI ghi', () => {
    const van = `## Môn: Địa chất kiến trúc\n### Câu 1\nChương: Nếp uốn\nTrang nguồn: tr. 1\nCâu hỏi: Q?\nA. a\nB. b\nC. c\nD. d\nĐáp án đúng: C\n`;
    const r = docCauHoiTuAi(van, MON, 5);
    expect(r.mon[0].ma).toBe('dc');
    expect(r.mon[0].cau[0].maChuong).toBe('Nếp uốn');
  });

  it('nhiều môn trong một lần dán; khối không nhận ra bị bỏ qua có báo', () => {
    const mau = (n: string) => `## Môn: ${n}\n### Câu 1\nChương: Chương 1\nTrang nguồn: 1\nCâu hỏi: Q ${n}?\nA. a\nB. b\nC. c\nD. d\nĐáp án đúng: A\n`;
    const r = docCauHoiTuAi(`${mau('Khoa học dữ liệu')}\n${mau('Triết học Mác-Lênin')}\n${mau('Môn lạ hoắc')}`, MON, 1);
    expect(r.mon.map((m) => m.ma)).toEqual(['kh', 'tr']);
    expect(r.canhBaoChung.join(' ')).toContain('Không nhận ra môn "Môn lạ hoắc"');
  });

  it('chỉ có một môn mà AI không ghi tên môn thì gán vào môn đó', () => {
    const van = `### Câu 1\nChương: Chương 1\nTrang nguồn: 1\nCâu hỏi: Q?\nA. a\nB. b\nC. c\nD. d\nĐáp án đúng: D\n`;
    const r = docCauHoiTuAi(van, [MON[2]], 5);
    expect(r.mon[0].ma).toBe('tr');
    expect(r.mon[0].cau[0].dapAn).toBe('D');
  });

  it('thừa câu thì chỉ lấy đủ số cần; văn bản rác thì báo không tìm thấy', () => {
    const nhieu = Array.from({ length: 7 }, (_, i) => `### Câu ${i + 1}\nChương: Chương 1\nTrang nguồn: ${i}\nCâu hỏi: Q${i}?\nA. a\nB. b\nC. c\nD. d\nĐáp án đúng: A\n`).join('\n');
    const r = docCauHoiTuAi(`## Môn: Triết học Mác-Lênin\n${nhieu}`, MON, 5);
    expect(r.mon[0].cau).toHaveLength(5);
    expect(r.mon[0].canhBao.join(' ')).toContain('chỉ lấy 5 câu đầu');
    expect(docCauHoiTuAi('Xin chào, tôi không hiểu yêu cầu.', MON, 5).canhBaoChung[0]).toContain('Không tìm thấy câu hỏi');
  });

  it('chấp nhận khối mã và dòng ngăn cách', () => {
    const van = '```\n## Môn: Triết học Mác-Lênin\n---\n### Câu 1\nChương: Chương 1\nTrang nguồn: 2\nCâu hỏi: Q?\nA. a\nB. b\nC. c\nD. d\nĐáp án đúng: B\n```';
    expect(docCauHoiTuAi(van, MON, 5).mon[0].cau[0].dapAn).toBe('B');
  });
});

describe('huy hiệu nhóm', () => {
  const nhom = (maNhom: string, hang: number, soThamGia: number, soTinh: number) => ({ maNhom, tenNhom: maNhom, diem: 50, hang, soThamGia, soTinh });
  const tuan = (soTuan: number, ...n: ReturnType<typeof nhom>[]) => ({ soTuan, daChot: true, nhom: n });

  it('Đủ quân khi 100% thành viên tính đều tham gia', () => {
    const h = tinhHuyHieu([tuan(1, nhom('a', 1, 6, 6)), tuan(2, nhom('a', 2, 5, 6)), tuan(3, nhom('a', 2, 4, 4))], 'a');
    expect(h.tuanDayQuan).toEqual([1, 3]);
    expect(nhanHuyHieu(h)).toContain('Đủ quân ×2');
  });

  it('nhóm không còn ai trong mẫu số (cả nhóm được miễn) không được tính đủ quân', () => {
    expect(tinhHuyHieu([tuan(1, nhom('a', 1, 0, 0))], 'a').dayQuan).toBe(0);
  });

  it('Hạng nhất liên tiếp: từ 2 tuần liên tiếp tính đến tuần gần nhất', () => {
    const t = [tuan(1, nhom('a', 2, 3, 6)), tuan(2, nhom('a', 1, 3, 6)), tuan(3, nhom('a', 1, 3, 6)), tuan(4, nhom('a', 1, 3, 6))];
    const h = tinhHuyHieu(t, 'a');
    expect(h.hangNhatLienTiep).toBe(3);
    expect(nhanHuyHieu(h)).toContain('Hạng nhất liên tiếp ×3');
  });

  it('một tuần hạng nhất thì chưa có huy hiệu; mất hạng nhất thì chuỗi về 0', () => {
    expect(nhanHuyHieu(tinhHuyHieu([tuan(1, nhom('a', 1, 3, 6))], 'a'))).toEqual([]);
    expect(tinhHuyHieu([tuan(1, nhom('a', 1, 3, 6)), tuan(2, nhom('a', 1, 3, 6)), tuan(3, nhom('a', 2, 3, 6))], 'a').hangNhatLienTiep).toBe(0);
  });

  it('chỉ tính các tuần đã chốt và đúng nhóm', () => {
    const t = [{ soTuan: 1, daChot: false, nhom: [nhom('a', 1, 6, 6)] }, tuan(2, nhom('b', 1, 6, 6))];
    expect(tinhHuyHieu(t, 'a')).toMatchObject({ dayQuan: 0, hangNhatLienTiep: 0 });
  });
});
