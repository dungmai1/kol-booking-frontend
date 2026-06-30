'use client';

import { X, ExternalLink, FileText, Download } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/api/client';

/**
 * DocumentPreviewModal — xem tài liệu trực tiếp trên web (không cần tải về).
 *
 *   - PDF / ảnh: nhúng iframe / img trực tiếp.
 *   - Word/Excel/PowerPoint: dùng trình xem Office Online (yêu cầu URL công khai
 *     truy cập được từ Internet; nếu là server nội bộ thì có nút mở/tải về dự phòng).
 */

function getExt(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const m = clean.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
}

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export function DocumentPreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title?: string;
  onClose: () => void;
}) {
  const resolved = resolveMediaUrl(url);
  const ext = getExt(url);
  const isPdf = ext === 'pdf';
  const isImage = IMAGE_EXTS.includes(ext);
  const isOffice = OFFICE_EXTS.includes(ext);
  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolved)}`;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-canvas rounded-2xl shadow-xl w-full max-w-[960px] h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-hairline">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 shrink-0 text-ink" />
            <span className="font-semibold text-ink truncate" title={title}>
              {title || 'Tài liệu'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={resolved}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-ink bg-surface-card hover:bg-secondary-bg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở tab mới
            </a>
            <button
              type="button"
              onClick={onClose}
              className="grid place-items-center w-8 h-8 rounded-full text-mute hover:text-ink hover:bg-surface-card transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — dùng position:relative + absolute inset-0 để iframe luôn lấp đầy
            chiều cao (tránh lỗi iframe co lại chỉ còn 1 trang trong flex). */}
        <div className="relative flex-1 bg-surface-card min-h-0">
          {isImage ? (
            <div className="absolute inset-0 overflow-auto grid place-items-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolved} alt={title || 'Tài liệu'} className="max-w-full object-contain" />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${resolved}#view=FitH&toolbar=1`}
              title={title || 'Tài liệu'}
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : isOffice ? (
            <iframe
              src={officeSrc}
              title={title || 'Tài liệu'}
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <div>
                <FileText className="w-12 h-12 text-mute mx-auto mb-3" />
                <p className="text-ink font-bold mb-1">Không hỗ trợ xem trước định dạng này</p>
                <p className="text-mute text-sm mb-4">Bạn có thể mở ở tab mới hoặc tải về để xem.</p>
                <a
                  href={resolved}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-dark text-sm font-bold hover:bg-charcoal transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Mở / Tải tài liệu
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Office viewer cần URL công khai */}
        {isOffice && (
          <p className="px-5 py-2 text-[11px] text-mute border-t border-hairline-soft">
            Tài liệu Word/Excel/PowerPoint được hiển thị qua trình xem Office Online — cần đường dẫn truy
            cập được từ Internet. Nếu không hiển thị, hãy bấm “Mở tab mới”.
          </p>
        )}
      </div>
    </div>
  );
}
