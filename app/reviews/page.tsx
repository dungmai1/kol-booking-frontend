'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ReviewCard } from '@/components/review-card';
import { mockReviews, mockKOLs, Review } from '@/lib/mock-data';
import { Star, Filter } from 'lucide-react';

export default function ReviewsPage() {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Add view count for sorting by helpful
  const reviewsWithViews = mockReviews.map(r => ({
    ...r,
    helpfulCount: Math.floor(Math.random() * 50) + 5
  }));

  let sortedReviews = [...reviewsWithViews];

  if (sortBy === 'recent') {
    sortedReviews.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sortBy === 'helpful') {
    sortedReviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
  } else if (sortBy === 'rating') {
    sortedReviews.sort((a, b) => b.rating - a.rating);
  }

  if (filterRating) {
    sortedReviews = sortedReviews.filter(r => r.rating === filterRating);
  }

  // Calculate statistics
  const avgRating = mockReviews.length > 0
    ? (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1)
    : 0;

  const ratingCounts = {
    5: mockReviews.filter(r => r.rating === 5).length,
    4: mockReviews.filter(r => r.rating === 4).length,
    3: mockReviews.filter(r => r.rating === 3).length,
    2: mockReviews.filter(r => r.rating === 2).length,
    1: mockReviews.filter(r => r.rating === 1).length,
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Đánh giá & Nhận xét</h1>
            <p className="text-gray-600 mt-2">Phản hồi từ cộng đồng thương hiệu và KOL</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Stats */}
            <div className="lg:col-span-1">
              {/* Rating Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng quan đánh giá</h3>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">{avgRating}</span>
                    <span className="text-gray-600">trên 5</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(parseFloat(avgRating as string))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Dựa trên {mockReviews.length} nhận xét
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Phân bố đánh giá</h3>

                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = ratingCounts[rating as keyof typeof ratingCounts];
                    const percentage = mockReviews.length > 0 ? (count / mockReviews.length) * 100 : 0;

                    return (
                      <button
                        key={rating}
                        onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                        className={`w-full text-left transition-colors ${
                          filterRating === rating
                            ? 'bg-blue-50 rounded px-3 py-2'
                            : 'hover:bg-gray-50 px-3 py-2 rounded'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-700">{rating}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filterRating && (
                  <button
                    onClick={() => setFilterRating(null)}
                    className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Reviews */}
            <div className="lg:col-span-3">
              {/* Sort Options */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful' | 'rating')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="recent">Mới nhất</option>
                  <option value="helpful">Hữu ích nhất</option>
                  <option value="rating">Đánh giá cao nhất</option>
                </select>
              </div>

              {/* Reviews List */}
              {sortedReviews.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {sortedReviews.map(review => (
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
        </div>
      </div>
    </>
  );
}
