'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { extractTikTokVideoId, getTikTokEmbedUrl } from '@/lib/portfolio/media';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TikTokPortfolioPlayerProps {
  url: string;
  title: string;
  compact?: boolean;
}

export function TikTokPortfolioPlayer({ url, title, compact }: TikTokPortfolioPlayerProps) {
  const videoId = extractTikTokVideoId(url);
  const embedUrl = getTikTokEmbedUrl(url);
  const [open, setOpen] = useState(false);
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    fetch(`/api/tiktok-oembed?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { thumbnail_url?: string } | null) => {
        if (!cancelled && data?.thumbnail_url) setThumb(data.thumbnail_url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, videoId]);

  if (!videoId || !embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[200px] flex-col items-center justify-center gap-2 bg-surface-card p-4 text-center text-sm font-semibold text-pin-red"
      >
        Xem trên TikTok <ExternalLink className="h-4 w-4" />
      </a>
    );
  }

  return (
    <>
      <div
        className={`relative w-full overflow-hidden rounded-md bg-zinc-900 ${compact ? 'min-h-[320px]' : 'min-h-[380px]'}`}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 transition-colors hover:bg-black/40"
          aria-label={`Xem video: ${title}`}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-lg">
            <Play className="ml-1 h-6 w-6 fill-pin-red text-pin-red" />
          </span>
          <span className="px-4 text-center text-sm font-semibold text-white drop-shadow">
            Nhấn để xem video
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] gap-0 overflow-hidden p-0 sm:max-w-[420px]">
          <DialogHeader className="border-b border-hairline px-4 py-3">
            <DialogTitle className="line-clamp-2 pr-6 text-left text-sm font-bold">
              {title}
            </DialogTitle>
          </DialogHeader>

          {open && (
            <iframe
              key={videoId}
              src={`${embedUrl}?lang=vi-VN`}
              title={title}
              className="w-full border-0 bg-black"
              style={{ height: '740px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              loading="eager"
            />
          )}

          <div className="border-t border-hairline px-4 py-3 text-center">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-pin-red hover:underline"
            >
              Xem trên TikTok <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
