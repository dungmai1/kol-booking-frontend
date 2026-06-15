import { brandProfilePath } from '@/lib/brands/display';
import type { ReviewResponse } from '@/lib/api/types';

export function reviewAuthorLabel(review: ReviewResponse): string {
  return review.authorDisplayName?.trim() || `Người dùng #${review.authorId}`;
}

export function reviewAuthorHref(review: ReviewResponse): string | null {
  if (review.authorKolSlug) return `/kol/${review.authorKolSlug}`;
  if (review.authorBrandProfileId != null) return brandProfilePath(review.authorBrandProfileId);
  return null;
}

export function reviewDirectionLabel(direction: ReviewResponse['direction']): string {
  if (direction === 'BRAND_TO_KOL' || direction === 'TO_KOL') return 'Đánh giá KOL';
  return 'Đánh giá thương hiệu';
}

export function userProfileHref(user: {
  role?: string;
  kolSlug?: string | null;
  brandProfileId?: number | null;
}): string | null {
  if (user.kolSlug) return `/kol/${user.kolSlug}`;
  if (user.brandProfileId != null) return brandProfilePath(user.brandProfileId);
  return null;
}
