'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import type { KolSummaryResponse } from '@/lib/api/types';
import { formatMinPrice } from '@/lib/utils';

/**
 * Pin-card adaptation for the KOL discovery grid.
 *
 * Per DESIGN.md §Components: container is `surface-card` with `rounded-md`
 * (16px), no internal padding — the photograph IS the card. Metadata sits
 * over the image (overlay-pill bottom-left for the price tag) and in a
 * compact attribution row beneath.
 *
 * Image area is locked to a single 4:5 aspect ratio so every card in the
 * uniform grid has the same width AND same image height; the info strip
 * below sits at a fixed line-count, keeping all tiles visually aligned.
 */
export function KOLCard({ kol }: { kol: KolSummaryResponse }) {
  const formattedFollowers =
    kol.maxFollowerCount >= 1_000_000
      ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
      : kol.maxFollowerCount >= 1_000
        ? `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`
        : `${kol.maxFollowerCount}`;

  const priceLabel = formatMinPrice(kol.minPrice);

  return (
    <Link
      href={`/kol/${kol.slug}`}
      prefetch={false}
      className="pin-card group flex flex-col h-full"
      aria-label={kol.displayName}
    >
      {/* Image well — fixed 4:5, image scales with object-cover */}
      <div className="relative w-full aspect-[4/5] bg-secondary-bg overflow-hidden rounded-md">
        {kol.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={kol.avatarUrl}
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

        {/* Pin overlay pill: anchored bottom-left, the system's signature gesture */}
        <span className="pin-overlay-pill bottom-3 left-3">
          {priceLabel}
        </span>

      </div>

      {/* Compact attribution strip — fixed height, sits flush against the image */}
      <div className="flex items-center justify-between gap-2 px-1 pt-2 pb-3 mt-auto">
        <div className="min-w-0">
          <p className="font-bold text-sm text-ink truncate">{kol.displayName}</p>
          <p className="text-xs text-mute truncate">
            {formattedFollowers} người theo dõi
            {kol.city && ` · ${kol.city}`}
          </p>
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
