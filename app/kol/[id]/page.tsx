'use client';

import { Header } from '@/components/header';
import { kolApi } from '@/lib/api/kol';
import { brandApi } from '@/lib/api/brand';
import { bookingsApi } from '@/lib/api/bookings';
import { reviewsApi } from '@/lib/api/reviews';
import type { KolPublicResponse, ReviewResponse } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Star,
  CheckCircle2,
  Users,
  MapPin,
  Heart,
  MessageSquare,
  Loader2,
  DollarSign,
  Calendar,
  ExternalLink,
  X,
} from 'lucide-react';
import { useState, use, useEffect, useCallback } from 'react';
import Link from 'next/link';

const PLATFORM_ICONS: Record<string, string> = {
  TIKTOK: '🎵',
  INSTAGRAM: '📸',
  YOUTUBE: '▶️',
  FACEBOOK: '👍',
};

export default function KOLDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const { user, isAuthenticated } = useAuth();

  const [kol, setKol] = useState<KolPublicResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Booking form state
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const profile = await kolApi.getPublicProfile(slug);
        setKol(profile);
        if (profile.userId) {
          const reviewsRes = await reviewsApi.getByUser(profile.userId, 0, 10);
          setReviews(reviewsRes.content);
        }
      } catch {
        setError('Không tìm thấy KOL này.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated || !kol) return;
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
  }, [isAuthenticated, kol, isFavorite]);

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kol) return;
    setBookingError('');
    setBookingLoading(true);
    try {
      await bookingsApi.create({
        kolProfileId: kol.id,
        campaignTitle,
        campaignBrief,
        deliverables,
        budget: parseFloat(budget),
        startDate,
        endDate,
      });
      setShowBookingForm(false);
      alert('Đã gửi yêu cầu đặt lịch thành công! KOL sẽ phản hồi sớm nhất.');
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Không thể tạo booking. Vui lòng thử lại.');
    } finally {
      setBookingLoading(false);
    }
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

  if (error || !kol) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy KOL</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/discover" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Quay lại tìm kiếm
            </Link>
          </div>
        </div>
      </>
    );
  }

  const minPrice = kol.pricingPackages.length > 0
    ? Math.min(...kol.pricingPackages.map((p) => p.price))
    : null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 py-12">
          {kol.coverUrl && (
            <img src={kol.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                {kol.avatarUrl ? (
                  <img
                    src={kol.avatarUrl}
                    alt={kol.displayName}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">{kol.displayName[0]}</span>
                  </div>
                )}
                {kol.status === 'APPROVED' && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 border-4 border-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{kol.displayName}</h1>
                    {(kol.city || kol.country) && (
                      <p className="text-blue-100 flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {[kol.city, kol.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  {isAuthenticated && user?.role === 'BRAND' && (
                    <button
                      onClick={handleFavorite}
                      disabled={favoriteLoading}
                      className="text-white hover:bg-white/20 p-3 rounded-full transition-colors disabled:opacity-50"
                    >
                      <Heart className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>

                {/* Channels quick stats */}
                {kol.channels.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kol.channels.slice(0, 4).map((ch) => (
                      <div key={ch.id} className="bg-white/20 rounded-lg p-3">
                        <p className="text-blue-100 text-xs">{PLATFORM_ICONS[ch.platform]} {ch.platform}</p>
                        <p className="text-xl font-bold">
                          {ch.followerCount >= 1_000_000
                            ? `${(ch.followerCount / 1_000_000).toFixed(1)}M`
                            : `${(ch.followerCount / 1_000).toFixed(0)}K`}
                        </p>
                      </div>
                    ))}
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-blue-100 text-xs">⭐ Đánh giá</p>
                      <p className="text-xl font-bold">
                        {kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Mới'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              {kol.bio && (
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu</h2>
                  <p className="text-gray-600 leading-relaxed">{kol.bio}</p>
                </div>
              )}

              {/* Social Channels */}
              {kol.channels.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Kênh mạng xã hội</h2>
                  <div className="space-y-4">
                    {kol.channels.map((ch) => (
                      <div key={ch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{PLATFORM_ICONS[ch.platform]}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{ch.platform}</p>
                            <p className="text-sm text-gray-600">@{ch.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {ch.followerCount >= 1_000_000
                              ? `${(ch.followerCount / 1_000_000).toFixed(1)}M`
                              : `${(ch.followerCount / 1_000).toFixed(0)}K`} followers
                          </p>
                          <p className="text-sm text-gray-600">{ch.engagementRate}% engagement</p>
                        </div>
                        <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-4">
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {kol.portfolio.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kol.portfolio.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {item.mediaType === 'IMAGE' ? (
                          <img src={item.mediaUrl} alt={item.title} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                            <span className="text-4xl">▶️</span>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                          {item.campaignName && <p className="text-xs text-gray-500 mt-0.5">{item.campaignName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Đánh giá ({kol.reviewCount})
                </h2>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có đánh giá nào</p>
                )}
              </div>
            </div>

            {/* Right - Booking card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-8 sticky top-20">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Bảng giá dịch vụ</h3>

                {kol.pricingPackages.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {kol.pricingPackages.map((pkg) => (
                      <div key={pkg.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{pkg.type} — {pkg.platform}</p>
                          {pkg.description && <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>}
                        </div>
                        <p className="font-bold text-gray-900 text-sm ml-4 whitespace-nowrap">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(pkg.price)}
                        </p>
                      </div>
                    ))}
                    {minPrice !== null && (
                      <p className="text-sm text-gray-500 text-center pt-2">Từ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(minPrice)}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-6">Liên hệ để biết giá</p>
                )}

                <div className="space-y-3">
                  {isAuthenticated && user?.role === 'BRAND' ? (
                    <>
                      {kol.status === 'APPROVED' ? (
                        <button
                          onClick={() => setShowBookingForm(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                          Đặt ngay
                        </button>
                      ) : (
                        <div className="text-center text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
                          KOL chưa được phê duyệt
                        </div>
                      )}
                    </>
                  ) : !isAuthenticated ? (
                    <Link
                      href="/auth/login"
                      className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      Đăng nhập để đặt
                    </Link>
                  ) : null}
                </div>

                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">✓ Thanh toán an toàn được bảo vệ bởi KOL Hub</p>
                </div>

                {kol.avgRating > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: Math.round(kol.avgRating) }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="font-bold text-gray-900">{kol.avgRating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600">Dựa trên {kol.reviewCount} đánh giá</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Đặt lịch với {kol.displayName}</h2>
              <button onClick={() => setShowBookingForm(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-5">
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {bookingError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên chiến dịch *</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  required
                  placeholder="VD: Ra mắt bộ sưu tập mùa hè"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Brief *</label>
                <textarea
                  value={campaignBrief}
                  onChange={(e) => setCampaignBrief(e.target.value)}
                  required
                  rows={4}
                  placeholder="Mô tả chi tiết chiến dịch và kỳ vọng..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deliverables</label>
                <textarea
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  rows={3}
                  placeholder='VD: [{"type":"VIDEO","platform":"TIKTOK","quantity":3}]'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Ngân sách (VND) *
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  min="1"
                  placeholder="10000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1" />Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1" />Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {bookingLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
