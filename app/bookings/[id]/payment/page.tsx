'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/header';
import { BookingStatusPill } from '@/components/booking-status-pill';
import { bookingsApi } from '@/lib/api/bookings';
import { paymentsApi } from '@/lib/api/payments';
import { useAuth } from '@/contexts/AuthContext';
import type { BookingResponse, CheckoutResponse } from '@/lib/api/types';
import { bookingCommission } from '@/lib/bookings/status';

const PROVIDER = 'VNPAY' as const;

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

type Phase =
  | 'idle'
  | 'creating'
  | 'redirecting'
  | 'success'
  | 'error';

export default function BookingPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [bookingError, setBookingError] = useState('');

  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseMessage, setPhaseMessage] = useState('');
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Prevent re-triggering checkout in React StrictMode (dev double-mount).
  const startedRef = useRef(false);

  // ─── Fetch booking once ────────────────────────────────────────────────────
  useEffect(() => {
    if (Number.isNaN(id)) {
      setBookingError('Mã đơn không hợp lệ.');
      setLoadingBooking(false);
      return;
    }
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setLoadingBooking(true);
      setBookingError('');
      try {
        const res = await bookingsApi.getById(id);
        if (!cancelled) setBooking(res);
      } catch {
        if (!cancelled) setBookingError('Không thể tải thông tin đơn.');
      } finally {
        if (!cancelled) setLoadingBooking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, authLoading]);

  // ─── Checkout flow ─────────────────────────────────────────────────────────
  const runCheckout = useCallback(async () => {
    if (!booking || startedRef.current) return;
    startedRef.current = true;
    setPhase('creating');
    setPhaseMessage('Đang tạo phiên thanh toán...');
    setErrorMessage('');
    try {
      const res = await paymentsApi.checkout(booking.id, { provider: PROVIDER });
      setCheckout(res);

      setPhase('redirecting');
      setPhaseMessage('Đang chuyển sang cổng thanh toán VNPay...');
      setTimeout(() => {
        window.location.href = res.paymentUrl;
      }, 600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể khởi tạo thanh toán.';
      setPhase('error');
      setErrorMessage(message);
      startedRef.current = false; // allow retry
    }
  }, [booking]);

  // ─── Render guards ─────────────────────────────────────────────────────────

  if (authLoading || loadingBooking) {
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
          <Link href="/auth/login" className="btn-pin-primary">
            Đăng nhập
          </Link>
        </main>
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-[640px] mx-auto px-4 py-16 text-center">
          <XCircle className="w-12 h-12 text-pin-red mx-auto mb-4" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">
            {bookingError || 'Không tìm thấy đơn'}
          </h1>
          <Link href="/bookings" className="btn-pin-secondary">
            Về danh sách đơn
          </Link>
        </main>
      </div>
    );
  }

  const isAccepted = booking.status === 'ACCEPTED';
  const { feePercent, feeAmount: fee, netAmount: payout } = bookingCommission(booking);
  const kolPercent = Math.max(0, 100 - feePercent);

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main className="max-w-[680px] mx-auto px-4 py-8 md:py-12">
        <Link
          href={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đơn #{booking.id}
        </Link>

        {/* Header */}
        <header className="pin-card p-5 md:p-7 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <p className="text-xs text-mute mb-1">Thanh toán cho đơn #{booking.id}</p>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink leading-tight">
                {booking.campaignTitle}
              </h1>
            </div>
            <BookingStatusPill status={booking.status} size="md" />
          </div>
          <p className="text-sm text-mute">
            Số tiền sẽ được giữ trong ví cho đến khi bạn duyệt nội dung KOL gửi.
          </p>
        </header>

        {/* If not in ACCEPTED, block payment */}
        {!isAccepted ? (
          <section className="pin-card p-5 md:p-6 text-center">
            <XCircle className="w-10 h-10 text-pin-red mx-auto mb-3" />
            <h2 className="font-display font-bold text-xl text-ink mb-2">
              Đơn này không thể thanh toán
            </h2>
            <p className="text-mute text-sm mb-5">
              Chỉ những đơn có trạng thái <strong className="text-ink">Đã chấp nhận</strong> mới được thanh toán.
              Trạng thái hiện tại: <strong className="text-ink">{booking.status}</strong>.
            </p>
            <Link href={`/bookings/${booking.id}`} className="btn-pin-primary">
              Về trang đơn
            </Link>
          </section>
        ) : (
          <>
            {/* Cost breakdown */}
            <section className="pin-card p-5 md:p-6 mb-6">
              <h2 className="font-display font-bold text-lg text-ink mb-4">
                Chi tiết thanh toán
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Ngân sách</dt>
                  <dd className="font-bold text-ink">{vnd.format(booking.budget)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">KOL nhận ({kolPercent}%)</dt>
                  <dd className="text-body">{vnd.format(payout)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-mute">Phí nền tảng ({feePercent}%)</dt>
                  <dd className="text-body">{vnd.format(fee)}</dd>
                </div>
                <div className="pt-3 border-t border-hairline-soft flex items-center justify-between">
                  <dt className="font-bold text-ink">Bạn cần thanh toán</dt>
                  <dd className="font-display font-extrabold text-xl text-ink">
                    {vnd.format(booking.budget)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* VNPay checkout (only before flow starts or on error) */}
            {(phase === 'idle' || phase === 'error') && (
              <section className="pin-card p-5 md:p-6 mb-6">
                <h2 className="font-display font-bold text-lg text-ink mb-4">
                  Phương thức thanh toán
                </h2>

                <div className="flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-ink bg-secondary-bg">
                  <div
                    className="w-14 h-10 rounded-lg grid place-items-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0066B3 0%, #004C8C 100%)' }}
                    aria-hidden
                  >
                    <span className="text-white font-extrabold text-sm tracking-tight">VNPay</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink">Thanh toán qua VNPay</p>
                    <p className="text-xs text-mute mt-0.5">
                      Thẻ nội địa, thẻ quốc tế, ví điện tử và QR Pay
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[var(--success-deep)] shrink-0" aria-hidden />
                </div>

                {phase === 'error' && errorMessage && (
                  <div className="mt-4 rounded-xl border border-pin-red/30 bg-pin-red/5 px-4 py-3">
                    <p className="text-sm text-pin-red font-medium">{errorMessage}</p>
                    {errorMessage.includes('chưa được cấu hình') && (
                      <p className="text-xs text-mute mt-1.5">
                        Liên hệ quản trị viên để cấu hình cổng VNPay trên máy chủ backend.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={runCheckout}
                  className="btn-pin-primary w-full mt-5"
                >
                  <CreditCard className="w-4 h-4" />
                  {phase === 'error' ? 'Thử lại' : `Thanh toán ${vnd.format(booking.budget)} qua VNPay`}
                </button>

                <p className="mt-3 text-xs text-mute flex items-center gap-1.5 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Bạn sẽ được chuyển sang trang VNPay để hoàn tất giao dịch an toàn.
                </p>
              </section>
            )}

            {/* Active phase panel */}
            {(phase === 'creating' || phase === 'redirecting') && (
              <section className="pin-card p-6 md:p-8 mb-6 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-ink mx-auto mb-4" />
                <p className="font-bold text-ink text-lg mb-1">{phaseMessage}</p>
                <p className="text-sm text-mute">Vui lòng không đóng cửa sổ.</p>

                {checkout && phase === 'redirecting' && (
                  <a
                    href={checkout.paymentUrl}
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-ink hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở cổng thanh toán
                  </a>
                )}
              </section>
            )}

            {/* Success */}
            {phase === 'success' && (
              <section className="pin-card p-6 md:p-8 mb-6 text-center">
                <div className="w-14 h-14 rounded-full bg-[var(--success-pale)] grid place-items-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-[var(--success-deep)]" />
                </div>
                <p className="font-display font-extrabold text-xl text-ink mb-1">
                  Thanh toán thành công!
                </p>
                <p className="text-sm text-mute mb-5">{phaseMessage}</p>
                <Link href={`/bookings/${booking.id}`} className="btn-pin-primary">
                  Xem chi tiết đơn
                </Link>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
