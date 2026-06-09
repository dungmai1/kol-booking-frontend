'use client';

import { X, Star, CheckCircle2, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { kolApi } from '@/lib/api/kol';
import { brandApi } from '@/lib/api/brand';
import { useAuth } from '@/contexts/AuthContext';
import type { KolSummaryResponse, KolPublicResponse } from '@/lib/api/types';
import { BookingFormDialog } from './booking-form';
import { formatMinPrice } from '@/lib/utils';

interface KOLDetailModalProps {
  kol: KolSummaryResponse;
  onClose: () => void;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function KOLDetailModal({ kol, onClose }: KOLDetailModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<KolPublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    kolApi.getPublicProfile(kol.slug)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [kol.slug]);

  async function handleFavorite() {
    if (!isAuthenticated) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) await brandApi.removeFavorite(kol.id);
      else await brandApi.addFavorite(kol.id);
      setIsFavorite(!isFavorite);
    } catch { /* ignore */ }
    finally { setFavoriteLoading(false); }
  }

  const rawMinPrice = profile?.pricingPackages.length
    ? Math.min(...profile.pricingPackages.map((p) => p.price))
    : kol.minPrice;
  const minPriceLabel = formatMinPrice(rawMinPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-canvas rounded-[2rem] w-full max-w-2xl my-8 overflow-hidden shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
        {/* Pin-card-large hero treatment with overlay attribution */}
        <div className="relative aspect-[16/8] bg-secondary-bg">
          {kol.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={kol.avatarUrl} alt={kol.displayName} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ background: 'linear-gradient(150deg, #f6dccb 0%, #c47a55 100%)' }}>
              <span className="font-display font-extrabold text-on-dark text-[80px]">{kol.displayName[0]}</span>
            </div>
          )}

          {profile?.status === 'APPROVED' && (
            <span className="pin-overlay-pill top-4 left-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-pin-red mr-1.5" />
              Đã xác minh
            </span>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-full bg-canvas text-ink hover:bg-secondary-bg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {isAuthenticated && user?.role === 'BRAND' && (
            <button
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className="absolute top-16 right-4 grid place-items-center w-10 h-10 rounded-full bg-canvas text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
              aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <Heart className="w-5 h-5" fill={isFavorite ? 'var(--pin-red)' : 'none'} stroke={isFavorite ? 'var(--pin-red)' : 'currentColor'} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-ink text-[24px] tracking-tight truncate">{kol.displayName}</h2>
              {(kol.city || kol.country) && (
                <p className="text-mute text-sm mt-1">{[kol.city, kol.country].filter(Boolean).join(', ')}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 text-ink font-bold text-base">
                <Star className="w-4 h-4 fill-ink text-ink" />
                {kol.avgRating > 0 ? kol.avgRating.toFixed(1) : '—'}
              </div>
              <p className="text-xs text-mute">{kol.reviewCount} nhận xét</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-surface-card rounded-md px-3 py-3 text-center">
              <p className="font-display font-bold text-ink text-[18px]">{formatFollowers(kol.maxFollowerCount)}</p>
              <p className="text-[11px] text-mute font-bold uppercase tracking-wider mt-1">Followers</p>
            </div>
            <div className="bg-surface-card rounded-md px-3 py-3 text-center">
              <p className="font-display font-bold text-ink text-[18px]">{minPriceLabel}</p>
              <p className="text-[11px] text-mute font-bold uppercase tracking-wider mt-1">Từ</p>
            </div>
            <div className="bg-surface-card rounded-md px-3 py-3 text-center">
              <p className="font-display font-bold text-ink text-[18px]">{kol.reviewCount}</p>
              <p className="text-[11px] text-mute font-bold uppercase tracking-wider mt-1">Reviews</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-pin-red animate-spin" />
            </div>
          ) : (
            <>
              {profile?.bio && (
                <div className="mb-5">
                  <p className="text-sm text-body leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {profile && profile.channels.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-3">Kênh mạng xã hội</h3>
                  <ul className="space-y-2">
                    {profile.channels.slice(0, 3).map((ch) => (
                      <li key={ch.id} className="flex items-center justify-between bg-surface-card rounded-md px-4 py-2.5">
                        <span className="text-sm font-bold text-ink">{ch.platform} · @{ch.username}</span>
                        <span className="text-xs text-mute">{formatFollowers(ch.followerCount)} · {ch.engagementRate}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-3 pt-5 border-t border-hairline-soft">
            {isAuthenticated && user?.role === 'BRAND' && (
              <BookingFormDialog
                kolProfileId={kol.id}
                kolName={kol.displayName}
                defaultBudget={rawMinPrice > 0 ? rawMinPrice : undefined}
                triggerLabel="Đặt ngay"
                triggerClassName="btn-pin-primary !rounded-full w-full !py-3"
                onSuccess={() => onClose()}
              />
            )}
            <div className="flex gap-3">
              <Link href={`/kol/${kol.slug}`} onClick={onClose} className="btn-pin-secondary !rounded-full flex-1 justify-center">
                Xem hồ sơ đầy đủ
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={onClose} className="btn-pin-tertiary !rounded-full flex-1">Đóng</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
