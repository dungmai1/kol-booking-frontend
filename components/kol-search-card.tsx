'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import type { KolSummaryResponse, Platform } from '@/lib/api/types';
import { brandApi } from '@/lib/api/brand';
import { resolveMediaUrl } from '@/lib/api/client';

const PLATFORM_LABEL: Record<Platform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

const PLATFORM_STYLES: Record<Platform, string> = {
  TIKTOK: 'bg-black text-white',
  INSTAGRAM: 'bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white',
  YOUTUBE: 'bg-[#ff0000] text-white',
  FACEBOOK: 'bg-[#1877f2] text-white',
};

function formatVnd(value: number): string {
  if (!value) return 'Liên hệ';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K₫`;
  return `${value}₫`;
}

interface KolSearchCardProps {
  kol: KolSummaryResponse;
  /** Show the favorite heart toggle. Set true only for authenticated BRAND users. */
  canFavorite?: boolean;
  /** Initial favorite state (defaults to kol.isFavorite). */
  initialFavorite?: boolean;
}

export function KolSearchCard({
  kol,
  canFavorite = false,
  initialFavorite,
}: KolSearchCardProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(
    initialFavorite ?? kol.isFavorite ?? false,
  );
  const [pending, setPending] = useState(false);

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setPending(true);
    try {
      if (next) await brandApi.addFavorite(kol.id);
      else await brandApi.removeFavorite(kol.id);
    } catch {
      setIsFavorite(!next);
    } finally {
      setPending(false);
    }
  }

  const platforms = kol.platforms ?? [];

  return (
    <Link
      href={`/kol/${kol.slug}`}
      prefetch={false}
      className="pin-card group flex flex-col h-full"
      aria-label={kol.displayName}
    >
      <div className="relative w-full aspect-[4/5] bg-secondary-bg overflow-hidden rounded-md">
        {kol.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolveMediaUrl(kol.avatarUrl)}
            alt={kol.displayName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-secondary-bg to-stone">
            <span className="font-display font-extrabold text-6xl text-mute">
              {kol.displayName[0]}
            </span>
          </div>
        )}

        {/* Price overlay pill — bottom-left */}
        <span className="pin-overlay-pill bottom-3 left-3">
          {formatVnd(kol.minPrice)}
        </span>

        {/* Favorite heart — top-right, BRAND only */}
        {canFavorite && (
          <button
            type="button"
            onClick={toggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-canvas/90 backdrop-blur-sm text-ink hover:bg-canvas transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? 'fill-pin-red text-pin-red' : 'text-ink'
              }`}
            />
          </button>
        )}

        {/* Platform badges — bottom-right */}
        {platforms.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {platforms.slice(0, 3).map((p) => (
              <span
                key={p}
                title={PLATFORM_LABEL[p]}
                className={`inline-flex items-center justify-center rounded-full px-2 h-6 text-[10px] font-bold ${PLATFORM_STYLES[p]}`}
              >
                {PLATFORM_LABEL[p]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attribution strip */}
      <div className="flex items-center justify-between gap-2 px-1 pt-2 pb-3 mt-auto">
        <div className="min-w-0">
          <p className="font-bold text-sm text-ink truncate">{kol.displayName}</p>
          {kol.categories && kol.categories.length > 0 ? (
            <p className="text-xs text-mute truncate">
              {kol.categories.slice(0, 2).map((c) => c.name).join(' · ')}
            </p>
          ) : (
            <p className="text-xs text-mute truncate">
              {kol.reviewCount > 0
                ? `${kol.reviewCount} đánh giá`
                : 'Chưa có đánh giá'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 fill-ink text-ink" />
          <span className="text-xs font-bold text-ink">
            {kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Mới'}
          </span>
        </div>
      </div>
    </Link>
  );
}
