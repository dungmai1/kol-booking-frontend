'use client';

import { Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import type { ReviewResponse } from '@/lib/api/types';

interface ReviewCardProps {
  review: ReviewResponse & { helpfulCount?: number };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);

  function handleHelpful() {
    setHelpful(!helpful);
    setHelpfulCount(helpful ? helpfulCount - 1 : helpfulCount + 1);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold">
            {review.authorId}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Người dùng #{review.authorId}</h3>
            <p className="text-xs text-gray-500 capitalize">
              {review.direction === 'TO_KOL' ? 'Đánh giá KOL' : 'Đánh giá thương hiệu'}
            </p>
            <p className="text-sm text-gray-600">
              {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            {Array.from({ length: 5 - review.rating }).map((_, i) => (
              <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-900">{review.rating}.0</span>
        </div>
      </div>

      {/* Review Text */}
      <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

      {/* Helpful Button */}
      <button
        onClick={handleHelpful}
        className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
          helpful ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        Hữu ích {helpfulCount > 0 && `(${helpfulCount})`}
      </button>
    </div>
  );
}
