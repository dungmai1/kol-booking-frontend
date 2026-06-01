'use client';

import { Header } from '@/components/header';
import {
  Star, CheckCircle2, Users, TrendingUp, MapPin, Calendar,
  MessageSquare, Heart, ArrowLeft, Link as LinkIcon, Loader2,
} from 'lucide-react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { kolApi } from '@/lib/api/kol';
import { brandApi } from '@/lib/api/brand';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import type { KolPublicResponse, ReviewResponse } from '@/lib/api/types';
import { BookingFormDialog } from '@/components/booking-form';

const tabLabels: Record<string, string> = {
  overview: 'Tổng quan',
  reviews: 'Nhận xét',
  portfolio: 'Portfolio',
};

export default function KOLProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<KolPublicResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'portfolio'>('overview');

  useEffect(() => {
    kolApi.getPublicProfile(slug)
      .then(async (p) => {
        setProfile(p);
        try {
          const r = await reviewsApi.getByUser(p.userId, 0, 50);
          setReviews(r.content);
        } catch {}
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  async function handleFavorite() {
    if (!profile) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await brandApi.removeFavorite(profile.id);
      } else {
        await brandApi.addFavorite(profile.id);
      }
      setIsFavorite(!isFavorite);
    } catch {}
    setFavoriteLoading(false);
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      </>
    );
  }

  if (notFound || !profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy KOL</h1>
            <p className="text-gray-600 mb-6">Hồ sơ bạn đang tìm không tồn tại.</p>
            <Link href="/kol-profiles" className="text-blue-600 hover:text-blue-700 font-medium">
              Quay lại danh sách KOL
            </Link>
          </div>
        </div>
      </>
    );
  }

  const maxFollower = profile.channels.length
    ? Math.max(...profile.channels.map(c => c.followerCount))
    : 0;
  const minPrice = profile.pricingPackages.length
    ? Math.min(...profile.pricingPackages.map(p => p.price))
    : undefined;
  const ratingBreakdown = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
  }));

  const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/kol-profiles" className="inline-flex items-center gap-2 text-white hover:text-blue-100 mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Quay lại danh sách
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} className="w-40 h-40 rounded-full border-4 border-white object-cover shadow-xl" />
                ) : (
                  <div className="w-40 h-40 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-5xl font-bold text-white">
                    {profile.displayName[0]}
                  </div>
                )}
                {profile.status === 'APPROVED' && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-3 border-4 border-white">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{profile.displayName}</h1>
                    {(profile.city || profile.country) && (
                      <p className="text-blue-100 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {[profile.city, profile.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  {isAuthenticated && user?.role === 'BRAND' && (
                    <button
                      onClick={handleFavorite}
                      disabled={favoriteLoading}
                      className="p-3 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
                    >
                      <Heart className={`w-8 h-8 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Followers</p>
                    <p className="text-2xl font-bold">
                      {maxFollower >= 1_000_000
                        ? `${(maxFollower / 1_000_000).toFixed(1)}M`
                        : `${(maxFollower / 1_000).toFixed(0)}K`}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Đánh giá</p>
                    <p className="text-2xl font-bold">{profile.avgRating > 0 ? profile.avgRating.toFixed(1) : 'Mới'}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Nhận xét</p>
                    <p className="text-2xl font-bold">{profile.reviewCount}</p>
                  </div>
                  {minPrice !== undefined && (
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Giá từ</p>
                      <p className="text-lg font-bold">{vnd.format(minPrice)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              {profile.bio && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Giới thiệu</h2>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                  {(['overview', 'reviews', 'portfolio'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                        activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tabLabels[tab]}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {profile.channels.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Kênh mạng xã hội</h3>
                          <div className="space-y-3">
                            {profile.channels.map(ch => (
                              <div key={ch.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div>
                                  <span className="font-medium text-gray-900">{ch.platform}</span>
                                  <span className="text-gray-500 ml-2">@{ch.username}</span>
                                </div>
                                <div className="text-right text-sm text-gray-600">
                                  <span className="font-semibold text-gray-900">
                                    {ch.followerCount >= 1_000_000
                                      ? `${(ch.followerCount / 1_000_000).toFixed(1)}M`
                                      : `${(ch.followerCount / 1_000).toFixed(0)}K`}
                                  </span>
                                  <span className="ml-2">{ch.engagementRate}% ER</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.pricingPackages.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Bảng giá</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {profile.pricingPackages.map(pkg => (
                              <div key={pkg.id} className="border-2 border-blue-100 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">{pkg.type} — {pkg.platform}</p>
                                <p className="text-xl font-bold text-blue-600">{vnd.format(pkg.price)}</p>
                                {pkg.description && <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4">
                      {reviews.length > 0 ? reviews.map(review => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">Người dùng #{review.authorId}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      )) : (
                        <p className="text-gray-600 text-center py-8">Chưa có nhận xét nào</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div>
                      {profile.portfolio.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {profile.portfolio.map(item => (
                            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              {item.mediaType === 'IMAGE' ? (
                                <img src={item.mediaUrl} alt={item.title} className="w-full h-40 object-cover" />
                              ) : (
                                <video src={item.mediaUrl} className="w-full h-40 object-cover" />
                              )}
                              <div className="p-3">
                                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.campaignName}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">Chưa có portfolio</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Rating summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
                <h3 className="font-bold text-gray-900 mb-4">Tổng quan đánh giá</h3>
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-4xl font-bold text-gray-900">
                    {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                  </p>
                  <div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{profile.reviewCount} nhận xét</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {ratingBreakdown.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-6">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full rounded-full"
                          style={{ width: `${profile.reviewCount > 0 ? (count / profile.reviewCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
                {isAuthenticated && user?.role === 'BRAND' && (
                  <BookingFormDialog
                    kolProfileId={profile.id}
                    kolName={profile.displayName}
                    defaultBudget={minPrice}
                    triggerLabel="Đặt ngay"
                  />
                )}
                <button className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Gửi tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
