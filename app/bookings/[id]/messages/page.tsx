'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { Header } from '@/components/header';
import { BookingStatusPill } from '@/components/booking-status-pill';
import { BookingChatTab } from '@/components/booking-chat-tab';
import { bookingsApi } from '@/lib/api/bookings';
import { bookingBrandLabel, bookingKolLabel } from '@/lib/bookings/display';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingResponse } from '@/lib/api/types';

export default function BookingMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingsApi.getById(id);
      setBooking(res);
    } catch {
      setError('Không thể tải đơn đặt. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('Mã đơn không hợp lệ.');
      setLoading(false);
      return;
    }
    if (!authLoading) {
      fetchBooking();
    }
  }, [id, authLoading, fetchBooking]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-[640px] mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">
            Vui lòng đăng nhập
          </h1>
          <p className="text-mute mb-6">Đăng nhập để xem tin nhắn đơn đặt.</p>
          <Link href="/auth/login" className="btn-pin-primary">
            Đăng nhập
          </Link>
        </main>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-[640px] mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">
            Không tìm thấy đơn
          </h1>
          <p className="text-mute mb-6">{error || 'Đơn đặt không tồn tại hoặc bạn không có quyền truy cập.'}</p>
          <Link href="/bookings" className="btn-pin-primary">
            Quay lại danh sách
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-mute hover:text-ink mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chi tiết đơn
        </Link>

        <header className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-5 h-5 text-ink" />
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-ink tracking-tight">
                  Tin nhắn
                </h1>
              </div>
              <p className="text-sm text-mute">
                Đơn #{booking.id} · {booking.campaignTitle}
              </p>
              <p className="text-sm text-body-text mt-1">
                {bookingBrandLabel(booking)} ↔ {bookingKolLabel(booking)}
              </p>
            </div>
            <BookingStatusPill status={booking.status} />
          </div>
        </header>

        <BookingChatTab bookingId={booking.id} currentUserId={user?.userId ?? -1} />
      </main>
    </div>
  );
}
