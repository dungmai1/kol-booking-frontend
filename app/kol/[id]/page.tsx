'use client';

import { Header } from '@/components/header';
import { mockKOLs, mockReviews } from '@/lib/mock-data';
import { Star, CheckCircle2, Users, TrendingUp, MapPin, Calendar, MessageSquare, Heart } from 'lucide-react';
import { useState, use } from 'react';
import { BookingForm } from '@/components/booking-form';

export default function KOLDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const kol = mockKOLs.find(k => k.id === id);
  const kolReviews = mockReviews.filter(r => r.reviewerName !== kol?.name);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  if (!kol) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy KOL</h1>
            <p className="text-gray-600">KOL bạn đang tìm không tồn tại.</p>
          </div>
        </div>
      </>
    );
  }

  const statusLabel = kol.status === 'active'
    ? 'Đang hoạt động'
    : kol.status === 'on_holiday'
    ? 'Đang nghỉ'
    : 'Không hoạt động';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={kol.avatar}
                  alt={kol.name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover"
                />
                {kol.verified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 border-4 border-white">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{kol.name}</h1>
                    <p className="text-blue-100 text-lg mb-2">{kol.username}</p>
                    <p className="text-blue-100">{kol.category}</p>
                  </div>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="text-white hover:bg-white/20 p-3 rounded-full transition-colors"
                  >
                    <Heart
                      className="w-6 h-6"
                      fill={isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-blue-100 text-sm">Người theo dõi</p>
                    <p className="text-2xl font-bold">{(kol.followers / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-blue-100 text-sm">Tương tác</p>
                    <p className="text-2xl font-bold">{kol.engagementRate}%</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-blue-100 text-sm">Đánh giá</p>
                    <p className="text-2xl font-bold">{kol.rating}★</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-blue-100 text-sm">Chiến dịch</p>
                    <p className="text-2xl font-bold">{kol.previousCampaigns}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu</h2>
                <p className="text-gray-600 leading-relaxed text-lg">{kol.bio}</p>

                {kol.portfolioUrl && (
                  <a
                    href={kol.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Xem portfolio →
                  </a>
                )}
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông tin chi tiết</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Nền tảng</label>
                    <p className="text-lg text-gray-900">{kol.platform}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Danh mục</label>
                    <p className="text-lg text-gray-900">{kol.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Trạng thái</label>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <p className="text-lg text-gray-900">{statusLabel}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Đã xác minh</label>
                    <p className="text-lg text-gray-900">{kol.verified ? '✓ Có' : 'Chưa'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Người theo dõi</label>
                    <p className="text-lg text-gray-900">{(kol.followers / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Tỷ lệ tương tác</label>
                    <p className="text-lg text-gray-900">{kol.engagementRate}%</p>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Nhận xét ({kolReviews.length})
                </h2>

                {kolReviews.length > 0 ? (
                  <div className="space-y-6">
                    {kolReviews.map(review => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start gap-4 mb-3">
                          <img
                            src={review.reviewerAvatar}
                            alt={review.reviewerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{review.reviewerName}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Chưa có nhận xét nào</p>
                )}
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-8 sticky top-20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Bảng giá</h3>

                <div className="space-y-6 mb-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Giá theo giờ</p>
                    <p className="text-4xl font-bold text-gray-900">${kol.hourlyRate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Giá theo tháng</p>
                    <p className="text-4xl font-bold text-gray-900">${kol.monthlyRate}</p>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-3">
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Đặt ngay
                  </button>
                  <button className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Nhắn tin
                  </button>
                </div>

                {/* Guarantee */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✓ Thanh toán an toàn được bảo vệ bởi KOL Hub
                  </p>
                </div>

                {/* Rating */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {Array.from({ length: Math.round(kol.rating) }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="font-bold text-gray-900">{kol.rating}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Dựa trên {kol.reviewCount} nhận xét
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && kol && (
        <BookingForm
          kol={kol}
          onClose={() => setShowBookingForm(false)}
          onSubmit={(booking) => {
            console.log('Booking submitted:', booking);
            alert('Đã gửi yêu cầu đặt lịch thành công! Chúng tôi sẽ thông báo cho KOL.');
          }}
        />
      )}
    </>
  );
}
