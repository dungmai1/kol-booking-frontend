'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Briefcase,
  Inbox,
  ExternalLink,
  Gavel,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { BookingStatusPill } from '@/components/booking-status-pill';
import { PaginationBar } from '@/components/pagination-bar';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { CurrencyInput } from '@/components/currency-input';
import { parsePriceDigits, priceToDigits, validatePriceDigits } from '@/lib/currency-input';
import { bookingBrandLabel, bookingKolLabel } from '@/lib/bookings/display';
import { BOOKING_STATUS_LABEL, bookingCommission } from '@/lib/bookings/status';
import type { BookingResponse, BookingStatus } from '@/lib/api/types';

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

function fmtDateTime(iso: string | null): string {
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

function fmtDate(iso: string | null): string {
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

type StatusFilter = 'ALL' | BookingStatus;

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DISPUTED', label: 'Tranh chấp' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'ACCEPTED', label: 'Đã chấp nhận' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'CANCELLED_BY_ADMIN', label: 'Admin hủy' },
  { value: 'DELIVERY_REJECTED', label: 'Từ chối nội dung' },
];

type DisputeResolution = 'REFUND_TO_BRAND' | 'PAY_KOL' | 'PARTIAL_REFUND';

const RESOLUTION_OPTIONS: Array<{ value: DisputeResolution; label: string; hint: string }> = [
  {
    value: 'REFUND_TO_BRAND',
    label: 'Hoàn tiền cho Brand',
    hint: 'Toàn bộ ngân sách được hoàn lại cho Brand.',
  },
  {
    value: 'PAY_KOL',
    label: 'Thanh toán cho KOL',
    hint: 'Giải phóng tiền cho KOL theo số net sau hoa hồng.',
  },
  {
    value: 'PARTIAL_REFUND',
    label: 'Hoàn tiền một phần',
    hint: 'Hoàn một phần ngân sách cho Brand; phần còn lại theo quyết định backend.',
  },
];

const PAGE_SIZE = 15;

function defaultAmountForResolution(booking: BookingResponse, resolution: DisputeResolution): number {
  const { netAmount } = bookingCommission(booking);
  if (resolution === 'REFUND_TO_BRAND') return booking.budget;
  if (resolution === 'PAY_KOL') return netAmount;
  return Math.round(booking.budget / 2);
}

export default function AdminBookingsPage() {
  const [tab, setTab] = useState<StatusFilter>('ALL');
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resolveFor, setResolveFor] = useState<BookingResponse | null>(null);
  const [resolution, setResolution] = useState<DisputeResolution>('REFUND_TO_BRAND');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getBookings({
        status: tab === 'ALL' ? undefined : tab,
        page,
        size: PAGE_SIZE,
      });
      setItems(res.content);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách booking.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  function openResolve(booking: BookingResponse) {
    setResolveFor(booking);
    setResolution('REFUND_TO_BRAND');
    setAmount(priceToDigits(defaultAmountForResolution(booking, 'REFUND_TO_BRAND')));
    setNote('');
  }

  function handleResolutionChange(next: DisputeResolution) {
    setResolution(next);
    if (resolveFor) {
      setAmount(priceToDigits(defaultAmountForResolution(resolveFor, next)));
    }
  }

  async function submitResolve() {
    if (!resolveFor) return;
    const amountErr = validatePriceDigits(amount, { required: true, fieldLabel: 'Số tiền' });
    if (amountErr) {
      setError(amountErr);
      return;
    }
    const parsed = parsePriceDigits(amount);
    if (parsed == null || parsed <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    setResolving(true);
    setError(null);
    try {
      await adminApi.resolveDispute(resolveFor.id, {
        resolution,
        amount: parsed,
        note: note.trim() || undefined,
      });
      setResolveFor(null);
      await fetchList();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Giải quyết tranh chấp thất bại.');
    } finally {
      setResolving(false);
    }
  }

  const tabLabel = tab === 'ALL' ? 'tất cả' : BOOKING_STATUS_LABEL[tab];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin" className="text-mute hover:text-pin-red">Quản trị</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-ink font-semibold">Booking</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h2 className="font-display font-bold text-ink text-[26px] tracking-tight leading-tight">
          Quản lý booking
        </h2>
        <p className="text-sm text-mute mt-1">
          Theo dõi đơn đặt KOL, xử lý tranh chấp và kiểm tra trạng thái chiến dịch.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t.value ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && !resolveFor && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-card border border-hairline animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-surface-card rounded-2xl border border-hairline">
          <Inbox className="w-12 h-12 text-mute mx-auto mb-3" />
          <p className="font-bold text-ink mb-1">Không có booking</p>
          <p className="text-mute text-sm">Không có đơn ở trạng thái “{tabLabel}”.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((b) => {
              const { feePercent, feeAmount, netAmount } = bookingCommission(b);
              return (
                <li
                  key={b.id}
                  className="bg-surface-card rounded-2xl border border-hairline p-4 flex flex-col lg:flex-row lg:items-start gap-4"
                >
                  <div className="grid place-items-center w-11 h-11 rounded-full bg-surface-soft text-ink flex-shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold text-ink text-lg leading-tight">
                        {b.campaignTitle}
                      </span>
                      <BookingStatusPill status={b.status} size="sm" />
                    </div>

                    <p className="text-sm text-ink">
                      <span className="font-semibold">{bookingBrandLabel(b)}</span>
                      <span className="text-mute mx-1.5">→</span>
                      <span className="font-semibold">{bookingKolLabel(b)}</span>
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute mt-2">
                      <span>Ngân sách: <span className="font-semibold text-ink">{vnd(b.budget)}</span></span>
                      <span>
                        Hoa hồng {feePercent}%: <span className="font-semibold text-ink">{vnd(feeAmount)}</span>
                      </span>
                      <span>
                        KOL nhận: <span className="font-semibold text-ink">{vnd(netAmount)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-mute mt-1.5">
                      #{b.id} • {fmtDate(b.startDate)} – {fmtDate(b.endDate)} • Tạo {fmtDateTime(b.createdAt)}
                    </p>

                    {b.cancelReason && (
                      <p className="text-xs text-pin-red mt-1">Lý do hủy: {b.cancelReason}</p>
                    )}
                    {b.rejectReason && (
                      <p className="text-xs text-pin-red mt-1">Lý do từ chối: {b.rejectReason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-ink bg-surface-soft hover:bg-secondary-bg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Chi tiết
                    </Link>
                    {b.status === 'DISPUTED' && (
                      <button
                        type="button"
                        onClick={() => openResolve(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-on-dark bg-ink hover:bg-charcoal transition-colors"
                      >
                        <Gavel className="w-4 h-4" />
                        Giải quyết
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {resolveFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !resolving && setResolveFor(null)}
        >
          <div
            className="bg-canvas rounded-2xl shadow-xl w-full max-w-[480px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-xl text-ink mb-1">Giải quyết tranh chấp</h3>
            <p className="text-sm text-mute mb-4">
              Booking #{resolveFor.id} — {resolveFor.campaignTitle}
            </p>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Quyết định</label>
                <div className="space-y-2">
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        resolution === opt.value
                          ? 'border-ink bg-surface-soft'
                          : 'border-hairline hover:border-ink/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={opt.value}
                        checked={resolution === opt.value}
                        onChange={() => handleResolutionChange(opt.value)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-sm font-bold text-ink">{opt.label}</span>
                        <span className="block text-xs text-mute mt-0.5">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="resolve-amount" className="block text-sm font-bold text-ink mb-2">
                  Số tiền (VND)
                </label>
                <CurrencyInput
                  id="resolve-amount"
                  value={amount}
                  onValueChange={setAmount}
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm"
                />
                <p className="text-xs text-mute mt-1">
                  Ngân sách: {vnd(resolveFor.budget)} • KOL net: {vnd(bookingCommission(resolveFor).netAmount)}
                </p>
              </div>

              <div>
                <label htmlFor="resolve-note" className="block text-sm font-bold text-ink mb-2">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  id="resolve-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Lý do quyết định…"
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolveFor(null)}
                disabled={resolving}
                className="btn-pin-secondary !rounded-full disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submitResolve}
                disabled={resolving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pin-red text-on-dark text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
