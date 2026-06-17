'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
  Users,
} from 'lucide-react';
import { Header } from '@/components/header';
import { kolApi } from '@/lib/api/kol';
import { resolveMediaUrl } from '@/lib/api/client';
import type { KolProfileResponse } from '@/lib/api/types';

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('vi-VN');
}

const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

const PKG_TYPE_LABEL: Record<string, string> = {
  POST: 'Bài đăng',
  STORY: 'Story',
  VIDEO: 'Video',
  SHOUTOUT: 'Shoutout',
  LONG_FORM: 'Nội dung dài',
  CUSTOM: 'Tùy chỉnh',
};

export default function MediaKitPage() {
  const [profile, setProfile] = useState<KolProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    kolApi
      .getMyProfile()
      .then(setProfile)
      .catch(() => setError('Không thể tải hồ sơ.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-pin-red">{error || 'Không tìm thấy hồ sơ.'}</p>
          <Link href="/kol-dashboard/profile" className="btn-pin-primary mt-4 inline-flex">
            Tạo hồ sơ
          </Link>
        </main>
      </div>
    );
  }

  const generatedDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <>
      {/* Screen nav — hidden when printing */}
      <div className="print:hidden">
        <Header />
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <Link
            href="/kol-dashboard/profile"
            className="inline-flex items-center gap-2 text-sm font-bold text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại hồ sơ
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 btn-pin-primary"
          >
            <Download className="w-4 h-4" />
            Tải PDF
          </button>
        </div>
      </div>

      {/* ─── Media Kit content — renders on screen + print ─── */}
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 pb-16 print:px-0 print:pb-0 print:max-w-none">

        {/* Hero */}
        <section className="pin-card p-0 overflow-hidden mb-6 print:shadow-none print:border-0">
          {profile.coverUrl && (
            <div className="h-36 sm:h-48 bg-secondary-bg overflow-hidden print:h-32">
              <img
                src={resolveMediaUrl(profile.coverUrl)}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="px-6 pb-6 pt-4 flex items-end gap-5">
            {profile.avatarUrl ? (
              <img
                src={resolveMediaUrl(profile.avatarUrl)}
                alt={profile.displayName}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-canvas flex-shrink-0 ${profile.coverUrl ? '-mt-12 sm:-mt-14' : ''}`}
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary-bg flex items-center justify-center flex-shrink-0 ${profile.coverUrl ? '-mt-12 sm:-mt-14' : ''}`}
              >
                <span className="text-3xl font-bold text-mute">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink tracking-tight leading-tight">
                {profile.displayName}
              </h1>
              {(profile.city || profile.country) && (
                <p className="flex items-center gap-1 text-sm text-mute mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  {profile.avgRating.toFixed(1)} ({profile.reviewCount} đánh giá)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bio */}
        {profile.bio && (
          <section className="pin-card mb-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="font-display font-extrabold text-lg text-ink mb-3">Giới thiệu</h2>
            <p className="text-body-text leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </section>
        )}

        {/* Social Channels */}
        {profile.channels.length > 0 && (
          <section className="pin-card mb-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="font-display font-extrabold text-lg text-ink mb-4">
              Kênh mạng xã hội
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between gap-3 bg-secondary-bg rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-sm">{PLATFORM_LABEL[ch.platform] ?? ch.platform}</p>
                    <p className="text-mute text-xs truncate">@{ch.username}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="flex items-center gap-1 text-sm font-bold text-ink">
                      <Users className="w-3.5 h-3.5 text-mute" />
                      {fmtFollowers(ch.followerCount)}
                    </p>
                    {ch.engagementRate > 0 && (
                      <p className="text-xs text-mute">ER {ch.engagementRate.toFixed(1)}%</p>
                    )}
                  </div>
                  {ch.url && (
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mute hover:text-ink print:hidden"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing Packages */}
        {profile.pricingPackages.length > 0 && (
          <section className="pin-card mb-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="font-display font-extrabold text-lg text-ink mb-4">Bảng giá</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.pricingPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-hairline-soft rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-sm">
                      {PKG_TYPE_LABEL[pkg.type] ?? pkg.type}
                    </p>
                    <p className="text-xs text-mute">{PLATFORM_LABEL[pkg.platform] ?? pkg.platform}</p>
                    {pkg.description && (
                      <p className="text-xs text-mute mt-1 line-clamp-2">{pkg.description}</p>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-ink flex-shrink-0">
                    {vnd.format(pkg.price)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {profile.portfolio.length > 0 && (
          <section className="pin-card mb-6 print:shadow-none print:border print:border-gray-200">
            <h2 className="font-display font-extrabold text-lg text-ink mb-4">Portfolio</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.portfolio.map((item) => (
                <div key={item.id} className="rounded-xl overflow-hidden border border-hairline-soft">
                  {item.mediaUrl && item.mediaType === 'IMAGE' && (
                    <img
                      src={resolveMediaUrl(item.mediaUrl)}
                      alt={item.title}
                      className="w-full h-36 object-cover"
                    />
                  )}
                  {item.mediaUrl && item.mediaType === 'VIDEO' && (
                    <div className="bg-secondary-bg h-36 grid place-items-center">
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mute hover:text-ink print:hidden"
                      >
                        <ExternalLink className="w-6 h-6" />
                      </a>
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <p className="font-bold text-ink text-sm line-clamp-1">{item.title}</p>
                    {item.campaignName && (
                      <p className="text-xs text-mute">{item.campaignName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-mute py-4 print:py-2">
          <p>
            Media Kit · {profile.displayName} · Ngày tạo {generatedDate}
          </p>
          <p className="mt-1">
            Liên hệ qua nền tảng KOL Booking
          </p>
        </footer>
      </main>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { margin: 16mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border-width: 1px !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:pb-0 { padding-bottom: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:h-32 { height: 8rem !important; }
          .print\\:py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
        }
      `}</style>
    </>
  );
}
