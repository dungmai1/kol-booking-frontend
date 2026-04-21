'use client';

import { Header } from '@/components/header';
import { mockKOLs, mockReviews } from '@/lib/mock-data';
import {
  Star,
  CheckCircle2,
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  MessageSquare,
  Heart,
  ArrowLeft,
  Link as LinkIcon,
  Mail,
  Phone
} from 'lucide-react';
import { useState, use } from 'react';
import Link from 'next/link';
import { BookingForm } from '@/components/booking-form';

const tabLabels: Record<string, string> = {
  overview: 'Tổng quan',
  reviews: 'Nhận xét',
  portfolio: 'Portfolio',
};

export default function KOLProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const kol = mockKOLs.find(k => k.id === id);
  const kolReviews = mockReviews.filter((r: any) => r.kolId === id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'portfolio'>('overview');

  if (!kol) {
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

  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: kolReviews.filter(r => r.rating === rating).length,
  }));

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/kol-profiles" className="inline-flex items-center gap-2 text-white hover:text-blue-100 mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Quay lại danh sách
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Section */}
              <div className="relative">
                <img
                  src={kol.avatar}
                  alt={kol.name}
                  className="w-40 h-40 rounded-full border-4 border-white object-cover shadow-xl"
                />
                {kol.verified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-3 border-4 border-white">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">{kol.name}</h1>
                    <p className="text-xl text-blue-100">@{kol.username}</p>
                  </div>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  >
                    <Heart className={`w-8 h-8 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                  </button>
                </div>

                {/* Status & Category */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      kol.status === 'active'
                        ? 'bg-green-100 text-green-900'
                        : kol.status === 'on_holiday'
                        ? 'bg-yellow-100 text-yellow-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {kol.status === 'active' ? 'Đang hoạt động' : kol.status === 'on_holiday' ? 'Đang nghỉ' : 'Không hoạt động'}
                  </span>
                  <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-semibold">
                    {kol.category}
                  </span>
                  <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-semibold">
                    {kol.platform}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Người theo dõi</p>
                    <p className="text-2xl font-bold">{(kol.followers / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Tương tác</p>
                    <p className="text-2xl font-bold">{kol.engagementRate}%</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Đánh giá</p>
                    <p className="text-2xl font-bold flex items-center gap-1">{kol.rating} ⭐</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Chiến dịch</p>
                    <p className="text-2xl font-bold">{kol.previousCampaigns}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Giới thiệu</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{kol.bio}</p>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                  {['overview', 'reviews', 'portfolio'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as 'overview' | 'reviews' | 'portfolio')}
                      className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
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
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Detailed Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-gray-600 text-sm mb-2">Người theo dõi</p>
                          <p className="text-3xl font-bold text-gray-900">{kol.followers.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-gray-600 text-sm mb-2">Tỷ lệ tương tác</p>
                          <p className="text-3xl font-bold text-gray-900">{kol.engagementRate}%</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-gray-600 text-sm mb-2">Chiến dịch trước đây</p>
                          <p className="text-3xl font-bold text-gray-900">{kol.previousCampaigns}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-gray-600 text-sm mb-2">Số lượng nhận xét</p>
                          <p className="text-3xl font-bold text-gray-900">{kol.reviewCount}</p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Bảng giá</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border-2 border-blue-600 p-4 rounded-lg">
                            <p className="text-gray-600 text-sm mb-2">Giá theo giờ</p>
                            <p className="text-3xl font-bold text-blue-600">${kol.hourlyRate}</p>
                          </div>
                          <div className="border-2 border-purple-600 p-4 rounded-lg">
                            <p className="text-gray-600 text-sm mb-2">Giá theo tháng</p>
                            <p className="text-3xl font-bold text-purple-600">${kol.monthlyRate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      {kolReviews.length > 0 ? (
                        kolReviews.map((review: any) => (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">{review.reviewerName}</p>
                                <p className="text-sm text-gray-600">{review.reviewerTitle}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-center py-8">Chưa có nhận xét nào</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div className="text-center py-8">
                      <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Nội dung portfolio sẽ sớm có mặt</p>
                      {kol.portfolioUrl && (
                        <a
                          href={kol.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          Truy cập Portfolio →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Quick Stats Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 sticky top-20">
                <h3 className="font-bold text-gray-900 mb-4">Tổng quan đánh giá</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900">{kol.rating}</p>
                    <div className="flex gap-1 justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(kol.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Dựa trên</p>
                    <p className="font-bold text-gray-900">{kol.reviewCount} nhận xét</p>
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-3">
                  {ratingBreakdown.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-8">{rating}⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full rounded-full transition-all"
                          style={{
                            width: `${
                              kol.reviewCount > 0
                                ? (count / kol.reviewCount) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3 sticky top-96">
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Đặt ngay
                </button>
                <button className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Gửi tin nhắn
                </button>
                <button className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 rounded-lg transition-colors">
                  Báo cáo hồ sơ
                </button>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">Liên hệ</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <Mail className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Gửi email</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <MessageSquare className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Nhắn tin trực tiếp</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <LinkIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Truy cập website</span>
                  </button>
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
            alert('Đã gửi yêu cầu đặt lịch thành công!');
            setShowBookingForm(false);
          }}
        />
      )}
    </>
  );
}
