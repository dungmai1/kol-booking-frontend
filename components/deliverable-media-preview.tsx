'use client';

import { resolveMediaUrl } from '@/lib/api/client';
import {
  isDirectImageUrl,
  isDirectVideoUrl,
  isTikTokUrl,
} from '@/lib/portfolio/media';
import { TikTokPortfolioPlayer } from '@/components/tiktok-portfolio-player';

interface DeliverableMediaPreviewProps {
  url: string;
  className?: string;
}

export function DeliverableMediaPreview({
  url,
  className = '',
}: DeliverableMediaPreviewProps) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const resolved = resolveMediaUrl(trimmed);

  if (isDirectImageUrl(trimmed)) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-hairline bg-surface-card ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved}
          alt="Xem trước nội dung"
          className="w-full max-h-72 object-contain"
        />
      </div>
    );
  }

  if (isTikTokUrl(trimmed)) {
    return (
      <div className={`overflow-hidden rounded-xl border border-hairline ${className}`}>
        <TikTokPortfolioPlayer url={trimmed} title="Xem trước TikTok" compact />
      </div>
    );
  }

  if (isDirectVideoUrl(trimmed)) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-hairline bg-black ${className}`}
      >
        <video
          src={resolved}
          className="w-full max-h-72"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return null;
}
