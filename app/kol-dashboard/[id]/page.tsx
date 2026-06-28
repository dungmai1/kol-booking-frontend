'use client';

import { Header } from '@/components/header';
import {
  Star, CheckCircle2, Users, TrendingUp, Calendar,
  DollarSign, Edit2, Settings, LogOut, MessageSquare,
  AlertCircle, Loader2, FileText, ExternalLink,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { kolApi } from '@/lib/api/kol';
import { bookingsApi } from '@/lib/api/bookings';
import { walletApi } from '@/lib/api/wallet';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { resolveMediaUrl } from '@/lib/api/client';
import { ReviewAuthorLink } from '@/components/review-author-link';
import type { KolProfileResponse, BookingResponse, ReviewResponse, WalletResponse } from '@/lib/api/types';

const tabLabels: Record<string, string> = {
  overview: 'Tổng quan',
  bookings: 'Đơn đặt',
  reviews: 'Nhận xét',
  settings: 'Cài đặt',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  ACCEPTED: 'Đã chấp nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã bàn giao',
  COMPLETED: 'Đã hoàn thành',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Đang tranh chấp',
  CANCELLED_BY_ADMIN: 'Đã hủy bởi admin',
  DELIVERY_REJECTED: 'Brand từ chối nội dung',
};

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

function fileNameFromUrl(url: string): string {
  const part = url.split('/').pop() ?? '';
  try {
    return decodeURIComponent(part) || 'Tệp đính kèm';
  } catch {
    return part || 'Tệp đính kèm';
  }
}

export default function KOLDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<KolProfileResponse | null>(null);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'settings'>('overview');
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      kolApi.getMyProfile(),
      bookingsApi.getIncoming(0, 50),
      walletApi.getMyWallet(),
      reviewsApi.getByUser(user.userId, 0, 20),
    ]).then(([pRes, bRes, wRes, rRes]) => {
      if (pRes.status === 'fulfilled') setProfile(pRes.value);
      if (bRes.status === 'fulfilled') setBookings(bRes.value.content);
      if (wRes.status === 'fulfilled') setWallet(wRes.value);
      if (rRes.status === 'fulfilled') setReviews(rRes.value.content);
    }).finally(() => setIsLoading(false));
  }, [user]);

  async function handleAccept(id: number) {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await bookingsApi.accept(id);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch {}
    setActionLoading(prev => ({ ...prev, [id]: false }));
  }

  async function handleReject(id: number) {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const updated = await bookingsApi.reject(id);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch {}
    setActionLoading(prev => ({ ...prev, [id]: false }));
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

  if (!profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy hồ sơ KOL</h1>
            <p className="text-gray-600 mb-4">Hãy tạo hồ sơ KOL của bạn trước.</p>
            <Link href="/discover" className="text-blue-600 hover:text-blue-700 font-medium">Quay lại</Link>
          </div>
        </div>
      </>
    );
  }

  const maxFollower = profile.channels.length
    ? Math.max(...profile.channels.map(c => c.followerCount))
    : 0;
  const avgEngagement = profile.channels.length
    ? (profile.channels.reduce((s, c) => s + c.engagementRate, 0) / profile.channels.length).toFixed(1)
    : '0';
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                {profile.avatarUrl ? (
                  <img src={resolveMediaUrl(profile.avatarUrl)} alt={profile.displayName} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white object-cover" />
                ) : (
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-4xl font-bold text-white">
                    {profile.displayName[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-4xl font-bold text-white">{profile.displayName}</h1>
                    {profile.status === 'APPROVED' && <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />}
                  </div>
                  <p className="text-blue-100">@{profile.slug}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {profile.channels.slice(0, 2).map(ch => (
                      <span key={ch.id} className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {ch.platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/kol-dashboard/profile"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa hồ sơ
                </Link>
                <Link
                  href={`/kol/${profile.slug}`}
                  className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {profile.status === 'APPROVED' ? 'Xem hồ sơ công khai' : 'Xem trước hồ sơ'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {pendingCount > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Bạn có {pendingCount} đơn đặt đang chờ duyệt!</p>
                <p className="text-amber-800 text-sm">Hãy xem và phản hồi các yêu cầu đặt lịch bên dưới.</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Người theo dõi</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {maxFollower >= 1_000_000
                      ? `${(maxFollower / 1_000_000).toFixed(1)}M`
                      : `${(maxFollower / 1_000).toFixed(0)}K`}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Tỷ lệ tương tác</p>
                  <p className="text-3xl font-bold text-gray-900">{avgEngagement}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Số dư ví</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {wallet ? vnd.format(wallet.balanceAvailable) : '—'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Đánh giá</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-gray-900">{avgRating ?? '—'}</p>
                    {avgRating && <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                  </div>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 flex">
              {(['overview', 'bookings', 'reviews', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
                    activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {profile.bio && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Về tôi</h3>
                      <p className="text-gray-700">{profile.bio}</p>
                    </div>
                  )}

                  {profile.channels.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Kênh mạng xã hội</h3>
                      <div className="space-y-3">
                        {profile.channels.map(ch => (
                          <div key={ch.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                            <span className="font-medium text-gray-900">{ch.platform} @{ch.username}</span>
                            <span className="text-sm text-gray-600">
                              {ch.followerCount >= 1_000_000
                                ? `${(ch.followerCount / 1_000_000).toFixed(1)}M`
                                : `${(ch.followerCount / 1_000).toFixed(0)}K`} • {ch.engagementRate}% ER
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.pricingPackages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bảng giá</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {profile.pricingPackages.map(pkg => (
                          <div key={pkg.id} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-600 text-sm mb-1">{pkg.type} — {pkg.platform}</p>
                            <p className="text-xl font-bold text-gray-900">{vnd.format(pkg.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bookings */}
              {activeTab === 'bookings' && (
                <div>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chưa có đơn đặt nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map(booking => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.campaignTitle}</h4>
                              <p className="text-gray-600 text-sm mt-1">
                                {new Date(booking.startDate).toLocaleDateString('vi-VN')} đến {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                              booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {statusLabel[booking.status] ?? booking.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-gray-700 text-sm">
                                Ngân sách: <span className="font-semibold">{vnd.format(booking.budget)}</span>
                              </p>
                              {booking.attachmentUrl && (
                                <a
                                  href={resolveMediaUrl(booking.attachmentUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  <FileText className="w-4 h-4" />
                                  {fileNameFromUrl(booking.attachmentUrl)}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {booking.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAccept(booking.id)}
                                  disabled={actionLoading[booking.id]}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                                >
                                  {actionLoading[booking.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => handleReject(booking.id)}
                                  disabled={actionLoading[booking.id]}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                                >
                                  Từ chối
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <div>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chưa có nhận xét nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <ReviewAuthorLink review={review} className="font-semibold text-gray-900 hover:text-pin-red transition-colors" />
                              <p className="text-gray-500 text-sm">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-4 max-w-lg">
                  <p className="text-gray-600 text-sm">
                    Cập nhật thông tin, kênh mạng xã hội và bảng giá để hồ sơ sẵn sàng nhận đơn đặt.
                  </p>
                  <Link
                    href="/kol-dashboard/profile"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Chỉnh sửa hồ sơ
                  </Link>
                  <Link
                    href={`/kol/${profile.slug}`}
                    className="inline-block ml-3 border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {profile.status === 'APPROVED' ? 'Xem hồ sơ công khai' : 'Xem trước hồ sơ'}
                  </Link>
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Vùng nguy hiểm</h4>
                    <button className="border-2 border-red-600 text-red-600 hover:bg-red-50 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Vô hiệu hóa tài khoản
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
