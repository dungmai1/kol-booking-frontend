/**
 * Tách tài liệu đính kèm (KOL nộp lúc ứng tuyển) khỏi phần lời nhắn trong
 * nội dung đơn ứng tuyển.
 *
 * KOL gửi message dạng:
 *   Tài liệu đính kèm: /uploads/abc.pdf
 *   (trống)
 *   Lời nhắn: ...
 *
 * Đơn cũ không có tiền tố này thì coi toàn bộ là lời nhắn.
 */
export function parseApplicationMessage(
  raw: string | null | undefined,
): { attachmentUrl: string | null; note: string } {
  if (!raw) return { attachmentUrl: null, note: '' };
  let attachmentUrl: string | null = null;
  const noteLines: string[] = [];
  for (const line of raw.split('\n')) {
    const attach = line.match(/^Tài liệu đính kèm:\s*(\S+)\s*$/);
    if (attach) {
      attachmentUrl = attach[1];
      continue;
    }
    const note = line.match(/^Lời nhắn:\s*(.*)$/);
    if (note) {
      noteLines.push(note[1]);
      continue;
    }
    noteLines.push(line);
  }
  return { attachmentUrl, note: noteLines.join('\n').trim() };
}
