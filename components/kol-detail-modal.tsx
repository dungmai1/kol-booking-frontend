'use client';

import { X, Star, Users, TrendingUp, CheckCircle2, MapPin, Calendar, MessageSquare, Heart, ArrowRight } from 'lucide-react';
import { KOL } from '@/lib/mock-data';
import Link from 'next/link';

interface KOLDetailModalProps {
  kol: KOL;
  onClose: () => void;
  onBook?: () => void;
}

export function KOLDetailModal({ kol, onClose, onBook }: KOLDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        {/* Header with close button */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 py-8 px-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={kol.avatar}
                alt={kol.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
              {kol.verified && (
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 border-2 border-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-3xl font-bold">{kol.name}</h2>
                  <p className="text-blue-100">@{kol.username}</p>
                </div>
                <button
                  onClick={() => {}}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <Heart className="w-6 h-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    kol.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : kol.status === 'on_holiday'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {kol.status === 'active'
                    ? 'Đang hoạt động'
                    : kol.status === 'on_holiday'
                    ? 'Đang nghỉ'
                    : 'Không hoạt động'}
                </span>
                <span className="text-blue-100 text-sm">{kol.category}</span>
                <span className="text-blue-100 text-sm">{kol.platform}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Giới thiệu</h3>
            <p className="text-gray-600 leading-relaxed">{kol.bio}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900">
                  {(kol.followers / 1000).toFixed(1)}K
                </p>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Người theo dõi</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">{kol.engagementRate}%</p>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Tương tác</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <p className="text-2xl font-bold text-gray-900">{kol.rating}</p>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Đánh giá</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-purple-600" />
                <p className="text-2xl font-bold text-gray-900">{kol.previousCampaigns}</p>
              </div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Chiến dịch</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Bảng giá</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Giá theo giờ</p>
                <p className="text-2xl font-bold text-gray-900">${kol.hourlyRate}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Giá theo tháng</p>
                <p className="text-2xl font-bold text-gray-900">${kol.monthlyRate}</p>
              </div>
            </div>
          </div>

          {/* Reviews Summary */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Nhận xét</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
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
              <span className="text-gray-600">
                {kol.rating} ({kol.reviewCount} nhận xét)
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Liên hệ</h3>
            <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              <MessageSquare className="w-5 h-5" />
              Gửi tin nhắn
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={onBook}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Đặt ngay
              </button>
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-3 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
            <Link
              href={`/kol-profiles/${kol.id}`}
              className="block text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Xem hồ sơ đầy đủ
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
