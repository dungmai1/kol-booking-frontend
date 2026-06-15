'use client';

import { Header } from '@/components/header';
import { kolApi } from '@/lib/api/kol';
import { brandApi } from '@/lib/api/brand';
import { reviewsApi } from '@/lib/api/reviews';
import type { KolPublicResponse, ReviewResponse } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Star,
  CheckCircle2,
  MapPin,
  Heart,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookingFormDialog } from '@/components/booking-form';
import { PortfolioItemCard } from '@/components/portfolio-item-card';
import { ReviewListItem } from '@/components/review-list-item';

const PLATFORM_GLYPH: Record<string, string> = {
  TIKTOK: 'TT',
  INSTAGRAM: 'IG',
  YOUTUBE: 'YT',
  FACEBOOK: 'FB',
};

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function KOLDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const { user, isAuthenticated } = useAuth();

  const [kol, setKol] = useState<KolPublicResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      setIsOwnerPreview(false);
      try {
        const profile = await kolApi.getPublicProfile(slug);
        setKol(profile);
        setIsOwnerPreview(profile.status !== 'APPROVED');
        if (profile.userId) {
          const reviewsRes = await reviewsApi.getByUser(profile.userId, 0, 10);
          setReviews(reviewsRes.content);
        }
      } catch {
        setError('Không tìm thấy KOL này.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug, isAuthenticated, user]);

  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated || !kol) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) await brandApi.removeFavorite(kol.id);
      else await brandApi.addFavorite(kol.id);
      setIsFavorite(!isFavorite);
    } catch { /* ignore */ }
    finally { setFavoriteLoading(false); }
  }, [isAuthenticated, kol, isFavorite]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-surface-soft">
          <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
        </div>
      </>
    );
  }

  if (error || !kol) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-surface-soft">
          <div className="text-center max-w-sm">
            <h1 className="font-display font-bold text-ink text-[28px] tracking-tight mb-2">Không tìm thấy KOL</h1>
            <p className="text-mute mb-6">{error}</p>
            <Link href="/discover" className="btn-pin-primary !rounded-full">← Quay lại tìm kiếm</Link>
          </div>
        </div>
      </>
    );
  }

  const minPrice = kol.pricingPackages.length > 0 ? Math.min(...kol.pricingPackages.map(p => p.price)) : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {isOwnerPreview && (
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-6">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Hồ sơ của bạn chưa được công khai hoặc chưa được phê duyệt.{' '}
              <Link href="/kol-dashboard/profile" className="font-bold underline hover:text-pin-red">
                Hoàn thiện hồ sơ tại đây
              </Link>
            </div>
          </div>
        )}
        {/* Hero — pin-card-large treatment with attribution chip */}
        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cover/avatar block — large rounded pin */}
            <div className="lg:col-span-5">
              <div
                className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-secondary-bg"
                style={kol.coverUrl ? undefined : { background: 'linear-gradient(150deg, #f6dccb 0%, #c47a55 100%)' }}
              >
                {kol.coverUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={kol.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                {kol.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={kol.avatarUrl} alt={kol.displayName} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display font-extrabold text-on-dark text-[120px]">{kol.displayName[0]}</span>
                  </div>
                )}
                {kol.status === 'APPROVED' && (
                  <span className="pin-overlay-pill top-4 left-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pin-red mr-1.5" />
                    Đã xác minh
                  </span>
                )}
                {isAuthenticated && user?.role === 'BRAND' && (
                  <button
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-full bg-canvas text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
                    aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                  >
                    <Heart className="w-5 h-5" fill={isFavorite ? 'var(--pin-red)' : 'none'} stroke={isFavorite ? 'var(--pin-red)' : 'currentColor'} />
                  </button>
                )}
              </div>
            </div>

            {/* Identity column */}
            <div className="lg:col-span-7 lg:pl-4 flex flex-col">
              <h1 className="font-display font-extrabold text-ink text-[44px] lg:text-[56px] tracking-[-1.2px] leading-[1.05]">
                {kol.displayName}
              </h1>
              {(kol.city || kol.country) && (
                <p className="text-mute flex items-center gap-1 mt-3 text-sm font-semibold">
                  <MapPin className="w-4 h-4" />
                  {[kol.city, kol.country].filter(Boolean).join(', ')}
                </p>
              )}

              {kol.bio && (
                <p className="text-body text-base lg:text-lg leading-relaxed mt-5 max-w-xl">{kol.bio}</p>
              )}

              {/* Stat tiles */}
              {kol.channels.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {kol.channels.slice(0, 3).map((ch) => (
                    <div key={ch.id} className="bg-canvas rounded-md border border-hairline p-4">
                      <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">{PLATFORM_GLYPH[ch.platform] ?? ch.platform.slice(0, 2)} · {ch.platform}</p>
                      <p className="font-display font-bold text-ink text-[22px] tracking-tight">{formatFollowers(ch.followerCount)}</p>
                    </div>
                  ))}
                  <div className="bg-canvas rounded-md border border-hairline p-4">
                    <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Đánh giá</p>
                    <div className="flex items-baseline gap-1">
                      <p className="font-display font-bold text-ink text-[22px] tracking-tight">{kol.avgRating > 0 ? kol.avgRating.toFixed(1) : '—'}</p>
                      <Star className="w-4 h-4 fill-ink text-ink" />
                    </div>
                  </div>
                </div>
              )}

              {/* Booking summary card (mobile-friendly inline) */}
              <div className="mt-6 bg-canvas rounded-md border border-hairline p-5 lg:hidden">
                {minPrice !== null && (
                  <p className="text-xs text-mute font-bold uppercase tracking-wider mb-2">Bắt đầu từ</p>
                )}
                {minPrice !== null && (
                  <p className="font-display font-bold text-ink text-[24px] tracking-tight mb-4">{vnd.format(minPrice)}</p>
                )}
                {isAuthenticated && user?.role === 'BRAND' ? (
                  kol.status === 'APPROVED' ? (
                    <BookingFormDialog
                      kolProfileId={kol.id}
                      kolName={kol.displayName}
                      defaultBudget={minPrice ?? undefined}
                      triggerLabel="Đặt ngay"
                      triggerClassName="btn-pin-primary !rounded-full w-full !py-3"
                    />
                  ) : (
                    <p className="text-center text-xs font-bold text-pin-red bg-surface-card rounded-md p-3">
                      KOL chưa được phê duyệt
                    </p>
                  )
                ) : isAuthenticated && user?.role === 'KOL' && user?.userId === kol.userId ? (
                  <Link href="/kol-dashboard/profile" className="btn-pin-secondary !rounded-full w-full !py-3 justify-center">
                    Chỉnh sửa bảng giá
                  </Link>
                ) : isAuthenticated && user?.role === 'KOL' ? (
                  <p className="text-center text-xs text-mute bg-surface-card rounded-md p-3">
                    Chỉ tài khoản Brand mới có thể đặt lịch
                  </p>
                ) : !isAuthenticated ? (
                  <Link href="/auth/login" className="btn-pin-primary !rounded-full w-full !py-3 justify-center">
                    Đăng nhập để đặt
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Channels */}
              {kol.channels.length > 0 && (
                <div className="bg-canvas rounded-md border border-hairline p-8">
                  <h2 className="font-display font-bold text-ink text-[22px] tracking-tight mb-5">Kênh mạng xã hội</h2>
                  <ul className="divide-y divide-hairline-soft">
                    {kol.channels.map((ch) => (
                      <li key={ch.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink font-bold text-xs">
                            {PLATFORM_GLYPH[ch.platform] ?? ch.platform.slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-ink text-sm">{ch.platform}</p>
                            <p className="text-xs text-mute truncate">@{ch.username}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-ink text-sm">{formatFollowers(ch.followerCount)} người theo dõi</p>
                          <p className="text-xs text-mute">{ch.engagementRate}% engagement</p>
                        </div>
                        <a href={ch.url} target="_blank" rel="noopener noreferrer" className="grid place-items-center w-9 h-9 rounded-full text-mute hover:bg-surface-card hover:text-ink transition-colors shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Portfolio — masonry-style mini grid */}
              {kol.portfolio.length > 0 && (
                <div className="bg-canvas rounded-md border border-hairline p-8">
                  <h2 className="font-display font-bold text-ink text-[22px] tracking-tight mb-5">Portfolio</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kol.portfolio.map((item) => (
                      <PortfolioItemCard key={item.id} item={item} variant="grid" />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-canvas rounded-md border border-hairline p-8">
                <h2 className="font-display font-bold text-ink text-[22px] tracking-tight mb-5">
                  Đánh giá <span className="text-mute font-normal text-base">({kol.reviewCount})</span>
                </h2>
                {reviews.length > 0 ? (
                  <ul className="divide-y divide-hairline-soft">
                    {reviews.map((review) => (
                      <ReviewListItem key={review.id} review={review} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-mute text-sm">Chưa có đánh giá nào.</p>
                )}
              </div>
            </div>

            {/* Right rail — sticky booking card */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 bg-canvas rounded-md border border-hairline p-6">
                <h3 className="font-display font-bold text-ink text-[18px] mb-4">Bảng giá</h3>

                {kol.pricingPackages.length > 0 ? (
                  <ul className="space-y-2 mb-5">
                    {kol.pricingPackages.map((pkg) => (
                      <li key={pkg.id} className="flex items-start justify-between gap-3 p-3 bg-surface-card rounded-md">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{pkg.type} · {pkg.platform}</p>
                          {pkg.description && <p className="text-xs text-mute mt-0.5 line-clamp-2">{pkg.description}</p>}
                        </div>
                        <p className="text-sm font-bold text-ink shrink-0 whitespace-nowrap">{vnd.format(pkg.price)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-mute mb-5">Liên hệ để biết giá</p>
                )}

                {isAuthenticated && user?.role === 'BRAND' ? (
                  kol.status === 'APPROVED' ? (
                    <BookingFormDialog
                      kolProfileId={kol.id}
                      kolName={kol.displayName}
                      defaultBudget={minPrice ?? undefined}
                      triggerLabel="Đặt ngay"
                      triggerClassName="btn-pin-primary !rounded-full w-full !py-3"
                    />
                  ) : (
                    <p className="text-center text-xs font-bold text-pin-red bg-surface-card rounded-md p-3">
                      KOL chưa được phê duyệt
                    </p>
                  )
                ) : isAuthenticated && user?.role === 'KOL' && user?.userId === kol.userId ? (
                  <Link href="/kol-dashboard/profile" className="btn-pin-secondary !rounded-full w-full !py-3 justify-center">
                    Chỉnh sửa bảng giá
                  </Link>
                ) : isAuthenticated && user?.role === 'KOL' ? (
                  <p className="text-center text-xs text-mute bg-surface-card rounded-md p-3">
                    Chỉ tài khoản Brand mới có thể đặt lịch
                  </p>
                ) : !isAuthenticated ? (
                  <Link href="/auth/login" className="btn-pin-primary !rounded-full w-full !py-3 justify-center">
                    Đăng nhập để đặt
                  </Link>
                ) : null}

                <p className="text-xs text-mute text-center mt-4">
                  ✓ Thanh toán an toàn được bảo vệ bởi KOL Hub
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
