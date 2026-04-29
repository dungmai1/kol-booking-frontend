'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { bookingsApi } from '@/lib/api/bookings';
import type { BookingResponse, BookingStatus } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  X,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

const statusLabels: Record<BookingStatus | 'all', string> = {
  all: 'Tất cả',
  PENDING: 'Chờ duyệt',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  DISPUTED: 'Tranh chấp',
  CANCELLED_BY_ADMIN: 'Admin hủy',
};

const filterOptions: Array<BookingStatus | 'all'> = [
  'all', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED',
];

function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'PENDING': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'ACCEPTED': return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'IN_PROGRESS': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'DELIVERED': return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'COMPLETED': return 'bg-green-50 text-green-800 border-green-200';
    case 'DISPUTED': return 'bg-orange-50 text-orange-800 border-orange-200';
    default: return 'bg-gray-50 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status: BookingStatus) {
  switch (status) {
    case 'PENDING': return <Clock className="w-4 h-4" />;
    case 'ACCEPTED':
    case 'COMPLETED':
    case 'DELIVERED': return <CheckCircle2 className="w-4 h-4" />;
    case 'DISPUTED': return <AlertTriangle className="w-4 h-4" />;
    default: return <X className="w-4 h-4" />;
  }
}

export default function BookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchBookings = useCallback(async (currentPage = 0) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError('');
    try {
      const fetcher = user?.role === 'KOL'
        ? bookingsApi.getIncoming(currentPage, 10)
        : bookingsApi.getMyBookings(currentPage, 10);
      const res = await fetcher;
      setBookings(res.content);
      setTotalPages(res.totalPages);
      setPage(currentPage);
    } catch {
      setError('Không thể tải danh sách đơn đặt. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchBookings(0);
  }, [fetchBookings]);

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  async function handleAccept(id: number) {
    setActionLoading(id);
    try {
      await bookingsApi.accept(id);
      await fetchBookings(page);
      if (selectedBooking?.id === id) setSelectedBooking(null);
    } catch {
      alert('Không thể chấp nhận đơn. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: number) {
    const reason = window.prompt('Lý do từ chối (không bắt buộc):') ?? undefined;
    setActionLoading(id);
    try {
      await bookingsApi.reject(id, reason || undefined);
      await fetchBookings(page);
      if (selectedBooking?.id === id) setSelectedBooking(null);
    } catch {
      alert('Không thể từ chối đơn. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;
    const reason = window.prompt('Lý do hủy (không bắt buộc):') ?? undefined;
    setActionLoading(id);
    try {
      await bookingsApi.cancel(id, reason || undefined);
      await fetchBookings(page);
      if (selectedBooking?.id === id) setSelectedBooking(null);
    } catch {
      alert('Không thể hủy đơn. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Bạn cần đăng nhập để xem đơn đặt</p>
            <Link href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'KOL' ? 'Đơn được gửi đến' : 'Đơn đặt của tôi'}
            </h1>
            <p className="text-gray-600 mt-2">Quản lý các yêu cầu đặt KOL và chiến dịch của bạn</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {filterOptions.map((status) => (
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

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg border border-red-200 p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => fetchBookings(0)} className="text-blue-600 hover:text-blue-700 font-medium">
                Thử lại
              </button>
            </div>
          ) : filteredBookings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{booking.campaignTitle}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">#{booking.id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {statusLabels[booking.status]}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Thời gian</p>
                          <p className="font-medium text-gray-900">
                            {new Date(booking.startDate).toLocaleDateString('vi-VN')} – {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Ngân sách</p>
                          <p className="font-medium text-gray-900">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(booking.budget)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Mô tả chiến dịch</p>
                        <p className="text-gray-700 line-clamp-2 text-sm">{booking.campaignBrief}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </button>

                        {user?.role === 'KOL' && booking.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAccept(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                            >
                              {actionLoading === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Chấp nhận
                            </button>
                            <button
                              onClick={() => handleReject(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Từ chối
                            </button>
                          </>
                        )}

                        {user?.role === 'BRAND' && booking.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Hủy đơn
                          </button>
                        )}

                        {user?.role === 'BRAND' && booking.status === 'ACCEPTED' && (
                          <Link
                            href={`/bookings/${booking.id}/payment`}
                            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            <DollarSign className="w-4 h-4" />
                            Thanh toán
                          </Link>
                        )}

                        {user?.role === 'BRAND' && booking.status === 'DELIVERED' && (
                          <button
                            onClick={async () => {
                              if (!confirm('Xác nhận đã nhận kết quả và hoàn thành booking?')) return;
                              setActionLoading(booking.id);
                              try {
                                await bookingsApi.approveDelivery(booking.id);
                                await fetchBookings(page);
                              } catch {
                                alert('Không thể xác nhận. Vui lòng thử lại.');
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === booking.id}
                            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Xác nhận hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => fetchBookings(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-700 text-sm">Trang {page + 1} / {totalPages}</span>
                  <button
                    onClick={() => fetchBookings(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">Chưa có đơn đặt nào</p>
              {user?.role !== 'KOL' && (
                <>
                  <p className="text-gray-500 mb-6">Hãy bắt đầu khám phá và đặt KOL</p>
                  <Link href="/discover" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                    Khám phá KOL
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">{selectedBooking.campaignTitle}</h2>
              <button onClick={() => setSelectedBooking(null)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${getStatusColor(selectedBooking.status)}`}>
                {getStatusIcon(selectedBooking.status)}
                {statusLabels[selectedBooking.status]}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngân sách</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(selectedBooking.budget)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày tạo</label>
                  <p className="text-gray-900">{new Date(selectedBooking.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày bắt đầu</label>
                  <p className="text-gray-900">{new Date(selectedBooking.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày kết thúc</label>
                  <p className="text-gray-900">{new Date(selectedBooking.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Campaign Brief</label>
                <p className="text-gray-700 leading-relaxed">{selectedBooking.campaignBrief}</p>
              </div>

              {selectedBooking.deliverables && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Deliverables</label>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg">{selectedBooking.deliverables}</p>
                </div>
              )}

              {selectedBooking.rejectReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                  <p className="text-sm text-red-700 mt-1">{selectedBooking.rejectReason}</p>
                </div>
              )}

              {selectedBooking.cancelReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-800">Lý do hủy:</p>
                  <p className="text-sm text-orange-700 mt-1">{selectedBooking.cancelReason}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <Link
                  href={`/bookings/${selectedBooking.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Xem đầy đủ
                </Link>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
