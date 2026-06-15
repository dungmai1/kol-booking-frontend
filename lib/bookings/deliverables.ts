import type { Platform, PricingPackageType } from '@/lib/api/types';

export interface BookingDeliverableSpec {
  type: PricingPackageType;
  platform: Platform;
  quantity?: number;
}

const PLATFORMS: Platform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];

const PACKAGE_TYPES: PricingPackageType[] = [
  'POST',
  'STORY',
  'VIDEO',
  'SHOUTOUT',
  'LONG_FORM',
  'CUSTOM',
];

export const platformLabel: Record<Platform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

export const packageTypeLabel: Record<PricingPackageType, string> = {
  POST: 'Bài đăng',
  STORY: 'Story',
  VIDEO: 'Video',
  SHOUTOUT: 'Nhắc tên',
  LONG_FORM: 'Nội dung dài',
  CUSTOM: 'Tuỳ chỉnh',
};

function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && PLATFORMS.includes(value as Platform);
}

function isPackageType(value: unknown): value is PricingPackageType {
  return typeof value === 'string' && PACKAGE_TYPES.includes(value as PricingPackageType);
}

/** Parse structured deliverables JSON from booking creation (e.g. `[{"type":"VIDEO","platform":"TIKTOK","quantity":3}]`). */
export function parseBookingDeliverables(raw: string | null | undefined): BookingDeliverableSpec[] {
  const trimmed = raw?.trim();
  if (!trimmed?.startsWith('[')) return [];

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      if (!isPackageType(record.type) || !isPlatform(record.platform)) return [];

      const quantity =
        typeof record.quantity === 'number' && Number.isFinite(record.quantity)
          ? record.quantity
          : undefined;

      return [{ type: record.type, platform: record.platform, quantity }];
    });
  } catch {
    return [];
  }
}

export function formatDeliverableSpec(spec: BookingDeliverableSpec): string {
  const qty = spec.quantity != null && spec.quantity > 1 ? ` ×${spec.quantity}` : '';
  return `${packageTypeLabel[spec.type]} · ${platformLabel[spec.platform]}${qty}`;
}

/** Best-effort platform guess from a submitted content URL. */
export function detectPlatformFromUrl(url: string): Platform | null {
  const lower = url.trim().toLowerCase();
  if (!lower) return null;
  if (lower.includes('tiktok.com')) return 'TIKTOK';
  if (lower.includes('instagram.com')) return 'INSTAGRAM';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YOUTUBE';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'FACEBOOK';
  return null;
}
