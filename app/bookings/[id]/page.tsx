'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  Hash,
  Loader2,
  MessageSquare,
  Paperclip,
  PenSquare,
  Receipt,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Upload,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/header';
import { BookingStatusPill } from '@/components/booking-status-pill';
import { BookingTimeline } from '@/components/booking-timeline';
import { ReviewFormDialog } from '@/components/review-form-dialog';
import { bookingsApi } from '@/lib/api/bookings';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import type {
  BookingMessageResponse,
  BookingResponse,
  ReviewDirection,
  ReviewResponse,
} from '@/lib/api/types';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_DESCRIPTION,
  isBranchState,
  kolPayout,
  platformFee,
} from '@/lib/bookings/status';

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function formatDate(iso: string | null | undefined): string {
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

function formatDateTime(iso: string | null | undefined): string {
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

type Tab = 'detail' | 'chat';

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('detail');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Deliverable submission modal (KOL only, when status === 'IN_PROGRESS').
  const [deliverableForm, setDeliverableForm] = useState<{
    open: boolean;
    submittedUrl: string;
    note: string;
    deliverableId: string;
    error: string;
  }>({ open: false, submittedUrl: '', note: '', deliverableId: '0', error: '' });

  // Reviews — populated only when booking is COMPLETED.
  // myReview = review I authored about the other party.
  // otherReview = review the other party authored about me.
  const [myReview, setMyReview] = useState<ReviewResponse | null>(null);
  const [otherReview, setOtherReview] = useState<ReviewResponse | null>(null);

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

  const isBrand = user?.role === 'BRAND';
  const isKol = user?.role === 'KOL';

  // Fetch existing reviews for this booking once it's COMPLETED.
  // Strategy: reviewsApi.getByUser(userId) returns reviews ABOUT that user.
  //   1. Fetch reviews about me → filter by bookingId → otherReview (the other side's review of me)
  //   2. If otherReview exists, we know their userId (otherReview.authorId).
  //      Fetch reviews about them → filter by bookingId + authorId === me → myReview.
  useEffect(() => {
    if (!booking || !user) return;
    if (booking.status !== 'COMPLETED') {
      setMyReview(null);
      setOtherReview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const aboutMe = await reviewsApi.getByUser(user.userId, 0, 100);
        const fromOther = aboutMe.content.find((r) => r.bookingId === booking.id) ?? null;
        if (cancelled) return;
        setOtherReview(fromOther);
        if (fromOther) {
          const aboutOther = await reviewsApi.getByUser(fromOther.authorId, 0, 100);
          if (cancelled) return;
          const mine =
            aboutOther.content.find(
              (r) => r.bookingId === booking.id && r.authorId === user.userId,
            ) ?? null;
          setMyReview(mine);
        } else {
          setMyReview(null);
        }
      } catch {
        // Silent — review section just won't render past data.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [booking, user]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function handleCancel() {
    if (!booking) return;
    const reason = window.prompt('Lý do hủy đơn? (tuỳ chọn)') ?? undefined;
    if (reason === null) return; // user pressed cancel on prompt
    setActionLoading('cancel');
    try {
      await bookingsApi.cancel(booking.id, reason || undefined);
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Hủy đơn thất bại.';
      window.alert(message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove() {
    if (!booking) return;
    if (!window.confirm('Xác nhận đã nhận nội dung và thanh toán cho KOL?')) return;
    setActionLoading('approve');
    try {
      await bookingsApi.approveDelivery(booking.id);
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Phê duyệt thất bại.';
      window.alert(message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDispute() {
    if (!booking) return;
    const reason = window.prompt('Lý do khiếu nại?');
    if (!reason) return;
    setActionLoading('dispute');
    try {
      await bookingsApi.dispute(booking.id, reason);
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi khiếu nại thất bại.';
      window.alert(message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAccept() {
    if (!booking) return;
    setActionLoading('accept');
    try {
      await bookingsApi.accept(booking.id);
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chấp nhận thất bại.';
      window.alert(message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!booking) return;
    const reason = window.prompt('Lý do từ chối? (tuỳ chọn)') ?? undefined;
    if (reason === null) return;
    setActionLoading('reject');
    try {
      await bookingsApi.reject(booking.id, reason || undefined);
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Từ chối thất bại.';
      window.alert(message);
    } finally {
      setActionLoading(null);
    }
  }

  function openDeliverableForm() {
    setDeliverableForm({
      open: true,
      submittedUrl: '',
      note: '',
      deliverableId: '0',
      error: '',
    });
  }

  function closeDeliverableForm() {
    if (actionLoading === 'submit-deliverable') return;
    setDeliverableForm((prev) => ({ ...prev, open: false, error: '' }));
  }

  async function handleSubmitDeliverable() {
    if (!booking) return;
    const url = deliverableForm.submittedUrl.trim();
    const idRaw = deliverableForm.deliverableId.trim();
    if (!url) {
      setDeliverableForm((prev) => ({ ...prev, error: 'Vui lòng nhập đường dẫn nội dung.' }));
      return;
    }
    const deliverableId = Number(idRaw);
    if (!Number.isFinite(deliverableId) || deliverableId < 0) {
      setDeliverableForm((prev) => ({ ...prev, error: 'Mã deliverable không hợp lệ.' }));
      return;
    }
    setActionLoading('submit-deliverable');
    setDeliverableForm((prev) => ({ ...prev, error: '' }));
    try {
      await bookingsApi.submitDeliverable(booking.id, {
        deliverableId,
        submittedUrl: url,
        note: deliverableForm.note.trim() || undefined,
      });
      setDeliverableForm({
        open: false,
        submittedUrl: '',
        note: '',
        deliverableId: '0',
        error: '',
      });
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nộp deliverable thất bại.';
      setDeliverableForm((prev) => ({ ...prev, error: message }));
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Render guards ──────────────────────────────────────────────────────────

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
          <p className="text-mute mb-6">Đăng nhập để xem chi tiết đơn đặt.</p>
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
          <XCircle className="w-12 h-12 text-pin-red mx-auto mb-4" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">
            {error || 'Không tìm thấy đơn'}
          </h1>
          <button
            type="button"
            onClick={() => router.push('/bookings')}
            className="btn-pin-secondary"
          >
            Về danh sách đơn
          </button>
        </main>
      </div>
    );
  }

  const colors = BOOKING_STATUS_COLORS[booking.status];

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main className="max-w-[1024px] mx-auto px-4 py-6 md:py-10">
        {/* Back link */}
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>

        {/* Header card */}
        <header className="pin-card p-5 md:p-7 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-mute mb-1">
                <Hash className="w-3.5 h-3.5" />
                <span>Đơn #{booking.id}</span>
                <span>·</span>
                <span>Tạo lúc {formatDateTime(booking.createdAt)}</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink leading-tight">
                {booking.campaignTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <BookingStatusPill status={booking.status} size="lg" />
              <button
                type="button"
                onClick={fetchBooking}
                className="grid place-items-center w-9 h-9 rounded-full bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
                aria-label="Tải lại"
                title="Tải lại"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-mute">
            {BOOKING_STATUS_DESCRIPTION[booking.status]}
          </p>

          {/* Timeline */}
          <div className="mt-6">
            <BookingTimeline status={booking.status} />
          </div>

          {/* Branch reason banners */}
          {booking.rejectReason && (
            <div
              className="mt-5 rounded-2xl px-4 py-3 text-sm"
              style={{
                background: BOOKING_STATUS_COLORS.REJECTED.soft,
                border: `1px solid ${BOOKING_STATUS_COLORS.REJECTED.border}`,
              }}
            >
              <p className="font-bold text-ink mb-1">Lý do từ chối</p>
              <p className="text-body">{booking.rejectReason}</p>
            </div>
          )}
          {booking.cancelReason && (
            <div
              className="mt-3 rounded-2xl px-4 py-3 text-sm"
              style={{
                background: BOOKING_STATUS_COLORS.CANCELLED.soft,
                border: `1px solid ${BOOKING_STATUS_COLORS.CANCELLED.border}`,
              }}
            >
              <p className="font-bold text-ink mb-1">Lý do hủy</p>
              <p className="text-body">{booking.cancelReason}</p>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5 border-b border-hairline">
          <button
            type="button"
            onClick={() => setTab('detail')}
            className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
              tab === 'detail' ? 'text-ink' : 'text-mute hover:text-ink'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Chi tiết
            {tab === 'detail' && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-ink rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('chat')}
            className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
              tab === 'chat' ? 'text-ink' : 'text-mute hover:text-ink'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Tin nhắn
            {tab === 'chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-ink rounded-t-full" />
            )}
          </button>
        </div>

        {tab === 'detail' ? (
          <DetailTab
            booking={booking}
            isBrand={isBrand}
            isKol={isKol}
            actionLoading={actionLoading}
            onCancel={handleCancel}
            onApprove={handleApprove}
            onDispute={handleDispute}
            onAccept={handleAccept}
            onReject={handleReject}
            onSubmitDeliverable={openDeliverableForm}
            myReview={myReview}
            otherReview={otherReview}
            onReviewSuccess={setMyReview}
          />
        ) : (
          <ChatTab bookingId={booking.id} currentUserId={user?.userId ?? -1} />
        )}
      </main>

      {/* Deliverable submission modal — KOL flow when booking is IN_PROGRESS */}
      {deliverableForm.open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm px-4"
          onClick={closeDeliverableForm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-deliverable-title"
        >
          <div
            className="pin-card w-full max-w-[520px] p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2
                  id="submit-deliverable-title"
                  className="font-display font-extrabold text-xl text-ink"
                >
                  Nộp deliverable
                </h2>
                <p className="text-sm text-mute mt-1">
                  Gửi nội dung đã hoàn thiện để brand kiểm duyệt và thanh toán.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeliverableForm}
                disabled={actionLoading === 'submit-deliverable'}
                className="grid place-items-center w-8 h-8 rounded-full text-mute hover:text-ink hover:bg-surface-card transition-colors disabled:opacity-40"
                aria-label="Đóng"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmitDeliverable();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs uppercase tracking-wide text-mute font-bold mb-1.5 block">
                  Đường dẫn nội dung <span className="text-pin-red">*</span>
                </label>
                <input
                  type="url"
                  required
                  autoFocus
                  placeholder="https://..."
                  value={deliverableForm.submittedUrl}
                  onChange={(e) =>
                    setDeliverableForm((prev) => ({
                      ...prev,
                      submittedUrl: e.target.value,
                      error: '',
                    }))
                  }
                  disabled={actionLoading === 'submit-deliverable'}
                  className="pin-input w-full disabled:opacity-50"
                />
                <p className="text-xs text-mute mt-1">
                  Link bài đăng, video, story hoặc tài liệu Drive/Dropbox.
                </p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-mute font-bold mb-1.5 block">
                  Mã deliverable
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={deliverableForm.deliverableId}
                  onChange={(e) =>
                    setDeliverableForm((prev) => ({
                      ...prev,
                      deliverableId: e.target.value,
                      error: '',
                    }))
                  }
                  disabled={actionLoading === 'submit-deliverable'}
                  className="pin-input w-full disabled:opacity-50"
                />
                <p className="text-xs text-mute mt-1">
                  Để 0 nếu đơn chỉ có một deliverable.
                </p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-mute font-bold mb-1.5 block">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả ngắn về nội dung đã nộp, hoặc lưu ý cho brand..."
                  value={deliverableForm.note}
                  onChange={(e) =>
                    setDeliverableForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                      error: '',
                    }))
                  }
                  disabled={actionLoading === 'submit-deliverable'}
                  className="pin-input w-full resize-none disabled:opacity-50"
                />
              </div>

              {deliverableForm.error && (
                <p className="text-sm text-pin-red bg-pin-red/10 border border-pin-red/30 rounded-xl px-3 py-2">
                  {deliverableForm.error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDeliverableForm}
                  disabled={actionLoading === 'submit-deliverable'}
                  className="btn-pin-secondary disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading === 'submit-deliverable' ||
                    !deliverableForm.submittedUrl.trim()
                  }
                  className="btn-pin-primary disabled:opacity-50"
                >
                  {actionLoading === 'submit-deliverable' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Gửi nội dung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail tab ──────────────────────────────────────────────────────────────

interface DetailTabProps {
  booking: BookingResponse;
  isBrand: boolean;
  isKol: boolean;
  actionLoading: string | null;
  onCancel: () => void;
  onApprove: () => void;
  onDispute: () => void;
  onAccept: () => void;
  onReject: () => void;
  onSubmitDeliverable: () => void;
  myReview: ReviewResponse | null;
  otherReview: ReviewResponse | null;
  onReviewSuccess: (review: ReviewResponse) => void;
}

function DetailTab({
  booking,
  isBrand,
  isKol,
  actionLoading,
  onCancel,
  onApprove,
  onDispute,
  onAccept,
  onReject,
  onSubmitDeliverable,
  myReview,
  otherReview,
  onReviewSuccess,
}: DetailTabProps) {
  const payout = kolPayout(booking.budget);
  const fee = platformFee(booking.budget);

  // ─── BRAND action panel ────────────────────────────────────────────────────
  const brandActions: React.ReactNode[] = [];
  if (isBrand) {
    if (booking.status === 'PENDING') {
      brandActions.push(
        <button
          key="cancel"
          type="button"
          onClick={onCancel}
          disabled={actionLoading !== null}
          className="btn-pin-secondary disabled:opacity-50"
        >
          {actionLoading === 'cancel' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Hủy đơn
        </button>,
      );
    }
    if (booking.status === 'ACCEPTED') {
      brandActions.push(
        <Link
          key="pay"
          href={`/bookings/${booking.id}/payment`}
          className="btn-pin-primary"
        >
          <CreditCard className="w-4 h-4" />
          Thanh toán {vnd.format(booking.budget)}
        </Link>,
      );
    }
    if (booking.status === 'DELIVERED') {
      brandActions.push(
        <button
          key="approve"
          type="button"
          onClick={onApprove}
          disabled={actionLoading !== null}
          className="btn-pin-primary disabled:opacity-50"
        >
          {actionLoading === 'approve' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Duyệt & thanh toán KOL
        </button>,
        <button
          key="dispute"
          type="button"
          onClick={onDispute}
          disabled={actionLoading !== null}
          className="btn-pin-secondary disabled:opacity-50"
        >
          {actionLoading === 'dispute' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          Khiếu nại
        </button>,
      );
    }
    if (booking.status === 'IN_PROGRESS') {
      brandActions.push(
        <button
          key="dispute"
          type="button"
          onClick={onDispute}
          disabled={actionLoading !== null}
          className="btn-pin-secondary disabled:opacity-50"
        >
          {actionLoading === 'dispute' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          Báo cáo vấn đề
        </button>,
      );
    }
    if (booking.invoiceUrl && booking.status === 'COMPLETED') {
      brandActions.push(
        <a
          key="invoice"
          href={booking.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-pin-secondary"
        >
          <Receipt className="w-4 h-4" />
          Tải hóa đơn
        </a>,
      );
    }
  }

  // ─── KOL action panel (light support: this page primarily serves BRAND) ────
  const kolActions: React.ReactNode[] = [];
  if (isKol) {
    if (booking.status === 'PENDING') {
      kolActions.push(
        <button
          key="accept"
          type="button"
          onClick={onAccept}
          disabled={actionLoading !== null}
          className="btn-pin-primary disabled:opacity-50"
        >
          {actionLoading === 'accept' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Chấp nhận
        </button>,
        <button
          key="reject"
          type="button"
          onClick={onReject}
          disabled={actionLoading !== null}
          className="btn-pin-secondary disabled:opacity-50"
        >
          {actionLoading === 'reject' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Từ chối
        </button>,
      );
    }
    if (booking.status === 'IN_PROGRESS') {
      kolActions.push(
        <button
          key="submit-deliverable"
          type="button"
          onClick={onSubmitDeliverable}
          disabled={actionLoading !== null}
          className="btn-pin-primary disabled:opacity-50"
        >
          {actionLoading === 'submit-deliverable' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Nộp deliverable
        </button>,
      );
    }
  }

  const actions = isBrand ? brandActions : kolActions;
  const branched = isBranchState(booking.status);

  // ─── Review section (only visible when booking is COMPLETED) ───────────────
  const showReviewSection =
    booking.status === 'COMPLETED' && (isBrand || isKol);
  const reviewDirection: ReviewDirection = isBrand ? 'TO_KOL' : 'TO_BRAND';
  const targetName = isBrand
    ? `KOL #${booking.kolProfileId}`
    : `Brand #${booking.brandProfileId}`;
  const otherSideLabel = isBrand ? 'KOL' : 'Brand';

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      {/* Left: campaign details */}
      <div className="space-y-6">
        <section className="pin-card p-5 md:p-6">
          <h2 className="font-display font-bold text-lg text-ink mb-4">
            Thông tin chiến dịch
          </h2>
          <div className="space-y-4">
            <DetailRow label="Mô tả chiến dịch">
              <p className="whitespace-pre-wrap text-body leading-relaxed">
                {booking.campaignBrief || '—'}
              </p>
            </DetailRow>
            <DetailRow label="Yêu cầu giao nội dung">
              <p className="whitespace-pre-wrap text-body leading-relaxed">
                {booking.deliverables || '—'}
              </p>
            </DetailRow>
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailRow label="Bắt đầu" icon={<Calendar className="w-4 h-4" />}>
                <p className="text-ink font-bold">{formatDate(booking.startDate)}</p>
              </DetailRow>
              <DetailRow label="Kết thúc" icon={<Calendar className="w-4 h-4" />}>
                <p className="text-ink font-bold">{formatDate(booking.endDate)}</p>
              </DetailRow>
            </div>
          </div>
        </section>

        {/* Reviews — only when booking is COMPLETED */}
        {showReviewSection && (
          <section className="pin-card p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-ink fill-ink" />
              <h2 className="font-display font-bold text-lg text-ink">Đánh giá</h2>
            </div>

            {/* My review (or CTA to write one) */}
            <div className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-2">
                Đánh giá của bạn
              </h3>
              {myReview ? (
                <div className="rounded-2xl border border-hairline bg-canvas p-4">
                  <ReviewStars rating={myReview.rating} />
                  <p className="text-body whitespace-pre-wrap leading-relaxed mt-2">
                    {myReview.comment}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-mute">
                      {formatDateTime(myReview.updatedAt || myReview.createdAt)}
                    </p>
                    <ReviewFormDialog
                      bookingId={booking.id}
                      direction={reviewDirection}
                      targetName={targetName}
                      existingReview={myReview}
                      onSuccess={onReviewSuccess}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
                      >
                        <PenSquare className="w-3.5 h-3.5" />
                        Sửa đánh giá
                      </button>
                    </ReviewFormDialog>
                  </div>
                </div>
              ) : (
                <ReviewFormDialog
                  bookingId={booking.id}
                  direction={reviewDirection}
                  targetName={targetName}
                  onSuccess={onReviewSuccess}
                >
                  <button
                    type="button"
                    className="btn-pin-primary !rounded-full w-full justify-center"
                  >
                    <Star className="w-4 h-4" />
                    Viết đánh giá cho {targetName}
                  </button>
                </ReviewFormDialog>
              )}
            </div>

            {/* Other side's review (read-only) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-2">
                Đánh giá từ {otherSideLabel}
              </h3>
              {otherReview ? (
                <div className="rounded-2xl border border-hairline bg-canvas p-4">
                  <ReviewStars rating={otherReview.rating} />
                  <p className="text-body whitespace-pre-wrap leading-relaxed mt-2">
                    {otherReview.comment}
                  </p>
                  <p className="text-xs text-mute mt-3">
                    {formatDateTime(otherReview.updatedAt || otherReview.createdAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-mute italic">
                  {otherSideLabel} chưa để lại đánh giá.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Action panel (mobile shows above sidebar) */}
        {actions.length > 0 && (
          <section className="pin-card p-5 md:p-6 lg:hidden">
            <h2 className="font-display font-bold text-lg text-ink mb-3">Hành động</h2>
            <div className="flex flex-wrap gap-2">{actions}</div>
          </section>
        )}
      </div>

      {/* Right: budget + actions */}
      <aside className="space-y-6">
        <section className="pin-card p-5 md:p-6">
          <h2 className="font-display font-bold text-lg text-ink mb-4">
            Chi phí
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-mute">Tổng ngân sách</span>
              <span className="font-bold text-ink">{vnd.format(booking.budget)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-mute">KOL nhận (90%)</span>
              <span className="font-bold text-ink">{vnd.format(payout)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-mute">Phí nền tảng (10%)</span>
              <span className="text-body">{vnd.format(fee)}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-hairline-soft">
              <p className="text-xs text-mute leading-relaxed">
                {booking.status === 'COMPLETED'
                  ? 'KOL đã được thanh toán phần của mình.'
                  : branched
                    ? 'Đơn đã kết thúc, không phát sinh giao dịch.'
                    : 'Số tiền được giữ trong ví tới khi bạn duyệt nội dung.'}
              </p>
            </div>
          </div>
        </section>

        {/* Action panel — desktop sidebar */}
        {actions.length > 0 && (
          <section className="pin-card p-5 md:p-6 hidden lg:block">
            <h2 className="font-display font-bold text-lg text-ink mb-3">Hành động</h2>
            <div className="flex flex-col gap-2">{actions}</div>
          </section>
        )}
      </aside>
    </div>
  );
}

function DetailRow({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-mute font-bold mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-ink text-ink' : 'text-stone'}`}
        />
      ))}
      <span className="ml-2 text-sm font-bold text-ink tabular-nums">
        {rating}/5
      </span>
    </div>
  );
}

// ─── Chat tab ────────────────────────────────────────────────────────────────

interface ChatTabProps {
  bookingId: number;
  currentUserId: number;
}

function ChatTab({ bookingId, currentUserId }: ChatTabProps) {
  const [messages, setMessages] = useState<BookingMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  const loadMessages = useCallback(
    async (targetPage: number, append: boolean) => {
      setLoading(true);
      setError('');
      try {
        const res = await bookingsApi.getMessages(bookingId, targetPage, 50);
        // API returns newest first typically; render oldest at top by reversing.
        const ordered = [...res.content].reverse();
        if (append) {
          setMessages((prev) => [...ordered, ...prev]);
        } else {
          setMessages(ordered);
          setTimeout(scrollToBottom, 0);
        }
        setHasMore(res.hasNext);
        setPage(targetPage);
      } catch {
        setError('Không thể tải tin nhắn.');
      } finally {
        setLoading(false);
      }
    },
    [bookingId, scrollToBottom],
  );

  useEffect(() => {
    loadMessages(0, false);
  }, [loadMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const sent = await bookingsApi.sendMessage(bookingId, {
        content: trimmed,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      setMessages((prev) => [...prev, sent]);
      setContent('');
      setAttachmentUrl('');
      setTimeout(scrollToBottom, 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gửi tin nhắn thất bại.';
      window.alert(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="pin-card p-0 overflow-hidden flex flex-col h-[min(70vh,640px)]">
      {/* Load more button (older messages) */}
      <div className="px-4 py-3 border-b border-hairline-soft flex items-center justify-between gap-2">
        <p className="text-sm text-mute">
          {messages.length} tin nhắn
          {hasMore ? ' (còn cũ hơn)' : ''}
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={() => loadMessages(page + 1, true)}
            disabled={loading}
            className="text-xs font-bold text-ink hover:underline disabled:opacity-50"
          >
            Xem tin cũ hơn
          </button>
        )}
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ink" />
          </div>
        ) : error ? (
          <p className="text-center text-pin-red text-sm py-12">{error}</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-mute text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderUserId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? 'bg-ink text-on-dark rounded-br-sm'
                      : 'bg-surface-card text-ink rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-1 inline-flex items-center gap-1 text-xs font-bold underline ${
                        mine ? 'text-on-dark' : 'text-ink'
                      }`}
                    >
                      <Paperclip className="w-3 h-3" />
                      Tệp đính kèm
                    </a>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? 'text-on-dark/70' : 'text-mute'
                    }`}
                  >
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="border-t border-hairline-soft p-3 flex items-end gap-2"
      >
        <div className="flex-1 flex flex-col gap-2">
          {attachmentUrl && (
            <div className="flex items-center justify-between gap-2 text-xs bg-surface-card rounded-lg px-3 py-1.5">
              <span className="truncate text-mute flex items-center gap-1.5">
                <Paperclip className="w-3 h-3" />
                {attachmentUrl}
              </span>
              <button
                type="button"
                onClick={() => setAttachmentUrl('')}
                className="text-mute hover:text-ink"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập tin nhắn..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            className="pin-input min-h-[44px] max-h-32 resize-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Đường dẫn tệp đính kèm:');
            if (url) setAttachmentUrl(url.trim());
          }}
          className="grid place-items-center w-11 h-11 rounded-full bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
          aria-label="Đính kèm tệp"
          title="Đính kèm tệp"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="grid place-items-center w-11 h-11 rounded-full bg-ink text-on-dark hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          aria-label="Gửi"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </section>
  );
}
