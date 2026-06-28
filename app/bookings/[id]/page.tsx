'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Hash,
  Loader2,
  MessageSquare,
  PenSquare,
  Receipt,
  RefreshCw,
  Sparkles,
  Star,
  Upload,
  XCircle,
} from 'lucide-react';
import { filesApi } from '@/lib/api/files';
import { isValidContentUrl, resolveMediaUrl } from '@/lib/api/client';
import {
  ACCEPTED_IMAGE_ACCEPT,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_ACCEPT,
  validateUploadFile,
} from '@/lib/uploads/validate';
import { DeliverableMediaPreview } from '@/components/deliverable-media-preview';
import { isPreviewableDeliverableUrl } from '@/lib/portfolio/media';
import { Header } from '@/components/header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BookingStatusPill } from '@/components/booking-status-pill';
import { BookingTimeline } from '@/components/booking-timeline';
import { ReviewFormDialog } from '@/components/review-form-dialog';
import { BookingChatTab } from '@/components/booking-chat-tab';
import { bookingsApi } from '@/lib/api/bookings';
import { reviewsApi } from '@/lib/api/reviews';
import { bookingBrandLabel, bookingKolLabel } from '@/lib/bookings/display';
import { brandProfilePath } from '@/lib/brands/display';
import { useAuth } from '@/contexts/AuthContext';
import type {
  BookingResponse,
  Platform,
  PricingPackageType,
  ReviewDirection,
  ReviewResponse,
  SubmittedDeliverableResponse,
} from '@/lib/api/types';
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_DESCRIPTION,
  isBranchState,
  bookingCommission,
  canBrandCancelBooking,
} from '@/lib/bookings/status';
import {
  detectPlatformFromUrl,
  formatDeliverableSpec,
  packageTypeLabel,
  parseBookingDeliverables,
  platformLabel,
} from '@/lib/bookings/deliverables';

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

function fileNameFromUrl(url: string): string {
  const part = url.split('/').pop() ?? '';
  try {
    return decodeURIComponent(part) || 'Tệp đính kèm';
  } catch {
    return part || 'Tệp đính kèm';
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
  const [deliverableUploading, setDeliverableUploading] = useState(false);
  const deliverableFileInputRef = useRef<HTMLInputElement | null>(null);

  // Revision request dialog (BRAND only, when status === 'DELIVERED').
  const [revisionDialog, setRevisionDialog] = useState<{
    open: boolean;
    reason: string;
    reasonError: string;
  }>({ open: false, reason: '', reasonError: '' });

  // Deliverable submission modal (KOL only, when status === 'IN_PROGRESS').
  const [deliverableForm, setDeliverableForm] = useState<{
    open: boolean;
    submittedUrl: string;
    note: string;
    deliverableId: string;
    type: PricingPackageType;
    platform: Platform;
    error: string;
  }>({
    open: false,
    submittedUrl: '',
    note: '',
    deliverableId: '1',
    type: 'VIDEO',
    platform: 'TIKTOK',
    error: '',
  });

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
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;
    const reason = window.prompt('Lý do hủy đơn? (tuỳ chọn)');
    if (reason === null) return;
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

  async function handleRejectDelivery() {
    if (!booking) return;
    const reason = window.prompt('Lý do từ chối nội dung? (tuỳ chọn)');
    if (reason === null) return;
    if (
      !window.confirm(
        'Từ chối nội dung sẽ hoàn toàn bộ ngân sách về ví của bạn. KOL sẽ không được thanh toán. Tiếp tục?',
      )
    ) {
      return;
    }
    setActionLoading('reject-delivery');
    try {
      await bookingsApi.rejectDelivery(booking.id, reason || undefined);
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Từ chối nội dung thất bại.';
      window.alert(message);
    } finally {
      setActionLoading(null);
    }
  }

  function openRevisionDialog() {
    setRevisionDialog({ open: true, reason: '', reasonError: '' });
  }

  async function handleRevisionSubmit() {
    const reason = revisionDialog.reason.trim();
    if (!reason) {
      setRevisionDialog((p) => ({ ...p, reasonError: 'Vui lòng nhập feedback chỉnh sửa.' }));
      return;
    }
    if (reason.length < 10) {
      setRevisionDialog((p) => ({
        ...p,
        reasonError: 'Feedback phải có ít nhất 10 ký tự.',
      }));
      return;
    }
    if (!booking) return;
    setActionLoading('request-revision');
    setRevisionDialog((p) => ({ ...p, open: false }));
    try {
      await bookingsApi.requestRevision(booking.id, { reason });
      toast.success('Đã gửi yêu cầu chỉnh sửa cho KOL.');
      await fetchBooking();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gửi yêu cầu chỉnh sửa thất bại.';
      toast.error(message);
      setRevisionDialog((p) => ({ ...p, open: true, reason }));
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
    const reason = window.prompt('Lý do từ chối? (tuỳ chọn)');
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
    const specs = parseBookingDeliverables(booking?.deliverables);
    const first = specs[0];
    setDeliverableForm({
      open: true,
      submittedUrl: '',
      note: '',
      deliverableId: first ? '1' : '1',
      type: first?.type ?? 'VIDEO',
      platform: first?.platform ?? 'TIKTOK',
      error: '',
    });
  }

  function closeDeliverableForm() {
    if (actionLoading === 'submit-deliverable' || deliverableUploading) return;
    setDeliverableForm((prev) => ({ ...prev, open: false, error: '' }));
  }

  async function handleDeliverableFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = ACCEPTED_IMAGE_TYPES.includes(
      file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
    )
      ? 'image'
      : 'video';
    const validationError = validateUploadFile(file, kind);
    if (validationError) {
      toast.error(validationError);
      e.target.value = '';
      return;
    }
    setDeliverableUploading(true);
    try {
      const res = await filesApi.upload(file);
      setDeliverableForm((prev) => ({
        ...prev,
        submittedUrl: res.url,
        error: '',
      }));
      toast.success(
        kind === 'video' ? 'Đã tải lên video.' : 'Đã tải lên ảnh nội dung.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tải lên thất bại.';
      toast.error(message);
    } finally {
      setDeliverableUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmitDeliverable() {
    if (!booking) return;
    const url = deliverableForm.submittedUrl.trim();
    const idRaw = deliverableForm.deliverableId.trim();
    if (!url) {
      setDeliverableForm((prev) => ({ ...prev, error: 'Vui lòng nhập đường dẫn nội dung.' }));
      return;
    }
    if (!isValidContentUrl(url)) {
      setDeliverableForm((prev) => ({
        ...prev,
        error: 'Đường dẫn phải là link https:// hoặc tệp đã tải lên.',
      }));
      return;
    }
    const deliverableId = Number(idRaw);
    if (!Number.isFinite(deliverableId) || deliverableId < 0) {
      setDeliverableForm((prev) => ({ ...prev, error: 'Mã giao nội dung không hợp lệ.' }));
      return;
    }
    const platform =
      deliverableForm.platform || detectPlatformFromUrl(url) || 'TIKTOK';
    setActionLoading('submit-deliverable');
    setDeliverableForm((prev) => ({ ...prev, error: '' }));
    try {
      await bookingsApi.submitDeliverable(booking.id, {
        deliverableId,
        type: deliverableForm.type,
        platform,
        submittedUrl: url,
        note: deliverableForm.note.trim() || undefined,
      });
      setDeliverableForm({
        open: false,
        submittedUrl: '',
        note: '',
        deliverableId: '1',
        type: 'VIDEO',
        platform: 'TIKTOK',
        error: '',
      });
      await fetchBooking();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nộp giao nội dung thất bại.';
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
  const deliverableSpecs = parseBookingDeliverables(booking.deliverables);

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
          {booking.revisionFeedback && booking.status === 'IN_PROGRESS' && (
            <div
              className="mt-3 rounded-2xl px-4 py-3 text-sm"
              style={{
                background: BOOKING_STATUS_COLORS.PENDING.soft,
                border: `1px solid ${BOOKING_STATUS_COLORS.PENDING.border}`,
              }}
            >
              <p className="font-bold text-ink mb-1 flex items-center gap-1.5">
                <PenSquare className="w-4 h-4" />
                Brand yêu cầu chỉnh sửa
                {booking.revisionRequestedAt && (
                  <span className="font-normal text-mute ml-auto text-xs">
                    {formatDateTime(booking.revisionRequestedAt)}
                  </span>
                )}
              </p>
              <p className="text-body whitespace-pre-wrap">{booking.revisionFeedback}</p>
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
            onRejectDelivery={handleRejectDelivery}
            onRequestRevision={openRevisionDialog}
            onAccept={handleAccept}
            onReject={handleReject}
            onSubmitDeliverable={openDeliverableForm}
            myReview={myReview}
            otherReview={otherReview}
            onReviewSuccess={setMyReview}
          />
        ) : (
          <BookingChatTab bookingId={booking.id} currentUserId={user?.userId ?? -1} />
        )}
      </main>

      {/* Revision request dialog — BRAND flow when booking is DELIVERED */}
      <Dialog
        open={revisionDialog.open}
        onOpenChange={(open) => !open && setRevisionDialog((p) => ({ ...p, open: false }))}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink">
              <PenSquare className="w-5 h-5" />
              Yêu cầu chỉnh sửa nội dung
            </DialogTitle>
            <DialogDescription>
              Gửi feedback cụ thể để KOL chỉnh sửa và nộp lại. Ngân sách vẫn được giữ cho đến khi
              bạn chấp nhận nội dung hoặc từ chối/hoàn tiền.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">
                Feedback chỉnh sửa <span className="text-pin-red">*</span>
              </label>
              <Textarea
                value={revisionDialog.reason}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 2000) {
                    setRevisionDialog((p) => ({
                      ...p,
                      reason: val,
                      reasonError:
                        val.trim().length > 0 && val.trim().length < 10
                          ? 'Feedback phải có ít nhất 10 ký tự.'
                          : '',
                    }));
                  }
                }}
                placeholder="VD: Logo bị che khuất ở giây 0:05, cần nhắc rõ tên sản phẩm, tone màu sáng hơn…"
                className={`min-h-[120px] resize-none${revisionDialog.reasonError ? ' border-red-500' : ''}`}
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                {revisionDialog.reasonError ? (
                  <p className="text-xs text-red-600">{revisionDialog.reasonError}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-mute">{revisionDialog.reason.length}/2000</p>
              </div>
            </div>

            <div className="rounded-xl bg-surface-card border border-hairline px-4 py-3 text-sm text-body">
              <p className="font-bold text-ink mb-1">Khác với từ chối nội dung</p>
              <p className="text-xs leading-relaxed">
                Yêu cầu chỉnh sửa giữ nguyên đơn hàng và cho KOL cơ hội nộp lại. Chỉ dùng{' '}
                <strong>Từ chối nội dung</strong> khi muốn hủy hoàn toàn và hoàn tiền về ví.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRevisionDialog((p) => ({ ...p, open: false }))}
              disabled={actionLoading === 'request-revision'}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleRevisionSubmit}
              disabled={
                actionLoading === 'request-revision' ||
                revisionDialog.reason.trim().length < 10
              }
            >
              {actionLoading === 'request-revision' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <PenSquare className="w-4 h-4 mr-2" />
              )}
              Gửi feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            className="pin-card w-full max-w-[520px] max-h-[min(90vh,720px)] overflow-y-auto p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2
                  id="submit-deliverable-title"
                  className="font-display font-extrabold text-xl text-ink"
                >
                  {booking?.revisionFeedback?.trim()
                    ? 'Nộp lại nội dung'
                    : 'Nộp giao nội dung'}
                </h2>
                <p className="text-sm text-mute mt-1">
                  {booking?.revisionFeedback?.trim()
                    ? 'Brand đã gửi feedback chỉnh sửa. Upload phiên bản mới để họ xem lại.'
                    : 'Gửi nội dung đã hoàn thiện để Brand xem trước và nghiệm thu. Brand chấp nhận hoặc im lặng 3 ngày → bạn nhận tiền tự động.'}
                </p>
                {booking?.revisionFeedback?.trim() && (
                  <div className="mt-3 rounded-xl border border-hairline bg-surface-card px-3 py-2.5 text-sm">
                    <p className="text-xs uppercase tracking-wide text-mute font-bold mb-1">
                      Feedback từ Brand
                    </p>
                    <p className="text-body whitespace-pre-wrap">{booking.revisionFeedback}</p>
                  </div>
                )}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="https://... hoặc tải file lên"
                    maxLength={500}
                    value={deliverableForm.submittedUrl}
                    onChange={(e) => {
                      const submittedUrl = e.target.value;
                      setDeliverableForm((prev) => {
                        const detected =
                          deliverableSpecs.length === 0
                            ? detectPlatformFromUrl(submittedUrl)
                            : null;
                        return {
                          ...prev,
                          submittedUrl,
                          ...(detected ? { platform: detected } : {}),
                          error: '',
                        };
                      });
                    }}
                    disabled={
                      actionLoading === 'submit-deliverable' || deliverableUploading
                    }
                    className="pin-input w-full disabled:opacity-50"
                  />
                  <input
                    ref={deliverableFileInputRef}
                    type="file"
                    accept={`${ACCEPTED_IMAGE_ACCEPT},${ACCEPTED_VIDEO_ACCEPT}`}
                    className="hidden"
                    onChange={handleDeliverableFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => deliverableFileInputRef.current?.click()}
                    disabled={
                      actionLoading === 'submit-deliverable' || deliverableUploading
                    }
                    className="btn-pin-secondary shrink-0 disabled:opacity-50"
                    title="Tải ảnh hoặc video lên"
                  >
                    {deliverableUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-mute mt-1">
                  Dán link bài đăng/video/story/Drive — hoặc bấm tải lên để chọn ảnh (tối đa 5MB) hoặc video MP4 (tối đa 100MB) từ máy tính.
                </p>
                {isPreviewableDeliverableUrl(deliverableForm.submittedUrl) && (
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-mute font-bold mb-1.5">
                      Xem trước
                    </p>
                    <DeliverableMediaPreview url={deliverableForm.submittedUrl} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-mute font-bold mb-1.5 block">
                  Loại nội dung <span className="text-pin-red">*</span>
                </label>
                {deliverableSpecs.length > 0 ? (
                  <select
                    value={deliverableForm.deliverableId}
                    onChange={(e) => {
                      const index = Number(e.target.value) - 1;
                      const spec = deliverableSpecs[index];
                      if (!spec) return;
                      setDeliverableForm((prev) => ({
                        ...prev,
                        deliverableId: e.target.value,
                        type: spec.type,
                        platform: spec.platform,
                        error: '',
                      }));
                    }}
                    disabled={actionLoading === 'submit-deliverable'}
                    className="pin-input w-full disabled:opacity-50"
                  >
                    {deliverableSpecs.map((spec, index) => (
                      <option key={`${spec.type}-${spec.platform}-${index}`} value={String(index + 1)}>
                        {formatDeliverableSpec(spec)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <select
                      value={deliverableForm.type}
                      onChange={(e) =>
                        setDeliverableForm((prev) => ({
                          ...prev,
                          type: e.target.value as PricingPackageType,
                          error: '',
                        }))
                      }
                      disabled={actionLoading === 'submit-deliverable'}
                      className="pin-input w-full disabled:opacity-50"
                    >
                      {(Object.keys(packageTypeLabel) as PricingPackageType[]).map((key) => (
                        <option key={key} value={key}>
                          {packageTypeLabel[key]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={deliverableForm.platform}
                      onChange={(e) =>
                        setDeliverableForm((prev) => ({
                          ...prev,
                          platform: e.target.value as Platform,
                          error: '',
                        }))
                      }
                      disabled={actionLoading === 'submit-deliverable'}
                      className="pin-input w-full disabled:opacity-50"
                    >
                      {(Object.keys(platformLabel) as Platform[]).map((key) => (
                        <option key={key} value={key}>
                          {platformLabel[key]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-mute mt-1">
                  {deliverableSpecs.length > 0
                    ? 'Chọn mục giao nội dung tương ứng với yêu cầu trong booking.'
                    : 'Chọn loại và nền tảng của nội dung bạn đang nộp.'}
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
                    deliverableUploading ||
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
  onRejectDelivery: () => void;
  onRequestRevision: () => void;
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
  onRejectDelivery,
  onRequestRevision,
  onAccept,
  onReject,
  onSubmitDeliverable,
  myReview,
  otherReview,
  onReviewSuccess,
}: DetailTabProps) {
  const { feePercent, feeAmount: fee, netAmount: payout } = bookingCommission(booking);
  const kolPercent = Math.max(0, 100 - feePercent);

  // ─── BRAND action panel ────────────────────────────────────────────────────
  const brandActions: React.ReactNode[] = [];
  if (isBrand) {
    if (canBrandCancelBooking(booking.status)) {
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
          Chấp nhận & thanh toán KOL
        </button>,
        <button
          key="request-revision"
          type="button"
          onClick={onRequestRevision}
          disabled={actionLoading !== null}
          className="btn-pin-secondary disabled:opacity-50"
        >
          {actionLoading === 'request-revision' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PenSquare className="w-4 h-4" />
          )}
          Yêu cầu chỉnh sửa
        </button>,
        <button
          key="reject-delivery"
          type="button"
          onClick={onRejectDelivery}
          disabled={actionLoading !== null}
          className="btn-pin-secondary disabled:opacity-50"
        >
          {actionLoading === 'reject-delivery' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Từ chối nội dung
        </button>,
      );
    }
    if (booking.status === 'COMPLETED') {
      brandActions.push(
        <Link
          key="invoice"
          href={`/bookings/${booking.id}/invoice`}
          className="btn-pin-secondary"
        >
          <Receipt className="w-4 h-4" />
          Xem hóa đơn
        </Link>,
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
    if (booking.status === 'COMPLETED') {
      kolActions.push(
        <Link
          key="invoice"
          href={`/bookings/${booking.id}/invoice`}
          className="btn-pin-secondary"
        >
          <Receipt className="w-4 h-4" />
          Xem hóa đơn
        </Link>,
      );
    }
    if (booking.status === 'IN_PROGRESS') {
      const isResubmit = Boolean(booking.revisionFeedback?.trim());
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
          ) : isResubmit ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isResubmit ? 'Nộp lại nội dung' : 'Nộp giao nội dung'}
        </button>,
      );
    }
  }

  const actions = isBrand ? brandActions : kolActions;
  const branched = isBranchState(booking.status);

  // ─── Review section (only visible when booking is COMPLETED) ───────────────
  const showReviewSection =
    booking.status === 'COMPLETED' && (isBrand || isKol);
  const reviewDirection: ReviewDirection = isBrand ? 'BRAND_TO_KOL' : 'KOL_TO_BRAND';
  const targetName = isBrand
    ? bookingKolLabel(booking)
    : bookingBrandLabel(booking);
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
            <DetailRow label={isBrand ? 'KOL' : 'Brand'}>
              {isBrand ? (
                <p className="text-ink font-bold">{targetName}</p>
              ) : (
                <Link
                  href={brandProfilePath(booking.brandProfileId)}
                  className="text-ink font-bold hover:text-pin-red transition-colors"
                >
                  {targetName}
                </Link>
              )}
            </DetailRow>
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
            {booking.attachmentUrl && (
              <DetailRow label="Tệp đính kèm">
                <a
                  href={resolveMediaUrl(booking.attachmentUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-pin-red transition-colors break-all"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  {fileNameFromUrl(booking.attachmentUrl)}
                </a>
              </DetailRow>
            )}
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

        {/* Submitted deliverables — visible to both sides when content has been submitted */}
        {booking.submittedDeliverables && booking.submittedDeliverables.length > 0 && (
          <SubmittedDeliverablesSection
            deliverables={booking.submittedDeliverables}
            revisionFeedback={booking.revisionFeedback}
          />
        )}

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
              <span className="text-mute">KOL nhận ({kolPercent}%)</span>
              <span className="font-bold text-ink">{vnd.format(payout)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-mute">Phí nền tảng ({feePercent}%)</span>
              <span className="text-body">{vnd.format(fee)}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-hairline-soft">
              <p className="text-xs text-mute leading-relaxed">
                {booking.status === 'COMPLETED'
                  ? 'KOL đã nhận tiền vào ví tự động; nền tảng đã trích phí.'
                  : booking.status === 'DELIVERY_REJECTED'
                    ? 'Ngân sách đã hoàn về ví Brand.'
                    : branched
                      ? 'Đơn đã kết thúc, không phát sinh giao dịch.'
                      : booking.status === 'DELIVERED'
                        ? 'Chấp nhận, yêu cầu chỉnh sửa, hoặc từ chối. Im lặng 3 ngày → hệ thống tự thanh toán KOL.'
                        : 'Tiền được giữ trong escrow sau khi Brand thanh toán.'}
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

function SubmittedDeliverablesSection({
  deliverables,
  revisionFeedback,
}: {
  deliverables: SubmittedDeliverableResponse[];
  revisionFeedback?: string | null;
}) {
  const sorted = [...deliverables].sort((a, b) => {
    const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return bTime - aTime;
  });
  const versionById = new Map(
    [...deliverables]
      .sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return aTime - bTime;
      })
      .map((d, index) => [d.id, index + 1] as const),
  );

  return (
    <section className="pin-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-ink" />
        <h2 className="font-display font-bold text-lg text-ink">Nội dung KOL đã nộp</h2>
        {sorted.length > 1 && (
          <span className="text-xs text-mute ml-auto">{sorted.length} lần nộp</span>
        )}
      </div>
      <div className="space-y-3">
        {sorted.map((d) => {
          const version = versionById.get(d.id) ?? 1;
          const feedback = d.brandFeedback?.trim();
          return (
          <div
            key={d.id}
            className="rounded-2xl border border-hairline bg-canvas p-4 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-ink text-on-dark font-bold">
                Lần nộp #{version}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-card font-bold text-ink">
                {d.type}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-card font-bold text-ink">
                {d.platform}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  d.status === 'APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : d.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {d.status === 'SUBMITTED'
                  ? 'Chờ duyệt'
                  : d.status === 'APPROVED'
                    ? 'Đã duyệt'
                    : d.status === 'REJECTED'
                      ? 'Cần chỉnh sửa'
                      : d.status}
              </span>
              {d.submittedAt && (
                <span className="text-mute ml-auto">{formatDateTime(d.submittedAt)}</span>
              )}
            </div>
            {feedback && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
                <p className="text-xs uppercase tracking-wide font-bold text-amber-800 mb-1 flex items-center gap-1">
                  <PenSquare className="w-3.5 h-3.5" />
                  Feedback Brand
                </p>
                <p className="text-amber-900 whitespace-pre-wrap">{feedback}</p>
              </div>
            )}
            {d.submittedUrl && (
              <>
                <DeliverableMediaPreview url={d.submittedUrl} />
                <a
                  href={resolveMediaUrl(d.submittedUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-pin-red transition-colors break-all"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  {d.submittedUrl}
                </a>
              </>
            )}
            {d.note && (
              <p className="text-sm text-body whitespace-pre-wrap leading-relaxed border-t border-hairline-soft pt-2 mt-1">
                <span className="text-xs uppercase tracking-wide text-mute font-bold block mb-1">
                  Ghi chú KOL
                </span>
                {d.note}
              </p>
            )}
          </div>
        );
        })}
      </div>
      {revisionFeedback?.trim() && (
        <p className="text-xs text-mute mt-4">
          Feedback chỉnh sửa mới nhất cũng hiển thị ở banner phía trên cho KOL.
        </p>
      )}
    </section>
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

