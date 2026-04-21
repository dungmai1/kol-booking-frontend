'use client';

import { Header } from '@/components/header';
import { mockBookings, mockKOLs, mockClients, mockReviews } from '@/lib/mock-data';
import { BarChart3, Users, BookOpen, Star, TrendingUp, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const bookingStatusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  accepted: 'Đã chấp nhận',
  completed: 'Đã hoàn thành',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

export default function DashboardPage() {
  // Calculate statistics
  const totalBookings = mockBookings.length;
  const activeBookings = mockBookings.filter(b => b.status === 'accepted').length;
  const completedBookings = mockBookings.filter(b => b.status === 'completed').length;
  const totalBudget = mockBookings.reduce((sum, b) => sum + b.budget, 0);
  const avgRating = mockReviews.length > 0
    ? (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1)
    : 0;

  const recentBookings = mockBookings.slice(0, 5);
  const recentReviews = mockReviews.slice(0, 3);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
            <p className="text-gray-600 mt-2">Chào mừng trở lại! Dưới đây là tổng quan hoạt động đặt KOL của bạn</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Bookings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Tổng đơn đặt</h3>
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
              <p className="text-xs text-gray-600 mt-2">{activeBookings} đang hoạt động</p>
            </div>

            {/* Total Budget */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Tổng ngân sách</h3>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-2">Toàn bộ chiến dịch</p>
            </div>

            {/* KOLs Worked With */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">KOL đã hợp tác</h3>
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{new Set(mockBookings.map(b => b.kolId)).size}</p>
              <p className="text-xs text-gray-600 mt-2">Nhà sáng tạo riêng biệt</p>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Đánh giá trung bình</h3>
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{avgRating}★</p>
              <p className="text-xs text-gray-600 mt-2">Từ {mockReviews.length} nhận xét</p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Bookings */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Đơn đặt gần đây</h2>
                  <Link href="/bookings" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Xem tất cả →
                  </Link>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Chiến dịch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">KOL</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ngân sách</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentBookings.map(booking => {
                        const kol = mockKOLs.find(k => k.id === booking.kolId);
                        return (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{booking.campaignName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{kol?.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">${booking.budget.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {bookingStatusLabels[booking.status] ?? booking.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Nhận xét gần đây</h2>
                  <Link href="/reviews" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Xem tất cả →
                  </Link>
                </div>

                {/* Reviews List */}
                <div className="divide-y divide-gray-200">
                  {recentReviews.map(review => (
                    <div key={review.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3 mb-2">
                        <img
                          src={review.reviewerAvatar}
                          alt={review.reviewerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {review.reviewerName}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Sẵn sàng khám phá thêm KOL?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl">
              Duyệt qua mạng lưới các nhà sáng tạo và KOL đã xác minh để tìm đối tác phù hợp cho chiến dịch tiếp theo.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/discover"
                className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Khám phá KOL
              </Link>
              <Link
                href="/reviews"
                className="border-2 border-white hover:bg-white/10 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Xem nhận xét
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
