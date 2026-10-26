// Tạo file prompt mẫu (.md) để nhờ AI soạn câu hỏi, và đọc lại câu hỏi AI trả về để điền vào form.
// Không dùng DOM nên kiểm thử được bằng Vitest.
import type { CauNhap, MonNop } from './types';

const chuanHoa = (s: string): string =>
  String(s ?? '').normalize('NFC').toLowerCase().replace(/[\s.,;:!?"'“”‘’()[\]{}\-–—_/\\*`#>]+/g, '');

const TEN_DAU_MON = 'Môn:';

export function taoPromptMd(mon: MonNop[], soCauMoiMon: number, tenWeb = 'Learning Group'): string {
  const dsMon = mon.map((m) => {
    const chuong = m.chuong.length
      ? m.chuong.map((c) => `- ${c.ten}`).join('\n')
      : '- (môn này chưa có danh sách chương: ghi tên chương hoặc chủ đề theo tài liệu)';
    return `### ${m.ten}\n${chuong}`;
  }).join('\n\n');

  const mauTrong = (n: number): string =>
    Array.from({ length: n }, (_, i) =>
      `### Câu ${i + 1}
Chương: <ghi đúng tên một chương trong danh sách ở trên>
Trang nguồn: <trang hoặc slide trong tài liệu, ví dụ: tr. 12 hoặc slide 8>
Câu hỏi: <nội dung câu hỏi>
A. <đáp án A>
B. <đáp án B>
C. <đáp án C>
D. <đáp án D>
Đáp án đúng: <A, B, C hoặc D>
Giải thích: <1 đến 2 câu giải thích vì sao đúng, dựa trên tài liệu>`).join('\n\n');

  const phanMon = mon.map((m) => `## ${TEN_DAU_MON} ${m.ten}\n\n${mauTrong(soCauMoiMon)}`).join('\n\n---\n\n');

  return `# Prompt mẫu soạn câu hỏi trắc nghiệm – ${tenWeb}

> **Phần A** dành cho BẠN (người nộp câu hỏi). **Phần B** dành cho AI. Gửi cả file cho AI.

## Phần A. Cách dùng (dành cho bạn)

1. Mở một AI bất kỳ (ChatGPT, Claude, Gemini...).
2. **Bỏ file .md này vào AI** (đính kèm file hoặc dán toàn bộ nội dung).
3. **Đưa thêm tài liệu tham khảo** của đúng môn và chương (PDF bài giảng, slide, giáo trình). Chỉ đưa tài liệu của môn và chương bạn muốn soạn.
4. **Nói rõ môn và chương** ngay trong tin nhắn, ví dụ:
   > Hãy soạn câu hỏi theo file mẫu cho môn "${mon[0]?.ten ?? 'Tên môn'}", chương "${mon[0]?.chuong[0]?.ten ?? 'Tên chương'}", chỉ dựa trên tài liệu tôi đính kèm.
5. AI sẽ trả lời theo đúng mẫu ở Phần B. Sao chép toàn bộ câu trả lời.
6. Quay lại web, mục **Nộp câu hỏi**, bấm **Dán câu hỏi từ AI**, dán vào và bấm **Nhập vào form**.
7. **Tự kiểm tra từng câu với tài liệu gốc** (đáp án đúng, trang nguồn, câu chữ) rồi mới bấm **Nộp tất cả**. AI có thể bịa hoặc nhầm, bạn chịu trách nhiệm về câu hỏi mình nộp.

Lưu ý: mỗi người nộp đúng **${mon.length === 1 ? '1 môn' : `${mon.length} môn`} × ${soCauMoiMon} câu** trong mẫu dưới đây. Các câu không được trùng với câu đã có trong ngân hàng, nên hãy ra câu theo góc nhìn riêng của bạn và yêu cầu AI đa dạng.

---

## Phần B. Yêu cầu dành cho AI

Bạn là giáo viên soạn câu hỏi trắc nghiệm cho sinh viên đại học. Hãy soạn câu hỏi **chỉ dựa trên tài liệu tham khảo người dùng đính kèm** và đúng môn, đúng chương người dùng nêu. Nếu tài liệu không đủ thông tin cho một câu thì không bịa, hãy báo lại.

### Quy tắc nội dung
- Mỗi câu có **đúng 4 đáp án A, B, C, D** và **đúng 1 đáp án đúng**. Bốn đáp án phải khác nhau.
- Không dùng "tất cả các đáp án trên", "không có đáp án nào đúng", hay "A và B đúng".
- Đáp án sai phải hợp lý (dễ nhầm), không quá lộ liễu. Độ dài các đáp án gần bằng nhau.
- Câu hỏi rõ ràng, có thể trả lời được mà không cần nhìn tài liệu. Không hỏi "theo tài liệu" hay "theo slide".
- Trộn độ khó: khoảng 2 câu dễ (nhớ), 2 câu trung bình (hiểu), 1 câu khó (vận dụng) cho mỗi môn.
- Phân bố đáp án đúng đều giữa A, B, C, D, không dồn vào một chữ.
- Không lặp ý giữa các câu.
- **Trang nguồn** là trang hoặc slide trong tài liệu nơi có thông tin để trả lời. Bắt buộc ghi, ghi đúng.
- **Giải thích** ngắn gọn, nêu căn cứ trong tài liệu.
- Viết bằng tiếng Việt.

### Định dạng đầu ra (bắt buộc, để web đọc được)
- Giữ nguyên các tiêu đề \`## ${TEN_DAU_MON} ...\` và \`### Câu N\`.
- Mỗi trường nằm trên một dòng bắt đầu bằng đúng nhãn: \`Chương:\`, \`Trang nguồn:\`, \`Câu hỏi:\`, \`A.\`, \`B.\`, \`C.\`, \`D.\`, \`Đáp án đúng:\`, \`Giải thích:\`.
- Dòng \`Chương:\` ghi **đúng tên chương** trong danh sách dưới đây.
- \`Đáp án đúng:\` chỉ ghi một chữ A, B, C hoặc D.
- Không thêm lời dẫn, không dùng bảng, không đánh số lại. Chỉ trả về các khối câu hỏi theo mẫu.

### Ví dụ một câu đã điền (chỉ để minh họa định dạng)
\`\`\`
### Câu 1
Chương: Chương 1: Mở đầu
Trang nguồn: tr. 5
Câu hỏi: Thủ đô của Việt Nam là thành phố nào?
A. Đà Nẵng
B. Hà Nội
C. Huế
D. Cần Thơ
Đáp án đúng: B
Giải thích: Hà Nội là thủ đô của nước Cộng hòa xã hội chủ nghĩa Việt Nam.
\`\`\`

### Danh sách môn và chương hiện có
${dsMon}

---

### Mẫu cần điền (${soCauMoiMon} câu mỗi môn)

Hãy thay các phần trong dấu \`<...>\` bằng nội dung thật, giữ nguyên cấu trúc.

${phanMon}
`;
}

export interface KetQuaDocAi {
  mon: { ma: string; ten: string; cau: CauNhap[]; canhBao: string[] }[];
  canhBaoChung: string[];
  tongCau: number;
}

const LA_MAU = (v: string): boolean => /^<.*>$/.test(v.trim());

function lamSachDong(d: string): string {
  return d.replace(/\*\*/g, '').replace(/^\s*[-*]\s+/, '').replace(/\s+$/, '');
}

interface CauTho {
  chuong: string;
  trangNguon: string;
  noiDung: string;
  A: string;
  B: string;
  C: string;
  D: string;
  dapAn: string;
  giaiThich: string;
}

const trong = (): CauTho => ({ chuong: '', trangNguon: '', noiDung: '', A: '', B: '', C: '', D: '', dapAn: '', giaiThich: '' });

function khopChuong(gt: string, m: MonNop): { ma: string; ok: boolean } {
  const v = gt.trim();
  if (!m.chuong.length) return { ma: v, ok: true };
  if (!v) return { ma: '', ok: false };
  const k = chuanHoa(v);
  const tuTen = m.chuong.find((c) => chuanHoa(c.ten) === k);
  if (tuTen) return { ma: tuTen.ma, ok: true };
  const tuMa = m.chuong.find((c) => chuanHoa(c.ma) === k);
  if (tuMa) return { ma: tuMa.ma, ok: true };
  // Tên AI ghi dài hoặc ngắn hơn một chút: khớp nếu một bên chứa bên kia.
  const gan = m.chuong.filter((c) => chuanHoa(c.ten).includes(k) || k.includes(chuanHoa(c.ten)));
  if (gan.length === 1) return { ma: gan[0].ma, ok: true };
  return { ma: '', ok: false };
}

// Đọc văn bản AI trả về theo mẫu. Chấp nhận **in đậm**, khối mã ```, nhãn có hoặc không có dấu hai chấm.
export function docCauHoiTuAi(van: string, mon: MonNop[], soCauMoiMon: number): KetQuaDocAi {
  const ketQua: KetQuaDocAi = { mon: [], canhBaoChung: [], tongCau: 0 };
  const dong = van.replace(/\r/g, '').split('\n');

  type Khoi = { ten: string; cau: CauTho[] };
  const khoi: Khoi[] = [];
  let hienTai = null as Khoi | null;
  let cau = null as CauTho | null;
  let truong = null as keyof CauTho | null;

  const batDauMon = (ten: string): void => {
    hienTai = { ten, cau: [] };
    khoi.push(hienTai);
    cau = null;
    truong = null;
  };
  const batDauCau = (): void => {
    if (!hienTai) batDauMon('');
    cau = trong();
    hienTai!.cau.push(cau);
    truong = null;
  };
  const gan = (t: keyof CauTho, v: string): void => {
    if (!cau) batDauCau();
    cau![t] = LA_MAU(v) ? '' : v.trim();
    truong = t;
  };

  for (const goc of dong) {
    const d = lamSachDong(goc);
    if (!d.trim() || /^```/.test(d.trim()) || /^-{3,}$/.test(d.trim())) { if (/^```/.test(d.trim())) truong = null; continue; }

    const tieuMon = d.match(/^#{1,3}\s*m[oô]n\s*:?\s*(.*)$/i);
    if (tieuMon) { batDauMon(tieuMon[1].trim()); continue; }
    if (/^#{1,4}\s*c[aâ]u\s*\d*\s*:?\s*$/i.test(d.trim()) || /^c[aâ]u\s*\d+\s*[.:]?\s*$/i.test(d.trim())) { batDauCau(); continue; }

    let m: RegExpMatchArray | null;
    if ((m = d.match(/^\s*ch[uư][oơ]ng\s*(?:\/\s*ch[uủ]\s*[dđ][eề])?\s*:\s*(.*)$/i))) { gan('chuong', m[1]); continue; }
    if ((m = d.match(/^\s*(?:trang\s*ngu[oồ]n|ngu[oồ]n)\s*:\s*(.*)$/i))) { gan('trangNguon', m[1]); continue; }
    if ((m = d.match(/^\s*c[aâ]u\s*h[oỏ]i\s*:\s*(.*)$/i))) { gan('noiDung', m[1]); continue; }
    if ((m = d.match(/^\s*([ABCD])\s*[.):]\s*(.*)$/))) { gan(m[1] as 'A' | 'B' | 'C' | 'D', m[2]); continue; }
    if ((m = d.match(/^\s*[dđ][aá]p\s*[aá]n(?:\s*[dđ][uú]ng)?\s*:\s*(.*)$/i))) {
      const v = m[1].trim();
      const chu = v.match(/\b([ABCD])\b/i);
      gan('dapAn', LA_MAU(v) ? '' : (chu ? chu[1].toUpperCase() : ''));
      continue;
    }
    if ((m = d.match(/^\s*gi[aả]i\s*th[ií]ch\s*:\s*(.*)$/i))) { gan('giaiThich', m[1]); continue; }

    // Dòng nối tiếp của trường trước đó (câu hỏi hoặc giải thích dài nhiều dòng).
    if (cau && truong && truong !== 'dapAn' && truong !== 'chuong' && truong !== 'trangNguon') {
      cau[truong] = `${cau[truong]} ${d.trim()}`.trim();
    }
  }

  if (!khoi.length) ketQua.canhBaoChung.push('Không tìm thấy câu hỏi nào. Hãy dán đúng phần AI trả lời theo mẫu.');

  // Gán khối vào môn: khớp theo tên; khối không có tên thì lấy lần lượt các môn chưa dùng.
  const daDung = new Set<string>();
  khoi.forEach((k, vi) => {
    const kt = chuanHoa(k.ten);
    let m = kt ? mon.find((x) => chuanHoa(x.ten) === kt) : undefined;
    if (!m && kt) m = mon.find((x) => chuanHoa(x.ten).includes(kt) || kt.includes(chuanHoa(x.ten)));
    if (!m && !kt) m = mon.filter((x) => !daDung.has(x.ma))[0] ?? (mon.length === 1 ? mon[0] : undefined);
    if (!m) { ketQua.canhBaoChung.push(`Không nhận ra môn "${k.ten || `thứ ${vi + 1}`}", bỏ qua khối này.`); return; }
    if (daDung.has(m.ma)) { ketQua.canhBaoChung.push(`Môn "${m.ten}" xuất hiện hai lần, chỉ lấy lần đầu.`); return; }
    daDung.add(m.ma);

    const canhBao: string[] = [];
    if (k.cau.length > soCauMoiMon) canhBao.push(`AI soạn ${k.cau.length} câu, chỉ lấy ${soCauMoiMon} câu đầu.`);
    if (k.cau.length < soCauMoiMon) canhBao.push(`Mới có ${k.cau.length}/${soCauMoiMon} câu, cần soạn hoặc nhập thêm.`);
    const dsCau: CauNhap[] = k.cau.slice(0, soCauMoiMon).map((c, i) => {
      const nhan = `Câu ${i + 1}`;
      const ch = khopChuong(c.chuong, m!);
      if (!ch.ok) canhBao.push(`${nhan}: chương "${c.chuong || '(trống)'}" không có trong danh sách của môn, hãy chọn lại.`);
      if (!c.noiDung) canhBao.push(`${nhan}: thiếu nội dung câu hỏi.`);
      (['A', 'B', 'C', 'D'] as const).forEach((x) => { if (!c[x]) canhBao.push(`${nhan}: thiếu đáp án ${x}.`); });
      if (!c.dapAn) canhBao.push(`${nhan}: chưa có đáp án đúng.`);
      if (!c.trangNguon) canhBao.push(`${nhan}: thiếu trang nguồn.`);
      return { maChuong: ch.ma, trangNguon: c.trangNguon, noiDung: c.noiDung, A: c.A, B: c.B, C: c.C, D: c.D, dapAn: c.dapAn, giaiThich: c.giaiThich };
    });
    ketQua.mon.push({ ma: m.ma, ten: m.ten, cau: dsCau, canhBao });
    ketQua.tongCau += dsCau.length;
  });
  return ketQua;
}
