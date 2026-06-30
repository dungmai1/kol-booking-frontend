'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Inbox,
  ExternalLink,
  Undo2,
  ArrowRight,
  CalendarClock,
  Check,
  X,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/header';
import { ApplicationStatusPill } from '@/components/product-status-pill';
import { PaginationBar } from '@/components/pagination-bar';
import { ApplicationNegotiationChat } from '@/components/application-negotiation-chat';
import { DocumentPreviewModal } from '@/components/document-preview-modal';
import { parseApplicationMessage } from '@/lib/applications/message';
import { applicationsApi } from '@/lib/api/applications';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import type { ProductApplicationResponse, ApplicationStatus } from '@/lib/api/types';
import { vnd, formatDate } from '@/lib/products/meta';

const TERMINAL_STATUSES: ApplicationStatus[] = ['WITHDRAWN', 'REJECTED', 'BOOKING_CANCELLED'];

const PAGE_SIZE = 12;

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [items, setItems] = useState<ProductApplicationResponse[]>([]);
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectCounterFor, setRejectCounterFor] = useState<ProductApplicationResponse | null>(null);
  const [rejectCounterReply, setRejectCounterReply] = useState('');
  const [rejectCounterSubmitting, setRejectCounterSubmitting] = useState(false);
  const [chatFor, setChatFor] = useState<ProductApplicationResponse | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/applications/mine');
    } else if (user && user.role !== 'KOL') {
      router.replace('/products');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await applicationsApi.listMine(page, PAGE_SIZE);
      setItems(res.content);
      setTotalPages(res.totalPages);

      // Enrich with product titles (the application DTO only carries productId).
      const ids = [...new Set(res.content.map((a) => a.productId))].filter((id) => titles[id] === undefined);
      if (ids.length > 0) {
        const fetched = await Promise.allSettled(ids.map((id) => productsApi.getById(id)));
        setTitles((prev) => {
          const next = { ...prev };
          fetched.forEach((r, i) => {
            if (r.status === 'fulfilled') next[ids[i]] = r.value.title;
          });
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách ứng tuyển.');
    } finally {
      setLoading(false);
    }
    // titles intentionally excluded: we only fetch missing ones, recompute is cheap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== 'KOL') return;
    void fetchMine();
  }, [authLoading, isAuthenticated, user, fetchMine]);

  async function doWithdraw(a: ProductApplicationResponse) {
    if (!window.confirm('Rút ứng tuyển này? Bạn sẽ không thể hoàn tác.')) return;
    setBusyId(a.id);
    setError('');
    try {
      const updated = await applicationsApi.withdraw(a.id);
      setItems((list) => list.map((x) => (x.id === a.id ? updated : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể rút ứng tuyển.');
    } finally {
      setBusyId(null);
    }
  }

  async function doAcceptCounter(a: ProductApplicationResponse) {
    if (!window.confirm('Chấp nhận giá thương lượng của brand? Một booking sẽ được tạo tự động.')) return;
    setBusyId(a.id);
    setError('');
    try {
      const updated = await applicationsApi.acceptCounter(a.id);
      setItems((list) => list.map((x) => (x.id === a.id ? updated : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể chấp nhận giá thương lượng.');
    } finally {
      setBusyId(null);
    }
  }

  async function submitRejectCounter() {
    if (!rejectCounterFor) return;
    setRejectCounterSubmitting(true);
    setError('');
    try {
      const updated = await applicationsApi.rejectCounter(
        rejectCounterFor.id,
        rejectCounterReply.trim() || undefined,
      );
      setItems((list) => list.map((x) => (x.id === rejectCounterFor.id ? updated : x)));
      setRejectCounterFor(null);
      setRejectCounterReply('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể từ chối giá thương lượng.');
    } finally {
      setRejectCounterSubmitting(false);
    }
  }

  if (authLoading || user?.role !== 'KOL') {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <Header />
      <main className="mx-auto max-w-[920px] px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">Ứng tuyển của tôi</h1>
            <p className="text-mute mt-1">Theo dõi trạng thái các chiến dịch bạn đã ứng tuyển.</p>
          </div>
          <Link href="/products" className="btn-pin-secondary !rounded-full">
            Tìm chiến dịch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-canvas border border-hairline animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-canvas rounded-2xl border border-hairline">
            <Inbox className="w-12 h-12 text-mute mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-ink mb-2">Chưa ứng tuyển chiến dịch nào</h2>
            <p className="text-mute text-sm mb-6">Khám phá các tin tuyển KOL và gửi hồ sơ ngay.</p>
            <Link href="/products" className="btn-pin-primary !rounded-full">
              Khám phá chiến dịch
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((a) => {
                const canWithdraw = a.status === 'PENDING' || a.status === 'SHORTLISTED' || a.status === 'COUNTER_OFFERED';
                const hasCounterOffer = a.status === 'COUNTER_OFFERED' && a.brandCounterPrice != null && a.brandCounterPrice > 0;
                const busy = busyId === a.id;
                return (
                  <li key={a.id} className={`bg-canvas rounded-2xl border p-4 ${hasCounterOffer ? 'border-amber-400' : 'border-hairline'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ApplicationStatusPill status={a.status} />
                          <span className="text-xs text-mute inline-flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            {formatDate(a.createdAt)}
                          </span>
                        </div>
                        <Link
                          href={`/products/${a.productId}`}
                          className="font-bold text-ink hover:text-pin-red line-clamp-1"
                        >
                          {titles[a.productId] ?? `Sản phẩm #${a.productId}`}
                        </Link>
                      </div>
                      {canWithdraw && (
                        <button
                          type="button"
                          onClick={() => doWithdraw(a)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-ink bg-surface-card hover:bg-secondary-bg transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                          Rút
                        </button>
                      )}
                    </div>

                    {/* Counter-offer banner */}
                    {hasCounterOffer && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 mb-3">
                        <p className="text-sm font-bold text-amber-800 mb-0.5">Brand đã gửi giá thương lượng</p>
                        <p className="text-sm text-amber-700 mb-2">
                          Giá đề xuất của bạn: <span className="font-semibold">{a.proposedPrice != null ? vnd.format(a.proposedPrice) : '—'}</span>
                          {' · '}
                          Giá brand đề nghị: <span className="font-semibold">{vnd.format(a.brandCounterPrice!)}</span>
                        </p>
                        {a.brandNegotiationNote && (
                          <p className="text-sm text-amber-700 bg-amber-100 rounded-lg px-3 py-2 mb-3 whitespace-pre-wrap">
                            <span className="font-semibold">Ghi chú brand: </span>{a.brandNegotiationNote}
                          </p>
                        )}
                        {!a.brandNegotiationNote && <div className="mb-3" />}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => doAcceptCounter(a)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-on-dark bg-ink hover:bg-charcoal transition-colors disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Chấp nhận
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectCounterFor(a); setRejectCounterReply(''); }}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-pin-red bg-pin-red/10 hover:bg-pin-red/20 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    )}

                    {a.status === 'PENDING' && a.kolNegotiationReply && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 mb-2">
                        <p className="text-xs font-semibold text-blue-700 mb-0.5">Phản hồi của bạn gửi brand:</p>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{a.kolNegotiationReply}</p>
                      </div>
                    )}

                    {(() => {
                      const { attachmentUrl, note } = parseApplicationMessage(a.message);
                      return (
                        <>
                          {attachmentUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(attachmentUrl)}
                              className="inline-flex items-center gap-2 mb-2 px-3 py-2 rounded-xl border border-hairline bg-surface-soft hover:border-ink text-sm font-semibold text-ink transition-colors"
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              Xem tài liệu đã gửi
                            </button>
                          )}
                          {note && (
                            <p className="text-sm text-body bg-surface-soft rounded-xl px-3 py-2 mb-2 whitespace-pre-wrap">
                              {note}
                            </p>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {a.proposedPrice != null && a.proposedPrice > 0 && !hasCounterOffer && (
                        <span className="font-semibold text-ink">Giá đề xuất: {vnd.format(a.proposedPrice)}</span>
                      )}
                      {a.bookingId && (
                        <Link
                          href={`/bookings/${a.bookingId}`}
                          className="inline-flex items-center gap-1 font-bold text-ink hover:text-pin-red"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Xem booking #{a.bookingId}
                        </Link>
                      )}
                      {a.rejectReason && <span className="text-pin-red">Lý do từ chối: {a.rejectReason}</span>}
                    </div>
                    {/* Chat button — available for all non-ACCEPTED/COMPLETED applications */}
                    {a.status !== 'ACCEPTED' && (
                      <div className="mt-3 pt-3 border-t border-hairline-soft flex justify-end">
                        <button
                          type="button"
                          onClick={() => setChatFor(a)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-ink bg-surface-card hover:bg-secondary-bg transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat thương lượng
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </main>

      {/* Reject counter-offer modal with optional reply message */}
      {rejectCounterFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !rejectCounterSubmitting && setRejectCounterFor(null)}
        >
          <div
            className="bg-canvas rounded-2xl shadow-xl w-full max-w-[440px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-xl text-ink mb-1">Từ chối giá thương lượng</h2>
            <p className="text-sm text-mute mb-1">
              Giá brand đề nghị:{' '}
              <span className="font-semibold text-ink">
                {rejectCounterFor.brandCounterPrice != null ? vnd.format(rejectCounterFor.brandCounterPrice) : '—'}
              </span>
            </p>
            <p className="text-sm text-mute mb-3">
              Bạn có thể gửi kèm lý do hoặc đề xuất giá mới để brand xem xét:
            </p>
            <textarea
              value={rejectCounterReply}
              onChange={(e) => setRejectCounterReply(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ghi chú hoặc đề xuất giá khác… (tuỳ chọn)"
              className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm resize-none mb-1"
            />
            <p className="text-xs text-mute text-right mb-4">{rejectCounterReply.length}/2000</p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectCounterFor(null)}
                disabled={rejectCounterSubmitting}
                className="btn-pin-secondary !rounded-full disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submitRejectCounter}
                disabled={rejectCounterSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pin-red text-on-dark text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                {rejectCounterSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Từ chối & gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation chat modal */}
      {chatFor && user && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4 py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setChatFor(null)}
        >
          <div
            className="bg-canvas rounded-2xl shadow-xl w-full max-w-[560px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <div>
                <h2 className="font-display font-bold text-lg text-ink">Chat thương lượng</h2>
                <p className="text-xs text-mute mt-0.5">
                  {titles[chatFor.productId] ?? `Sản phẩm #${chatFor.productId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatFor(null)}
                className="text-mute hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-card"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ApplicationNegotiationChat
                applicationId={chatFor.id}
                currentUserId={user.userId}
                currentUserRole="KOL"
                isTerminal={TERMINAL_STATUSES.includes(chatFor.status)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Xem trước tài liệu đã gửi */}
      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc}
          title={previewDoc.split('/').pop() || 'Tài liệu đã gửi'}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
