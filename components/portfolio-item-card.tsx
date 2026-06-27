'use client';

import { ExternalLink, Play } from 'lucide-react';
import {
  isDirectVideoUrl,
  isTikTokUrl,
} from '@/lib/portfolio/media';
import type { KolPortfolioItemResponse } from '@/lib/api/types';
import { TikTokPortfolioPlayer } from '@/components/tiktok-portfolio-player';
import { resolveMediaUrl } from '@/lib/api/client';

type Variant = 'grid' | 'compact' | 'editor';

interface PortfolioItemCardProps {
  item: KolPortfolioItemResponse;
  variant?: Variant;
  className?: string;
}

function ExternalVideoLink({ url, title }: { url: string; title: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-h-[200px] flex-col items-center justify-center gap-3 bg-surface-card p-4 text-center transition-colors hover:bg-stone/40"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-canvas shadow-sm">
        <Play className="h-6 w-6 fill-pin-red text-pin-red" />
      </span>
      <span className="text-sm font-semibold text-ink line-clamp-2">{title}</span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-pin-red">
        Xem video <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

export function PortfolioItemCard({ item, variant = 'grid', className = '' }: PortfolioItemCardProps) {
  const isImage = item.mediaType === 'IMAGE';
  const tiktok = isTikTokUrl(item.mediaUrl);
  const directVideo = isDirectVideoUrl(item.mediaUrl);
  const compact = variant === 'compact' || variant === 'grid';

  const media = isImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolveMediaUrl(item.mediaUrl)} alt={item.title} className="h-full w-full object-cover" />
  ) : tiktok ? (
    <TikTokPortfolioPlayer url={item.mediaUrl} title={item.title} compact={compact} />
  ) : directVideo ? (
    <video src={item.mediaUrl} className="h-full w-full object-cover" controls playsInline />
  ) : (
    <ExternalVideoLink url={item.mediaUrl} title={item.title} />
  );

  if (variant === 'editor') {
    return (
      <div className={`overflow-hidden rounded-md border border-hairline bg-canvas ${className}`}>
        <div className="relative bg-surface-card">{media}</div>
        <div className="space-y-1 p-4">
          <p className="truncate font-bold text-ink">{item.title}</p>
          {item.campaignName && <p className="truncate text-xs text-mute">{item.campaignName}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}>
        <div className="overflow-hidden bg-gray-100">{media}</div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          {item.campaignName && <p className="text-xs text-gray-500">{item.campaignName}</p>}
        </div>
      </div>
    );
  }

  // grid — public KOL profile masonry
  return (
    <div className={`pin-card !mb-0 overflow-hidden ${className}`}>
      <div className="overflow-hidden bg-surface-card">{media}</div>
      <div className="px-1 pb-3 pt-2">
        <p className="truncate text-xs font-bold text-ink">{item.title}</p>
        {item.campaignName && <p className="truncate text-[11px] text-mute">{item.campaignName}</p>}
      </div>
    </div>
  );
}

export function PortfolioMediaPreview({
  mediaType,
  mediaUrl,
}: {
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
}) {
  if (!mediaUrl.trim()) return null;

  if (mediaType === 'IMAGE') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolveMediaUrl(mediaUrl)} alt="preview" className="max-h-80 min-h-48 w-full bg-zinc-950 object-contain" />
    );
  }

  if (isTikTokUrl(mediaUrl)) {
    return <TikTokPortfolioPlayer url={mediaUrl} title="Xem trước TikTok" compact />;
  }

  if (isDirectVideoUrl(mediaUrl)) {
    return <video src={mediaUrl} className="max-h-80 min-h-48 w-full bg-zinc-950 object-contain" controls playsInline />;
  }

  return <ExternalVideoLink url={mediaUrl} title="Xem trước video" />;
}
