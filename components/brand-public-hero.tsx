import {
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  Star,
} from 'lucide-react';
import { resolveMediaUrl } from '@/lib/api/client';
import type { ProfileStatus } from '@/lib/api/types';

export type BrandPublicHeroData = {
  companyName: string;
  industry?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  country?: string | null;
  bio?: string | null;
  website?: string | null;
  status?: ProfileStatus;
  avgRating?: number;
  reviewCount?: number;
  campaignCount?: number;
};

function websiteHref(website?: string | null): string | null {
  const trimmed = website?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function BrandPublicHero({ brand }: { brand: BrandPublicHeroData }) {
  const logoSrc = resolveMediaUrl(brand.logoUrl);
  const href = websiteHref(brand.website);
  const location = [brand.address, brand.country].filter(Boolean).join(', ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4">
        <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-secondary-bg border border-hairline">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={brand.companyName || 'Logo thương hiệu'}
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
        <h2 className="font-display font-extrabold text-ink text-[32px] lg:text-[44px] tracking-[-1.2px] leading-[1.05]">
          {brand.companyName.trim() || 'Tên thương hiệu'}
        </h2>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-sm font-semibold text-mute">
          {brand.industry && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas border border-hairline text-ink">
              <Briefcase className="w-4 h-4" />
              {brand.industry}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
          )}
        </div>

        {brand.bio ? (
          <p className="text-body text-base lg:text-lg leading-relaxed mt-5 max-w-2xl">{brand.bio}</p>
        ) : (
          <p className="text-mute text-sm mt-5 max-w-2xl italic">Chưa có giới thiệu công ty.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 max-w-lg">
          <div className="bg-canvas rounded-md border border-hairline p-4">
            <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Đánh giá</p>
            <div className="flex items-baseline gap-1">
              <p className="font-display font-bold text-ink text-[22px] tracking-tight">
                {brand.avgRating != null && brand.avgRating > 0 ? brand.avgRating.toFixed(1) : '—'}
              </p>
              <Star className="w-4 h-4 fill-ink text-ink" />
            </div>
          </div>
          <div className="bg-canvas rounded-md border border-hairline p-4">
            <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Nhận xét</p>
            <p className="font-display font-bold text-ink text-[22px] tracking-tight">
              {brand.reviewCount ?? 0}
            </p>
          </div>
          <div className="bg-canvas rounded-md border border-hairline p-4">
            <p className="text-xs text-mute font-bold uppercase tracking-wider mb-1">Chiến dịch</p>
            <p className="font-display font-bold text-ink text-[22px] tracking-tight">
              {brand.campaignCount ?? 0}
            </p>
          </div>
        </div>

        {href && (
          <a
            href={href}
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
  );
}
