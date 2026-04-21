'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { mockBookings, mockKOLs, Booking } from '@/lib/mock-data';
import { Calendar, DollarSign, CheckCircle2, Clock, X, Eye } from 'lucide-react';
import Link from 'next/link';

const statusLabels: Record<string, string> = {
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  accepted: 'Đã chấp nhận',
  completed: 'Đã hoàn thành',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <X className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Đơn đặt của tôi</h1>
            <p className="text-gray-600 mt-2">Quản lý các yêu cầu đặt KOL và chiến dịch của bạn</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex gap-4 mb-8 flex-wrap">
            {(['all', 'pending', 'accepted', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Bookings Grid */}
          {filteredBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBookings.map(booking => {
                const kol = mockKOLs.find(k => k.id === booking.kolId);
                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Booking Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {booking.campaignName}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            KOL: {kol?.name}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {statusLabels[booking.status] ?? booking.status}
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-6 space-y-4">
                      {/* Dates */}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Thời gian</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.startDate).toLocaleDateString('vi-VN')} - {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Ngân sách</p>
                          <p className="font-medium text-gray-900">${booking.budget.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Chiến dịch</p>
                        <p className="text-gray-700 line-clamp-2">{booking.description}</p>
                      </div>

                      {/* Deliverables */}
                      {booking.deliverables.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Sản phẩm bàn giao</p>
                          <ul className="space-y-1">
                            {booking.deliverables.map((d, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-4 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 rounded-lg transition-colors">
                              Chấp nhận
                            </button>
                            <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 rounded-lg transition-colors">
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">Chưa có đơn đặt nào</p>
              <p className="text-gray-500 mb-6">Hãy bắt đầu khám phá và đặt KOL</p>
              <Link
                href="/discover"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Khám phá KOL
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">{selectedBooking.campaignName}</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${getStatusColor(selectedBooking.status)}`}>
                  {getStatusIcon(selectedBooking.status)}
                  {statusLabels[selectedBooking.status] ?? selectedBooking.status}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày bắt đầu</label>
                  <p className="text-lg text-gray-900">{new Date(selectedBooking.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày kết thúc</label>
                  <p className="text-lg text-gray-900">{new Date(selectedBooking.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngân sách</label>
                  <p className="text-lg text-gray-900">${selectedBooking.budget.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày tạo</label>
                  <p className="text-lg text-gray-900">{new Date(selectedBooking.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Mô tả</label>
                <p className="text-gray-700 leading-relaxed">{selectedBooking.description}</p>
              </div>

              {/* Deliverables */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3">Sản phẩm bàn giao</label>
                <ul className="space-y-2">
                  {selectedBooking.deliverables.map((d, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
