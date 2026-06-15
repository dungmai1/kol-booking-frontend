import { Star } from 'lucide-react';
import type { ReviewResponse } from '@/lib/api/types';
import { ReviewAuthorLink } from '@/components/review-author-link';

export function ReviewListItem({ review }: { review: ReviewResponse }) {
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-4 mb-2">
        <ReviewAuthorLink review={review} className="text-sm font-bold text-ink hover:text-pin-red transition-colors" />
        <div className="flex items-center gap-2 shrink-0">
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
      </div>
      <p className="text-sm text-body leading-relaxed">{review.comment}</p>
    </li>
  );
}
