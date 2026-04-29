'use client';

import {
  X, Star, Users, TrendingUp, CheckCircle2, MessageSquare, Heart, ArrowRight, Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { kolApi } from '@/lib/api/kol';
import { brandApi } from '@/lib/api/brand';
import { useAuth } from '@/contexts/AuthContext';
import type { KolSummaryResponse, KolPublicResponse } from '@/lib/api/types';
import { BookingForm } from './booking-form';

interface KOLDetailModalProps {
  kol: KolSummaryResponse;
  onClose: () => void;
}

export function KOLDetailModal({ kol, onClose }: KOLDetailModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<KolPublicResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    kolApi.getPublicProfile(kol.slug)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [kol.slug]);

  async function handleFavorite() {
    if (!isAuthenticated) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await brandApi.removeFavorite(kol.id);
      } else {
        await brandApi.addFavorite(kol.id);
      }
      setIsFavorite(!isFavorite);
    } catch {
      // ignore
    } finally {
      setFavoriteLoading(false);
    }
  }

  const displayProfile = profile;
  const minPrice = displayProfile?.pricingPackages.length
    ? Math.min(...displayProfile.pricingPackages.map((p) => p.price))
    : kol.minPrice;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 py-8 px-6 text-white rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-start gap-4">
            <div className="relative">
              {kol.avatarUrl ? (
                <img
                  src={kol.avatarUrl}
                  alt={kol.displayName}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {kol.displayName[0]}
                </div>
              )}
              {displayProfile?.status === 'APPROVED' && (
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold">{kol.displayName}</h2>
                  {(kol.city || kol.country) && (
                    <p className="text-blue-100 text-sm">{[kol.city, kol.country].filter(Boolean).join(', ')}</p>
                  )}
                </div>
                {isAuthenticated && user?.role === 'BRAND' && (
                  <button
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="font-bold text-lg">
                    {kol.maxFollowerCount >= 1_000_000
                      ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
                      : `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`}
                  </p>
                  <p className="text-blue-100 text-xs">Followers</p>
                </div>
                <div>
                  <p className="font-bold text-lg">
                    {kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Mới'}
                  </p>
                  <p className="text-blue-100 text-xs">Đánh giá</p>
                </div>
                <div>
                  <p className="font-bold text-lg">{kol.reviewCount}</p>
                  <p className="text-blue-100 text-xs">Nhận xét</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Bio */}
              {displayProfile?.bio && (
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Giới thiệu</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{displayProfile.bio}</p>
                </div>
              )}

              {/* Channels */}
              {displayProfile && displayProfile.channels.length > 0 && (
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kênh mạng xã hội</h3>
                  <div className="space-y-2">
                    {displayProfile.channels.map((ch) => (
                      <div key={ch.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                        <span className="text-sm font-medium text-gray-900">{ch.platform} @{ch.username}</span>
                        <span className="text-sm text-gray-600">
                          {ch.followerCount >= 1_000_000
                            ? `${(ch.followerCount / 1_000_000).toFixed(1)}M`
                            : `${(ch.followerCount / 1_000).toFixed(0)}K`} • {ch.engagementRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {displayProfile && displayProfile.pricingPackages.length > 0 && (
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bảng giá</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {displayProfile.pricingPackages.slice(0, 4).map((pkg) => (
                      <div key={pkg.id} className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{pkg.type} — {pkg.platform}</p>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(pkg.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews summary */}
              <div className="mb-6 pb-5 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Đánh giá</h3>
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(kol.avgRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">
                    {kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Chưa có'} ({kol.reviewCount} nhận xét)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {isAuthenticated && user?.role === 'BRAND' && (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Đặt ngay
                  </button>
                )}
                <div className="flex gap-3">
                  <Link
                    href={`/kol/${kol.slug}`}
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    Xem hồ sơ đầy đủ
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={onClose}
                    className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nested Booking Form */}
      {showBookingForm && (
        <BookingForm
          kol={{ id: kol.id, displayName: kol.displayName, minPrice }}
          onClose={() => setShowBookingForm(false)}
          onSuccess={onClose}
        />
      )}
    </div>
  );
}
