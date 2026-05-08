'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { ReviewCard } from '@/components/review-card';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import type { ReviewResponse } from '@/lib/api/types';
import { Star, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    reviewsApi.getByUser(user.userId, 0, 100)
      .then(r => setReviews(r.content))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  let displayed = [...reviews];
  if (filterRating) displayed = displayed.filter(r => r.rating === filterRating);
  if (sortBy === 'recent') displayed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else displayed.sort((a, b) => b.rating - a.rating);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const ratingCounts = [5, 4, 3, 2, 1].reduce<Record<number, number>>((acc, n) => {
    acc[n] = reviews.filter(r => r.rating === n).length;
    return acc;
  }, {});

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-6">
          <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">Đánh giá & Nhận xét</h1>
          <p className="text-mute mt-2">Phản hồi từ cộng đồng thương hiệu và KOL.</p>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-16">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-ink font-bold mb-3">Bạn cần đăng nhập để xem nhận xét</p>
              <Link href="/auth/login" className="btn-pin-primary !rounded-full">Đăng nhập</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-4">
                <div className="bg-canvas rounded-md border border-hairline p-6">
                  <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-3">Tổng quan</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display font-extrabold text-ink text-[44px] tracking-tight leading-none">{avgRating ?? '—'}</span>
                    <span className="text-mute text-sm">/ 5</span>
                  </div>
                  {avgRating && (
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(parseFloat(avgRating)) ? 'fill-ink text-ink' : 'text-stone'}`} />
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-mute">Dựa trên {reviews.length} nhận xét</p>
                </div>

                <div className="bg-canvas rounded-md border border-hairline p-6">
                  <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-3">Phân bố</h3>
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = ratingCounts[rating] ?? 0;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      const active = filterRating === rating;
                      return (
                        <button
                          key={rating}
                          onClick={() => setFilterRating(active ? null : rating)}
                          className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors ${active ? 'bg-surface-card' : 'hover:bg-surface-card'}`}
                        >
                          <span className="text-xs font-bold text-ink w-4">{rating}</span>
                          <Star className="w-3 h-3 fill-ink text-ink shrink-0" />
                          <div className="flex-1 h-1.5 bg-hairline-soft rounded-full overflow-hidden">
                            <div className="h-full bg-ink rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-mute w-6 text-right">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  {filterRating && (
                    <button onClick={() => setFilterRating(null)} className="w-full mt-4 text-sm font-bold text-ink-soft hover:text-pin-red">
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </aside>

              {/* List */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-bold text-mute">Sắp xếp:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
                    className="bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-focus-outer cursor-pointer"
                  >
                    <option value="recent">Mới nhất</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>
                </div>

                {displayed.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {displayed.map(review => <ReviewCard key={review.id} review={review} />)}
                  </div>
                ) : (
                  <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
                    <p className="text-ink font-bold mb-2">Chưa có nhận xét nào</p>
                    <p className="text-mute">Hãy là người đầu tiên để lại nhận xét.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
