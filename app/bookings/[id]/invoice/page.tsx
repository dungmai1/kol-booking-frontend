'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Header } from '@/components/header';
import { bookingsApi } from '@/lib/api/bookings';
import type { BookingResponse } from '@/lib/api/types';

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError('Mã đơn không hợp lệ.');
      setLoading(false);
      return;
    }
    bookingsApi
      .getById(id)
      .then((b) => {
        if (b.status !== 'COMPLETED') {
          setError('Hóa đơn chỉ có sẵn cho đơn đã hoàn tất.');
          return;
        }
        setBooking(b);
      })
      .catch(() => setError('Không thể tải hóa đơn.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-pin-red mb-4">{error || 'Không tìm thấy hóa đơn.'}</p>
          <Link href={`/bookings/${id}`} className="btn-pin-primary inline-flex">
            Quay lại đơn đặt
          </Link>
        </main>
      </div>
    );
  }

  const invoiceNo = `KOL-${String(booking.id).padStart(6, '0')}`;
  const brandName = booking.brandCompanyName?.trim() || `Brand #${booking.brandProfileId}`;
  const kolName = booking.kolDisplayName?.trim() || `KOL #${booking.kolProfileId}`;
  const feePercent = booking.platformFeePercent ?? 10;
  const feeAmount = booking.platformFeeAmount ?? Math.round(booking.budget * feePercent / 100);
  const kolNet = booking.kolNetAmount ?? booking.budget - feeAmount;

  return (
    <>
      {/* Screen nav — hidden when printing */}
      <div className="print:hidden">
        <Header />
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <Link
            href={`/bookings/${booking.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đơn đặt
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 btn-pin-primary"
          >
            <Printer className="w-4 h-4" />
            In hóa đơn
          </button>
        </div>
      </div>

      {/* ─── Invoice content ─── */}
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 pb-16 print:px-8 print:pb-0 print:max-w-none">
        <div className="pin-card print:shadow-none print:border-0">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display font-extrabold text-3xl text-ink tracking-tight">HÓA ĐƠN</h1>
              <p className="text-mute text-sm mt-1">KOL Booking Platform</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink">{invoiceNo}</p>
              <p className="text-sm text-mute">Ngày phát hành: {fmtDate(booking.updatedAt)}</p>
              <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                ĐÃ HOÀN TẤT
              </span>
            </div>
          </div>

          {/* Parties */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8 p-5 bg-secondary-bg rounded-xl print:bg-gray-50">
            <div>
              <p className="text-xs font-bold text-mute uppercase tracking-widest mb-2">Bên thuê (Brand)</p>
              <p className="font-bold text-ink text-lg leading-snug">{brandName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold text-mute uppercase tracking-widest mb-2">KOL thực hiện</p>
              <p className="font-bold text-ink text-lg leading-snug">{kolName}</p>
            </div>
          </div>

          {/* Campaign Details */}
          <section className="mb-8">
            <h2 className="text-xs font-bold text-mute uppercase tracking-widest mb-4">Chi tiết chiến dịch</h2>
            <div className="space-y-3">
              <Row label="Tên chiến dịch" value={booking.campaignTitle} />
              <Row label="Thời gian" value={`${fmtDate(booking.startDate)} → ${fmtDate(booking.endDate)}`} />
              {booking.deliverables && (
                <div className="flex gap-4">
                  <span className="text-sm text-mute w-36 flex-shrink-0">Deliverables</span>
                  <span className="text-sm text-ink whitespace-pre-wrap">{booking.deliverables}</span>
                </div>
              )}
              <Row label="Ngày tạo đơn" value={fmtDateTime(booking.createdAt)} />
            </div>
          </section>

          {/* Amount breakdown */}
          <section className="border-t border-hairline-soft pt-6 mb-8">
            <h2 className="text-xs font-bold text-mute uppercase tracking-widest mb-4">Thanh toán</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-body-text">Ngân sách chiến dịch</span>
                <span className="font-bold text-ink">{vnd.format(booking.budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-body-text">Phí nền tảng ({feePercent}%)</span>
                <span className="text-pin-red">- {vnd.format(feeAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-hairline-soft">
                <span className="font-bold text-ink">KOL nhận được</span>
                <span className="font-extrabold text-xl text-ink">{vnd.format(kolNet)}</span>
              </div>
            </div>
          </section>

          {/* Footer note */}
          <div className="bg-secondary-bg rounded-xl p-4 print:bg-gray-50">
            <p className="text-xs text-mute leading-relaxed">
              Hóa đơn này xác nhận rằng chiến dịch KOL đã được hoàn tất và thanh toán thành công
              qua KOL Booking Platform. Mã tham chiếu: <strong>{invoiceNo}</strong>.
              Vui lòng giữ lại tài liệu này cho mục đích kế toán.
            </p>
          </div>

        </div>
      </main>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { margin: 20mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
          .print\\:pb-0 { padding-bottom: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:bg-gray-50 { background-color: #f9fafb !important; }
        }
      `}</style>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-sm text-mute w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-ink font-medium">{value}</span>
    </div>
  );
}
