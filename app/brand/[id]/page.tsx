'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Star,
} from 'lucide-react';
import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { brandApi } from '@/lib/api/brand';
import { productsApi } from '@/lib/api/products';
import { reviewsApi } from '@/lib/api/reviews';
import { resolveMediaUrl } from '@/lib/api/client';
import type { BrandPublicResponse, ProductResponse, ReviewResponse } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';

export default function BrandProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const brandId = Number(idStr);
  const { user } = useAuth();

  const [brand, setBrand] = useState<BrandPublicResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwnerPreview, setIsOwnerPreview] = useState(false);

  useEffect(() => {
    if (Number.isNaN(brandId)) {
      setError('Không tìm thấy thương hiệu này.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError('');
      setIsOwnerPreview(false);
      try {
        const profile = await brandApi.getPublicProfile(brandId);
        if (cancelled) return;
        setBrand(profile);
        setIsOwnerPreview(profile.status !== 'APPROVED');

        const [productsRes, reviewsRes] = await Promise.allSettled([
          brandApi.getPublicProducts(brandId, 0, 12).catch(() =>
            productsApi.browse({ brandProfileId: brandId, page: 0, size: 12 }),
          ),
          reviewsApi.getByUser(profile.userId, 0, 10),
        ]);

        if (cancelled) return;
        if (productsRes.status === 'fulfilled') setProducts(productsRes.value.content);
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.content);
      } catch {
        if (!cancelled) setError('Không tìm thấy thương hiệu này.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

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

  if (error || !brand) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-surface-soft">
          <div className="text-center max-w-sm">
            <h1 className="font-display font-bold text-ink text-[28px] tracking-tight mb-2">
              Không tìm thấy thương hiệu
            </h1>
            <p className="text-mute mb-6">{error}</p>
            <Link href="/products" className="btn-pin-primary !rounded-full">
              ← Xem chiến dịch
            </Link>
          </div>
        </div>
      </>
    );
  }

  const logoSrc = resolveMediaUrl(brand.logoUrl);
  const isOwner = user?.role === 'BRAND' && user.userId === brand.userId;
  const websiteHref = brand.website?.trim()
    ? /^https?:\/\//i.test(brand.website) ? brand.website : `https://${brand.website}`
    : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {isOwnerPreview && isOwner && (
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-6">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Hồ sơ của bạn chưa được công khai hoặc chưa được phê duyệt.{' '}
              <Link href="/profile" className="font-bold underline hover:text-pin-red">
                Hoàn thiện hồ sơ tại đây
              </Link>
            </div>
          </div>
        )}

        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-secondary-bg border border-hairline">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt={brand.companyName}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-surface-card">
                    <Building2 className="w-20 h-20 text-mute" />
                  </div>
                )}
                {brand.status === 'APPROVED' && (
                  <span className="pin-overlay-pill top-4 left-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pin-red mr-1.5" />
                    Đã xác minh
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider text-mute mb-2">Thương hiệu</p>
              <h1 className="font-display font-extrabold text-ink text-[40px] lg:text-[52px] tracking-[-1.2px] leading-[1.05]">
                {brand.companyName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm font-semibold text-mute">
                {brand.industry && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas border border-hairline text-ink">
                    <Briefcase className="w-4 h-4" />
                    {brand.industry}
                  </span>
                )}
                {(brand.country || brand.address) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {[brand.address, brand.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              {brand.bio && (
                <p className="text-body text-base lg:text-lg leading-relaxed mt-5 max-w-2xl">
                  {brand.bio}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 max-w-lg">
                <div className="bg-canvas rounded-md border border-hairline p-4">
                  <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Đánh giá</p>
                  <div className="flex items-baseline gap-1">
                    <p className="font-display font-bold text-ink text-[22px] tracking-tight">
                      {brand.avgRating > 0 ? brand.avgRating.toFixed(1) : '—'}
                    </p>
                    <Star className="w-4 h-4 fill-ink text-ink" />
                  </div>
                </div>
                <div className="bg-canvas rounded-md border border-hairline p-4">
                  <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Nhận xét</p>
                  <p className="font-display font-bold text-ink text-[22px] tracking-tight">
                    {brand.reviewCount}
                  </p>
                </div>
                <div className="bg-canvas rounded-md border border-hairline p-4">
                  <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Chiến dịch</p>
                  <p className="font-display font-bold text-ink text-[22px] tracking-tight">
                    {products.length}
                  </p>
                </div>
              </div>

              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ink hover:text-pin-red transition-colors w-fit"
                >
                  <Globe className="w-4 h-4" />
                  {brand.website}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-canvas rounded-md border border-hairline p-8">
                <h2 className="font-display font-bold text-ink text-[22px] tracking-tight mb-5">
                  Chiến dịch đang mở
                </h2>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-mute text-sm">Thương hiệu chưa có chiến dịch công khai nào.</p>
                )}
              </div>

              <div className="bg-canvas rounded-md border border-hairline p-8">
                <h2 className="font-display font-bold text-ink text-[22px] tracking-tight mb-5">
                  Đánh giá <span className="text-mute font-normal text-base">({brand.reviewCount})</span>
                </h2>
                {reviews.length > 0 ? (
                  <ul className="divide-y divide-hairline-soft">
                    {reviews.map((review) => (
                      <li key={review.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'fill-ink text-ink' : 'text-stone'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-mute">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm text-body leading-relaxed">{review.comment}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-mute text-sm">Chưa có đánh giá nào.</p>
                )}
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-20 bg-canvas rounded-md border border-hairline p-6">
                <h3 className="font-display font-bold text-ink text-[18px] mb-4">Hợp tác với thương hiệu</h3>
                {user?.role === 'KOL' ? (
                  <>
                    <p className="text-sm text-body leading-relaxed mb-4">
                      Xem các chiến dịch đang mở và ứng tuyển trực tiếp từ trang chi tiết chiến dịch.
                    </p>
                    <Link href="/products" className="btn-pin-primary !rounded-full w-full !py-3 justify-center">
                      Khám phá chiến dịch
                    </Link>
                  </>
                ) : isOwner ? (
                  <Link href="/profile" className="btn-pin-secondary !rounded-full w-full !py-3 justify-center">
                    Chỉnh sửa hồ sơ
                  </Link>
                ) : !user ? (
                  <Link href="/auth/login" className="btn-pin-primary !rounded-full w-full !py-3 justify-center">
                    Đăng nhập
                  </Link>
                ) : (
                  <p className="text-sm text-mute">
                    Thương hiệu này đang tìm KOL cho các chiến dịch trên nền tảng.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
