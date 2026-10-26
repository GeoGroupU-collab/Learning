import type { DotChoDuyet } from './types';

// Dựng bản Markdown của một đợt chờ duyệt để đưa cho AI hoặc người rà soát đọc. Bản JSON đi kèm là nơi ghi kết quả.
export function taoMarkdownChoDuyet(dot: DotChoDuyet): string {
  const tra = new Map<string, string>();
  dot.cho.forEach((c) => tra.set(c.id, c.noiDung));
  dot.thamKhao.forEach((c) => tra.set(c.id, c.noiDung));
  const m = dot.meta;
  const dong: string[] = [
    `# Đợt chờ duyệt ${m.maHocKy} (${m.ngayXuat.slice(0, 10)})`,
    '',
    `- Số câu chờ duyệt: ${m.soChoDuyet}`,
    `- Số câu đã duyệt kèm theo để so trùng: ${m.soThamKhao}`,
    `- Số câu nghi trùng (máy gợi ý, giống từ 70%): ${m.soNghiTrung}`,
    '',
    '## Việc cần làm',
    '',
    'Rà soát từng câu ở phần "Câu chờ duyệt" theo các tiêu chí: đáp án đúng so với tài liệu, câu hỏi rõ nghĩa và chỉ có một đáp án đúng, các lựa chọn nhiễu hợp lý, không trùng câu khác (trong đợt hoặc trong phần tham khảo), có trang nguồn và giải thích.',
    'Với mỗi câu, ghi một trong ba quyết định: `duyet` (tốt, vào ngân hàng), `tu_choi` (trùng, dở hoặc sai, kèm lý do ngắn), hoặc để trống (chưa quyết, vẫn chờ). Câu cần sửa nhẹ thì sửa trực tiếp và ghi `duyet`.',
    '',
    'Trả kết quả bằng một mảng JSON, mỗi phần tử gồm: `id`, `quyetDinh`, `ghiChuDuyet` (lý do, người nộp sẽ thấy khi bị từ chối) và các trường đã sửa (`noiDung`, `A`, `B`, `C`, `D`, `dapAn`, `giaiThich`, `trangNguon`, `maChuong`) nếu có. Ví dụ:',
    '',
    '```json',
    '[{ "id": "...", "quyetDinh": "duyet" }, { "id": "...", "quyetDinh": "tu_choi", "ghiChuDuyet": "Trùng với câu ..." }]',
    '```',
    '',
    '## Câu chờ duyệt',
    '',
  ];
  dot.cho.forEach((c, i) => {
    dong.push(`### ${i + 1}. ${c.tenMon}${c.maChuong ? ` · ${c.maChuong}` : ''}${c.trangNguon ? ` · ${c.trangNguon}` : ''}`);
    dong.push('');
    dong.push(`id: \`${c.id}\` · tuần ${c.soTuan} · người nộp ${c.maTacGia}`);
    dong.push('');
    dong.push(c.noiDung);
    dong.push('');
    (['A', 'B', 'C', 'D'] as const).forEach((k) => dong.push(`- ${k}. ${c[k]}${c.dapAn === k ? ' ✔' : ''}`));
    dong.push('');
    if (c.giaiThich) dong.push(`Giải thích: ${c.giaiThich}`, '');
    if (c.nghiTrung.length) {
      dong.push('Nghi trùng với:');
      c.nghiTrung.forEach((t) => {
        const goc = tra.get(t.id) ?? '';
        dong.push(`- \`${t.id}\` (giống ${Math.round(t.doGiong * 100)}%): ${goc.length > 120 ? `${goc.slice(0, 120)}...` : goc}`);
      });
      dong.push('');
    }
  });
  if (dot.thamKhao.length) {
    dong.push('## Câu đã duyệt (chỉ để so trùng, không cần trả lại)', '');
    dot.thamKhao.forEach((c) => dong.push(`- \`${c.id}\` [${c.maMon}${c.maChuong ? `/${c.maChuong}` : ''}] ${c.noiDung}`));
    dong.push('');
  }
  return dong.join('\n');
}
