'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import type { KolSummaryResponse } from '@/lib/api/types';

/**
 * Pin-card adaptation for the KOL discovery masonry grid.
 *
 * Per DESIGN.md §Components: container is `surface-card` with `rounded-md`
 * (16px), no internal padding — the photograph IS the card. Metadata sits
 * over the image (overlay-pill bottom-left for the price tag) or in a
 * compact attribution row beneath, mirroring Pinterest's pin tiles.
 *
 * The masonry parent assigns column flow; tiles preserve their natural
 * aspect ratio. We pseudo-randomise the aspect (3:4 / 4:5 / 1:1) per id so
 * the column doesn't tile uniformly — this is the visual signature of the
 * Pinterest grid.
 */
export function KOLCard({ kol }: { kol: KolSummaryResponse }) {
  const formattedFollowers =
    kol.maxFollowerCount >= 1_000_000
      ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
      : kol.maxFollowerCount >= 1_000
        ? `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`
        : `${kol.maxFollowerCount}`;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(kol.minPrice);

  // Stable mixed aspect ratios drive the masonry rhythm.
  const ratios = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-[1/1]', 'aspect-[2/3]'];
  const ratioClass = ratios[(Number(kol.id) || kol.displayName.length) % ratios.length];

  return (
    <Link
      href={`/kol/${kol.slug}`}
      className="pin-card block group"
      aria-label={kol.displayName}
    >
      {/* Image well — full bleed */}
      <div className={`relative w-full ${ratioClass} bg-secondary-bg overflow-hidden rounded-md`}>
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
          Từ {formattedPrice}
        </span>

      </div>

      {/* Compact attribution strip (sits flush against the image, no padding above) */}
      <div className="flex items-center justify-between gap-2 px-1 pt-2 pb-3">
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
