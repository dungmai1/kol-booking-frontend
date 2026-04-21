'use client';

import { Header } from '@/components/header';
import { mockKOLs, mockBookings, mockReviews } from '@/lib/mock-data';
import {
  Star,
  CheckCircle2,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Edit2,
  Settings,
  LogOut,
  MessageSquare,
  Eye,
  FileText,
  BarChart3,
  AlertCircle,
  CheckIcon,
  XIcon
} from 'lucide-react';
import { useState, use } from 'react';
import Link from 'next/link';

const tabLabels: Record<string, string> = {
  overview: 'Tổng quan',
  bookings: 'Đơn đặt',
  reviews: 'Nhận xét',
  settings: 'Cài đặt',
};

const bookingStatusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  accepted: 'Đã chấp nhận',
  completed: 'Đã hoàn thành',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

export default function KOLDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Find KOL by ID
  const kol = mockKOLs.find(k => k.id === id);
  const kolBookings = mockBookings.filter(b => b.kolId === kol?.id);
  const kolReviews = mockReviews.filter(r => mockBookings.find(b => b.id === r.bookingId && b.kolId === kol?.id));

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews' | 'settings'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [bookingActions, setBookingActions] = useState<Record<string, string>>({});

  if (!kol) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy KOL</h1>
            <p className="text-gray-600 mb-4">Hồ sơ KOL bạn đang tìm không tồn tại.</p>
            <Link href="/discover" className="text-blue-600 hover:text-blue-700 font-medium">
              Quay lại khám phá
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Calculate stats
  const totalEarnings = kolBookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.budget, 0);

  const averageRating = kolReviews.length > 0
    ? (kolReviews.reduce((sum, r) => sum + r.rating, 0) / kolReviews.length).toFixed(1)
    : 0;

  const pendingBookings = kolBookings.filter(b => b.status === 'pending').length;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={kol.avatar}
                  alt={kol.name}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-4xl font-bold text-white">{kol.name}</h1>
                    {kol.verified && (
                      <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
                    )}
                  </div>
                  <p className="text-blue-100">{kol.username}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {kol.category}
                    </span>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {kol.platform}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa hồ sơ
                </button>
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Cài đặt
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alert Banner */}
          {pendingBookings > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Bạn có {pendingBookings} đơn đặt đang chờ duyệt!</p>
                <p className="text-amber-800 text-sm">Hãy xem và phản hồi các yêu cầu đặt lịch bên dưới.</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Người theo dõi</p>
                  <p className="text-3xl font-bold text-gray-900">{(kol.followers / 1000).toFixed(0)}K</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Tỷ lệ tương tác</p>
                  <p className="text-3xl font-bold text-gray-900">{kol.engagementRate}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Tổng thu nhập</p>
                  <p className="text-3xl font-bold text-gray-900">${totalEarnings.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">Đánh giá</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 flex">
              {['overview', 'bookings', 'reviews', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Về tôi</h3>
                    <p className="text-gray-700">{kol.bio}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bảng giá</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-sm mb-1">Giá theo giờ</p>
                        <p className="text-2xl font-bold text-gray-900">${kol.hourlyRate}</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-sm mb-1">Giá theo tháng</p>
                        <p className="text-2xl font-bold text-gray-900">${kol.monthlyRate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-1">Chiến dịch trước đây</p>
                      <p className="text-2xl font-bold text-gray-900">{kol.previousCampaigns}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-1">Tổng nhận xét</p>
                      <p className="text-2xl font-bold text-gray-900">{kolReviews.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-1">Tỷ lệ hoàn thành</p>
                      <p className="text-2xl font-bold text-gray-900">100%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  {kolBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chưa có đơn đặt nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {kolBookings.map(booking => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{booking.campaignName}</h4>
                              <p className="text-gray-600 text-sm mt-1">
                                {booking.startDate} đến {booking.endDate}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bookingStatusLabels[booking.status] ?? booking.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-600 text-sm">Ngân sách: <span className="font-semibold text-gray-900">${booking.budget}</span></p>
                              <p className="text-gray-600 text-sm">Sản phẩm bàn giao: <span className="font-semibold text-gray-900">{Array.isArray(booking.deliverables) ? booking.deliverables.join(', ') : booking.deliverables}</span></p>
                            </div>

                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setBookingActions({...bookingActions, [booking.id]: 'accepted'})}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                  Chấp nhận
                                </button>
                                <button
                                  onClick={() => setBookingActions({...bookingActions, [booking.id]: 'rejected'})}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <XIcon className="w-4 h-4" />
                                  Từ chối
                                </button>
                              </div>
                            )}
                          </div>

                          {bookingActions[booking.id] && (
                            <div className={`mt-3 p-3 rounded-lg ${
                              bookingActions[booking.id] === 'accepted'
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <p className={bookingActions[booking.id] === 'accepted' ? 'text-green-800' : 'text-red-800'}>
                                {bookingActions[booking.id] === 'accepted'
                                  ? '✓ Đã chấp nhận đơn đặt thành công!'
                                  : '✗ Đã từ chối đơn đặt'}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  {kolReviews.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Chưa có nhận xét nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {kolReviews.map((review: any) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{review.reviewerName}</p>
                              <p className="text-gray-600 text-sm">{review.reviewerRole}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                          <p className="text-gray-500 text-sm mt-2">{review.date ?? (review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={`${kol.username}@email.com`}
                        disabled={!editMode}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        defaultValue="+84 909 123 456"
                        disabled={!editMode}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu</label>
                      <textarea
                        defaultValue={kol.bio}
                        disabled={!editMode}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      {!editMode ? (
                        <button
                          onClick={() => setEditMode(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Chỉnh sửa
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditMode(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-semibold transition-colors"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Vùng nguy hiểm</h4>
                      <button className="border-2 border-red-600 text-red-600 hover:bg-red-50 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Vô hiệu hóa tài khoản
                      </button>
                    </div>
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
