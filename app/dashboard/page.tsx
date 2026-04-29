'use client';

import { Header } from '@/components/header';
import { BarChart3, Users, BookOpen, Star, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { bookingsApi } from '@/lib/api/bookings';
import { walletApi } from '@/lib/api/wallet';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingResponse, ReviewResponse, WalletResponse } from '@/lib/api/types';

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
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  DISPUTED: 'bg-orange-100 text-orange-800',
  CANCELLED_BY_ADMIN: 'bg-gray-100 text-gray-800',
};

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const role = user.role;
    Promise.allSettled([
      role === 'KOL'
        ? bookingsApi.getIncoming(0, 5)
        : bookingsApi.getMyBookings(0, 5),
      walletApi.getMyWallet(),
      reviewsApi.getByUser(user.userId, 0, 3),
    ]).then(([bRes, wRes, rRes]) => {
      if (bRes.status === 'fulfilled') setBookings(bRes.value.content);
      if (wRes.status === 'fulfilled') setWallet(wRes.value);
      if (rRes.status === 'fulfilled') setReviews(rRes.value.content);
    }).finally(() => setIsLoading(false));
  }, [user]);

  const activeCount = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').length;
  const totalBudget = bookings.reduce((s, b) => s + b.budget, 0);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
            <p className="text-gray-600 mt-2">Chào mừng trở lại! Dưới đây là tổng quan hoạt động của bạn.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Tổng đơn đặt</h3>
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                  <p className="text-xs text-gray-600 mt-2">{activeCount} đang hoạt động</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Ví của bạn</h3>
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {wallet ? vnd.format(wallet.balanceAvailable) : '—'}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {wallet ? `Giữ: ${vnd.format(wallet.balanceHeld)}` : 'Chưa có dữ liệu'}
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Tổng ngân sách</h3>
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vnd.format(totalBudget)}</p>
                  <p className="text-xs text-gray-600 mt-2">Toàn bộ chiến dịch</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Đánh giá trung bình</h3>
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{avgRating ? `${avgRating}★` : '—'}</p>
                  <p className="text-xs text-gray-600 mt-2">Từ {reviews.length} nhận xét</p>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Bookings */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">Đơn đặt gần đây</h2>
                      <Link href="/bookings" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Xem tất cả →
                      </Link>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="p-12 text-center text-gray-500">Chưa có đơn đặt nào</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Chiến dịch</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ngân sách</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bookings.map(b => (
                              <tr key={b.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{b.campaignTitle}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{vnd.format(b.budget)}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                    {statusLabel[b.status] ?? b.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">Nhận xét gần đây</h2>
                      <Link href="/reviews" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Xem tất cả →
                      </Link>
                    </div>
                    {reviews.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">Chưa có nhận xét nào</div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {reviews.map(review => (
                          <div key={review.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Sẵn sàng khám phá thêm KOL?</h2>
                <p className="text-blue-100 mb-6 max-w-2xl">
                  Duyệt qua mạng lưới các nhà sáng tạo và KOL đã xác minh để tìm đối tác phù hợp.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Link href="/discover" className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-lg transition-colors">
                    Khám phá KOL
                  </Link>
                  <Link href="/reviews" className="border-2 border-white hover:bg-white/10 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Xem nhận xét
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
