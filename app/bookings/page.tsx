'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { bookingsApi } from '@/lib/api/bookings';
import { bookingBrandLabel, bookingKolLabel } from '@/lib/bookings/display';
import type { BookingResponse, BookingStatus } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
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
  DELIVERY_REJECTED: 'Từ chối nội dung',
};

const filterOptions: Array<BookingStatus | 'all'> = [
  'all', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED',
];

function statusPillStyle(status: BookingStatus): string {
  switch (status) {
    case 'PENDING': return 'bg-surface-card text-ink';
    case 'ACCEPTED':
    case 'IN_PROGRESS':
    case 'DELIVERED': return 'bg-ink text-on-dark';
    case 'COMPLETED': return 'text-on-dark';
    case 'DISPUTED':
    case 'REJECTED':
    case 'CANCELLED':
    case 'CANCELLED_BY_ADMIN':
    case 'DELIVERY_REJECTED': return 'bg-pin-red text-on-dark';
    default: return 'bg-surface-card text-ink';
  }
}

function statusIcon(status: BookingStatus) {
  switch (status) {
    case 'PENDING': return <Clock className="w-3.5 h-3.5" />;
    case 'ACCEPTED':
    case 'COMPLETED':
    case 'DELIVERED': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'DISPUTED': return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <X className="w-3.5 h-3.5" />;
  }
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

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

  useEffect(() => { fetchBookings(0); }, [fetchBookings]);

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  async function handleAccept(id: number) {
    setActionLoading(id);
    try { await bookingsApi.accept(id); await fetchBookings(page); if (selectedBooking?.id === id) setSelectedBooking(null); }
    catch { alert('Không thể chấp nhận đơn.'); } finally { setActionLoading(null); }
  }
  async function handleReject(id: number) {
    const reason = window.prompt('Lý do từ chối (không bắt buộc):') ?? undefined;
    setActionLoading(id);
    try { await bookingsApi.reject(id, reason || undefined); await fetchBookings(page); if (selectedBooking?.id === id) setSelectedBooking(null); }
    catch { alert('Không thể từ chối đơn.'); } finally { setActionLoading(null); }
  }
  async function handleCancel(id: number) {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;
    const reason = window.prompt('Lý do hủy (không bắt buộc):') ?? undefined;
    setActionLoading(id);
    try { await bookingsApi.cancel(id, reason || undefined); await fetchBookings(page); if (selectedBooking?.id === id) setSelectedBooking(null); }
    catch { alert('Không thể hủy đơn.'); } finally { setActionLoading(null); }
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-surface-soft">
          <div className="text-center max-w-sm">
            <h1 className="font-display font-bold text-ink text-[28px] tracking-tight mb-3">Cần đăng nhập</h1>
            <p className="text-mute mb-6">Bạn cần đăng nhập để xem và quản lý đơn đặt của mình.</p>
            <Link href="/auth/login" className="btn-pin-primary !rounded-full">Đăng nhập</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-6">
          <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">
            {user?.role === 'KOL' ? 'Đơn được gửi đến' : 'Đơn đặt của tôi'}
          </h1>
          <p className="text-mute mt-2 max-w-xl">Quản lý các yêu cầu đặt KOL và chiến dịch của bạn.</p>
        </div>

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-16">
          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filterOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`pin-chip shrink-0 ${filter === status ? 'pin-chip-active' : ''}`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-pin-red font-bold mb-4">{error}</p>
              <button onClick={() => fetchBookings(0)} className="btn-pin-secondary !rounded-full">Thử lại</button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-ink text-lg font-bold mb-2">Chưa có đơn đặt nào</p>
              {user?.role !== 'KOL' && (
                <>
                  <p className="text-mute mb-6">Hãy bắt đầu khám phá và đặt KOL</p>
                  <Link href="/discover" className="btn-pin-primary !rounded-full">Khám phá KOL</Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBookings.map((booking) => (
                  <article key={booking.id} className="bg-canvas rounded-md border border-hairline overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-ink text-[18px] leading-tight truncate">{booking.campaignTitle}</h3>
                          <p className="text-xs text-mute mt-1">
                            #{booking.id}
                            {user?.role === 'KOL' && (
                              <> · {bookingBrandLabel(booking)}</>
                            )}
                            {user?.role === 'BRAND' && booking.kolDisplayName && (
                              <> · {bookingKolLabel(booking)}</>
                            )}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusPillStyle(booking.status)}`} style={booking.status === 'COMPLETED' ? { background: 'var(--success-deep)' } : undefined}>
                          {statusIcon(booking.status)}
                          {statusLabels[booking.status]}
                        </span>
                      </div>

                      <dl className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <dt className="text-xs text-mute font-semibold mb-1">Thời gian</dt>
                          <dd className="text-sm text-ink font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-mute" />
                            {new Date(booking.startDate).toLocaleDateString('vi-VN')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-mute font-semibold mb-1">Ngân sách</dt>
                          <dd className="text-sm text-ink font-bold">{vnd.format(booking.budget)}</dd>
                        </div>
                      </dl>

                      <p className="text-sm text-body line-clamp-2 mb-5">{booking.campaignBrief}</p>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-hairline-soft">
                        <button onClick={() => setSelectedBooking(booking)} className="btn-pin-secondary !rounded-full !py-2 !px-4 text-xs">
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </button>

                        {user?.role === 'KOL' && booking.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleAccept(booking.id)} disabled={actionLoading === booking.id} className="btn-pin-primary !rounded-full !py-2 !px-4 text-xs">
                              {actionLoading === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Chấp nhận
                            </button>
                            <button onClick={() => handleReject(booking.id)} disabled={actionLoading === booking.id} className="btn-pin-tertiary !rounded-full !py-2 !px-4 text-xs">
                              <X className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </>
                        )}
                        {user?.role === 'BRAND' && booking.status === 'PENDING' && (
                          <button onClick={() => handleCancel(booking.id)} disabled={actionLoading === booking.id} className="btn-pin-tertiary !rounded-full !py-2 !px-4 text-xs">
                            <X className="w-3.5 h-3.5" /> Hủy đơn
                          </button>
                        )}
                        {user?.role === 'BRAND' && booking.status === 'ACCEPTED' && (
                          <Link href={`/bookings/${booking.id}/payment`} className="btn-pin-primary !rounded-full !py-2 !px-4 text-xs">
                            Thanh toán
                          </Link>
                        )}
                        {user?.role === 'BRAND' && booking.status === 'DELIVERED' && (
                          <button
                            onClick={async () => {
                              if (!confirm('Xác nhận đã nhận kết quả và hoàn thành booking?')) return;
                              setActionLoading(booking.id);
                              try { await bookingsApi.approveDelivery(booking.id); await fetchBookings(page); }
                              catch { alert('Không thể xác nhận.'); }
                              finally { setActionLoading(null); }
                            }}
                            disabled={actionLoading === booking.id}
                            className="btn-pin-primary !rounded-full !py-2 !px-4 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Xác nhận hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button onClick={() => fetchBookings(page - 1)} disabled={page === 0}
                    className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-bold text-ink">Trang {page + 1} / {totalPages}</span>
                  <button onClick={() => fetchBookings(page + 1)} disabled={page >= totalPages - 1}
                    className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal — Pinterest modal-card pattern */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* 50% opacity scrim per DESIGN.md §Elevation */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-canvas rounded-[2rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-display font-bold text-ink text-[22px] tracking-tight pr-12 mb-1">{selectedBooking.campaignTitle}</h2>
            <p className="text-xs text-mute mb-5">#{selectedBooking.id}</p>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6 ${statusPillStyle(selectedBooking.status)}`} style={selectedBooking.status === 'COMPLETED' ? { background: 'var(--success-deep)', color: 'var(--on-dark)' } : undefined}>
              {statusIcon(selectedBooking.status)}
              {statusLabels[selectedBooking.status]}
            </span>

            <dl className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <dt className="text-xs text-mute font-semibold mb-1">Ngân sách</dt>
                <dd className="text-base font-bold text-ink">{vnd.format(selectedBooking.budget)}</dd>
              </div>
              <div>
                <dt className="text-xs text-mute font-semibold mb-1">Ngày tạo</dt>
                <dd className="text-base font-bold text-ink">{new Date(selectedBooking.createdAt).toLocaleDateString('vi-VN')}</dd>
              </div>
              <div>
                <dt className="text-xs text-mute font-semibold mb-1">Bắt đầu</dt>
                <dd className="text-base font-bold text-ink">{new Date(selectedBooking.startDate).toLocaleDateString('vi-VN')}</dd>
              </div>
              <div>
                <dt className="text-xs text-mute font-semibold mb-1">Kết thúc</dt>
                <dd className="text-base font-bold text-ink">{new Date(selectedBooking.endDate).toLocaleDateString('vi-VN')}</dd>
              </div>
            </dl>

            <div className="mb-6">
              <h3 className="text-xs text-mute font-semibold mb-2">Mô tả chiến dịch</h3>
              <p className="text-sm text-body leading-relaxed">{selectedBooking.campaignBrief}</p>
            </div>

            {selectedBooking.deliverables && (
              <div className="mb-6">
                <h3 className="text-xs text-mute font-semibold mb-2">Yêu cầu giao nội dung</h3>
                <p className="text-sm text-body whitespace-pre-wrap bg-surface-card p-4 rounded-md">{selectedBooking.deliverables}</p>
              </div>
            )}

            {selectedBooking.rejectReason && (
              <div className="mb-6 p-4 rounded-md" style={{ background: 'var(--success-pale)', color: 'var(--error)' }}>
                <p className="text-xs font-bold mb-1">Lý do từ chối</p>
                <p className="text-sm">{selectedBooking.rejectReason}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-hairline-soft">
              <Link href={`/bookings/${selectedBooking.id}`} className="btn-pin-primary !rounded-full">Xem đầy đủ</Link>
              <button onClick={() => setSelectedBooking(null)} className="btn-pin-secondary !rounded-full">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
