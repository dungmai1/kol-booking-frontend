'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ReceiptText } from 'lucide-react';
import { Header } from '@/components/header';

/**
 * Landing page the VNPay `Return` callback redirects the browser to after the
 * gateway settles a payment. The IPN (server-to-server) is the authoritative
 * settlement; this page only reflects the outcome the gateway reported.
 *
 *   /payment/result?success=true&bookingId=123&code=00
 */
function PaymentResultBody() {
  const params = useSearchParams();
  const success = params.get('success') === 'true';
  const bookingId = params.get('bookingId');
  const code = params.get('code');

  return (
    <main className="max-w-[560px] mx-auto px-4 py-12 md:py-20">
      <div className="pin-card p-8 md:p-10 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[var(--success-pale)] grid place-items-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-[var(--success-deep)]" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-ink mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-sm text-mute leading-relaxed mb-7">
              Giao dịch của bạn đã được ghi nhận. Số tiền được giữ trong ví cho đến khi bạn
              duyệt nội dung KOL bàn giao.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-pin-red/10 grid place-items-center mx-auto mb-5">
              <XCircle className="w-9 h-9 text-pin-red" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-ink mb-2">
              Thanh toán không thành công
            </h1>
            <p className="text-sm text-mute leading-relaxed mb-2">
              Giao dịch chưa hoàn tất hoặc đã bị huỷ. Bạn có thể thử lại từ trang đơn.
            </p>
            {code && (
              <p className="text-xs text-mute mb-7">
                Mã phản hồi cổng thanh toán: <span className="font-mono font-semibold text-ink">{code}</span>
              </p>
            )}
          </>
        )}

        <div className="flex flex-col gap-3">
          {bookingId ? (
            <Link href={`/bookings/${bookingId}`} className="btn-pin-primary !rounded-full justify-center">
              <ReceiptText className="w-4 h-4" />
              Xem chi tiết đơn #{bookingId}
            </Link>
          ) : (
            <Link href="/bookings" className="btn-pin-primary !rounded-full justify-center">
              Về danh sách đơn
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {!success && bookingId && (
            <Link
              href={`/bookings/${bookingId}/payment`}
              className="text-sm font-bold text-ink hover:text-pin-red"
            >
              Thử thanh toán lại
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <Suspense
        fallback={
          <div className="grid place-items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-ink" />
          </div>
        }
      >
        <PaymentResultBody />
      </Suspense>
    </div>
  );
}
