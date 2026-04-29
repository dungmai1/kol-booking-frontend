'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { ReviewCard } from '@/components/review-card';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import type { ReviewResponse } from '@/lib/api/types';
import { Star, Filter, Loader2 } from 'lucide-react';

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    reviewsApi.getByUser(user.userId, 0, 100)
      .then(r => setReviews(r.content))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  let displayed = [...reviews];

  if (filterRating) {
    displayed = displayed.filter(r => r.rating === filterRating);
  }

  if (sortBy === 'recent') {
    displayed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    displayed.sort((a, b) => b.rating - a.rating);
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingCounts = [5, 4, 3, 2, 1].reduce<Record<number, number>>((acc, n) => {
    acc[n] = reviews.filter(r => r.rating === n).length;
    return acc;
  }, {});

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Đánh giá & Nhận xét</h1>
            <p className="text-gray-600 mt-2">Phản hồi từ cộng đồng thương hiệu và KOL</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">Bạn cần đăng nhập để xem nhận xét</p>
              <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">Đăng nhập →</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng quan đánh giá</h3>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">{avgRating ?? '—'}</span>
                      <span className="text-gray-600">trên 5</span>
                    </div>
                    {avgRating && (
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(parseFloat(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Dựa trên {reviews.length} nhận xét</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Phân bố đánh giá</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = ratingCounts[rating] ?? 0;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <button
                          key={rating}
                          onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                          className={`w-full text-left px-3 py-2 rounded transition-colors ${filterRating === rating ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 w-5">{rating}★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm text-gray-500 w-5 text-right">{count}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {filterRating && (
                    <button onClick={() => setFilterRating(null)} className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>

              {/* Reviews list */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="recent">Mới nhất</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>
                </div>

                {displayed.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {displayed.map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <p className="text-gray-600 text-lg mb-2">Chưa có nhận xét nào</p>
                    <p className="text-gray-500">Hãy là người đầu tiên để lại nhận xét</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
