import type { Platform, ProductStatus, ApplicationStatus, TopApplicantsBy } from '@/lib/api/types';

export const PLATFORM_LABEL: Record<Platform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

export const PLATFORM_OPTIONS: Platform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  OPEN: 'Đang tuyển',
  CLOSED: 'Đã đóng',
};

/** Tailwind class pair (bg + text + border) for a product status badge. */
export const PRODUCT_STATUS_CLASS: Record<ProductStatus, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: 'Chờ duyệt',
  SHORTLISTED: 'Trong danh sách rút gọn',
  ACCEPTED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút',
};

export const APPLICATION_STATUS_CLASS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  SHORTLISTED: 'bg-violet-50 text-violet-700 border-violet-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const TOP_BY_OPTIONS: { value: TopApplicantsBy; label: string }[] = [
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'reviews', label: 'Nhiều nhận xét nhất' },
  { value: 'followers', label: 'Nhiều người theo dõi nhất' },
];

export const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

/** Compact follower count: 12.3K, 1.2M. */
export function formatFollowers(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}K`;
  return String(v);
}

/** dd/MM/yyyy from an ISO date / datetime string. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Days left until a deadline (null when no deadline). Negative when past. */
export function daysUntil(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end - today.getTime()) / 86_400_000);
}
