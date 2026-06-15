'use client';

import { Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import type { ReviewResponse } from '@/lib/api/types';
import { ReviewAuthorLink } from '@/components/review-author-link';
import { reviewDirectionLabel } from '@/lib/users/profile-link';

interface ReviewCardProps {
  review: ReviewResponse & { helpfulCount?: number };
}

/**
 * Review card — flat surface (DESIGN.md §Elevation calls for no shadows on
 * content cards). Star glyph fills with `--ink`, not yellow, so the chrome
 * stays monochrome with Pinterest Red reserved for primary CTAs.
 */
export function ReviewCard({ review }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);

  function handleHelpful() {
    setHelpful(!helpful);
    setHelpfulCount(helpful ? helpfulCount - 1 : helpfulCount + 1);
  }

  return (
    <article className="bg-canvas rounded-md border border-hairline p-6">
      <header className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <ReviewAuthorLink review={review} />
          <p className="text-xs text-mute capitalize mt-1">{reviewDirectionLabel(review.direction)}</p>
          <p className="text-xs text-mute">
            {new Date(review.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? 'fill-ink text-ink' : 'text-stone'}`}
            />
          ))}
        </div>
      </header>

      <p className="text-sm text-body leading-relaxed mb-4">{review.comment}</p>

      <button
        onClick={handleHelpful}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
          helpful ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        Hữu ích {helpfulCount > 0 && `· ${helpfulCount}`}
      </button>
    </article>
  );
}
