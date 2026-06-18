'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Star,
  Users,
  Trophy,
  ListChecks,
  X,
  UserCheck,
  ExternalLink,
  Inbox,
  ArrowLeftRight,
} from 'lucide-react';
import { Header } from '@/components/header';
import { ApplicationStatusPill } from '@/components/product-status-pill';
import { PaginationBar } from '@/components/pagination-bar';
import { productsApi } from '@/lib/api/products';
import { applicationsApi } from '@/lib/api/applications';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import { CurrencyInput } from '@/components/currency-input';
import { parsePriceDigits, validatePriceDigits } from '@/lib/currency-input';
import type {
  ProductResponse,
  ProductApplicationResponse,
  ApplicationStatus,
  TopApplicantsBy,
} from '@/lib/api/types';
import { vnd, formatFollowers, TOP_BY_OPTIONS } from '@/lib/products/meta';

const PAGE_SIZE = 12;

const STATUS_TABS: { value: ApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'SHORTLISTED', label: 'Danh sách rút gọn' },
  { value: 'COUNTER_OFFERED', label: 'Đang thương lượng' },
  { value: 'ACCEPTED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

export default function ProductApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const productId = Number(idStr);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [mode, setMode] = useState<'all' | 'top'>('all');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [topBy, setTopBy] = useState<TopApplicantsBy>('rating');

  const [items, setItems] = useState<ProductApplicationResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectFor, setRejectFor] = useState<ProductApplicationResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [counterFor, setCounterFor] = useState<ProductApplicationResponse | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterError, setCounterError] = useState('');
  const [countering, setCountering] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=/products/${productId}/applications`);
    } else if (user && user.role !== 'BRAND') {
      router.replace(`/products/${productId}`);
    }
  }, [authLoading, isAuthenticated, user, router, productId]);

  // Product header (title) — best effort.
  useEffect(() => {
    if (Number.isNaN(productId)) return;
    productsApi.getById(productId).then(setProduct).catch(() => setProduct(null));
  }, [productId]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'top') {
        const top = await productsApi.topApplicants(productId, topBy, 5);
        setItems(top);
        setTotalPages(0);
      } else {
        const res = await productsApi.listApplicants(productId, {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page,
          size: PAGE_SIZE,
        });
        setItems(res.content);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách ứng viên.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mode, productId, statusFilter, topBy, page]);

  useEffect(() => {
    if (authLoading || user?.role !== 'BRAND') return;
    void fetchList();
  }, [authLoading, user, fetchList]);

  function patchItem(updated: ProductApplicationResponse) {
    setItems((list) => list.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function doShortlist(a: ProductApplicationResponse) {
    setBusyId(a.id);
    setError('');
    try {
      patchItem(await applicationsApi.shortlist(a.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể đưa vào danh sách rút gọn.');
    } finally {
      setBusyId(null);
    }
  }

  async function doAccept(a: ProductApplicationResponse) {
    if (!window.confirm('Duyệt ứng viên này? Một booking sẽ được tạo tự động.')) return;
    setBusyId(a.id);
    setError('');
    try {
      patchItem(await applicationsApi.accept(a.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể duyệt ứng viên.');
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject() {
    if (!rejectFor) return;
    setRejecting(true);
    setError('');
    try {
      patchItem(await applicationsApi.reject(rejectFor.id, { reason: rejectReason.trim() || undefined }));
      setRejectFor(null);
      setRejectReason('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể từ chối ứng tuyển.');
    } finally {
      setRejecting(false);
    }
  }

  async function submitCounterOffer() {
    if (!counterFor) return;
    const priceErr = validatePriceDigits(counterPrice, { required: true, min: 1000, fieldLabel: 'Giá thương lượng' });
    if (priceErr) {
      setCounterError(priceErr);
      return;
    }
    const price = parsePriceDigits(counterPrice);
    if (price == null) {
      setCounterError('Vui lòng nhập giá hợp lệ (≥ 1,000 VND)');
      return;
    }
    setCountering(true);
    setCounterError('');
    try {
      patchItem(await applicationsApi.counterOffer(counterFor.id, price));
      setCounterFor(null);
      setCounterPrice('');
    } catch (err) {
      setCounterError(err instanceof ApiError ? err.message : 'Không thể gửi giá thương lượng.');
    } finally {
      setCountering(false);
    }
  }

  if (authLoading || user?.role !== 'BRAND') {
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
      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 py-8">
        <Link href={`/products/${productId}`} className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay lại tin đăng
        </Link>

        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">Ứng viên</h1>
        <p className="text-mute mb-6 line-clamp-1">{product?.title ?? 'Đang tải…'}</p>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('all');
              setPage(0);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              mode === 'all' ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Tất cả ứng viên
          </button>
          <button
            type="button"
            onClick={() => setMode('top')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              mode === 'top' ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Top 5 nổi bật
          </button>
        </div>

        {/* Secondary filter row */}
        {mode === 'all' ? (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setStatusFilter(t.value);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === t.value ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-mute">Xếp hạng theo:</span>
            {TOP_BY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setTopBy(o.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  topBy === o.value ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-canvas border border-hairline animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-canvas rounded-2xl border border-hairline">
            <Inbox className="w-12 h-12 text-mute mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-ink mb-2">Chưa có ứng viên</h2>
            <p className="text-mute text-sm">
              {mode === 'top'
                ? 'Chưa có ứng viên nào đủ điều kiện xếp hạng.'
                : 'Chưa có KOL nào ứng tuyển ở bộ lọc này.'}
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((a, idx) => (
                <ApplicantCard
                  key={a.id}
                  app={a}
                  rank={mode === 'top' ? idx + 1 : undefined}
                  busy={busyId === a.id}
                  onShortlist={() => doShortlist(a)}
                  onAccept={() => doAccept(a)}
                  onReject={() => {
                    setRejectReason('');
                    setRejectFor(a);
                  }}
                  onCounterOffer={() => {
                    setCounterPrice('');
                    setCounterError('');
                    setCounterFor(a);
                  }}
                />
              ))}
            </ul>
            {mode === 'all' && <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />}
          </>
        )}
      </main>

      {/* Counter-offer modal */}
      {counterFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !countering && setCounterFor(null)}
        >
          <div className="bg-canvas rounded-2xl shadow-xl w-full max-w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl text-ink mb-1">Thương lượng giá</h2>
            <p className="text-sm text-mute mb-1">
              KOL <span className="font-semibold text-ink">{counterFor.kolDisplayName}</span> đề xuất:{' '}
              {counterFor.proposedPrice != null ? vnd.format(counterFor.proposedPrice) : '—'}
            </p>
            <p className="text-sm text-mute mb-4">Nhập mức giá bạn muốn đề nghị lại:</p>
            <CurrencyInput
              value={counterPrice}
              onValueChange={(digits) => { setCounterPrice(digits); setCounterError(''); }}
              onValidate={setCounterError}
              validateOptions={{ required: true, min: 1000, fieldLabel: 'Giá thương lượng' }}
              className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm mb-1"
            />
            {counterError && <p className="text-xs text-pin-red mb-3">{counterError}</p>}
            {!counterError && <div className="mb-3" />}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCounterFor(null)}
                disabled={countering}
                className="btn-pin-secondary !rounded-full disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submitCounterOffer}
                disabled={countering}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50"
              >
                {countering ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                Gửi giá thương lượng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !rejecting && setRejectFor(null)}
        >
          <div className="bg-canvas rounded-2xl shadow-xl w-full max-w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl text-ink mb-1">Từ chối ứng tuyển</h2>
            <p className="text-sm text-mute mb-4">
              {rejectFor.kolDisplayName ?? 'Ứng viên'} sẽ nhận được thông báo. Lý do là tuỳ chọn.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Lý do từ chối (tuỳ chọn)…"
              className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectFor(null)}
                disabled={rejecting}
                className="btn-pin-secondary !rounded-full disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={rejecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pin-red text-on-dark text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicantCard({
  app,
  rank,
  busy,
  onShortlist,
  onAccept,
  onReject,
  onCounterOffer,
}: {
  app: ProductApplicationResponse;
  rank?: number;
  busy: boolean;
  onShortlist: () => void;
  onAccept: () => void;
  onReject: () => void;
  onCounterOffer: () => void;
}) {
  const canShortlist = app.status === 'PENDING';
  const canCounterOffer = (app.status === 'PENDING' || app.status === 'SHORTLISTED') && app.proposedPrice != null && app.proposedPrice > 0;
  const canAccept = app.status === 'PENDING' || app.status === 'SHORTLISTED' || app.status === 'COUNTER_OFFERED';
  const canReject = app.status === 'PENDING' || app.status === 'SHORTLISTED' || app.status === 'COUNTER_OFFERED';
  const initial = (app.kolDisplayName ?? 'K').charAt(0).toUpperCase();

  return (
    <li className="bg-canvas rounded-2xl border border-hairline p-4">
      <div className="flex items-start gap-4">
        {rank != null && (
          <span className="grid place-items-center w-7 h-7 rounded-full bg-ink text-on-dark text-xs font-extrabold flex-shrink-0 mt-0.5">
            {rank}
          </span>
        )}
        <div className="w-12 h-12 rounded-full bg-surface-card overflow-hidden flex-shrink-0 grid place-items-center">
          {app.kolAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(app.kolAvatarUrl)} alt={app.kolDisplayName ?? ''} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-ink">{initial}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {app.kolSlug ? (
              <Link href={`/kol/${app.kolSlug}`} className="font-bold text-ink hover:text-pin-red">
                {app.kolDisplayName ?? 'KOL'}
              </Link>
            ) : (
              <span className="font-bold text-ink">{app.kolDisplayName ?? 'KOL'}</span>
            )}
            <ApplicationStatusPill status={app.status} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-mute mb-2">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {app.kolAvgRating != null ? app.kolAvgRating.toFixed(1) : '—'}
              <span className="text-mute">({app.kolReviewCount ?? 0})</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formatFollowers(app.kolMaxFollowerCount)}
            </span>
            {app.kolMinPrice != null && app.kolMinPrice > 0 && (
              <span>Giá từ {vnd.format(app.kolMinPrice)}</span>
            )}
          </div>

          {app.message && (
            <p className="text-sm text-body bg-surface-soft rounded-xl px-3 py-2 mb-2 whitespace-pre-wrap">
              {app.message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {app.proposedPrice != null && app.proposedPrice > 0 && (
              <span className="font-semibold text-ink">Giá đề xuất: {vnd.format(app.proposedPrice)}</span>
            )}
            {app.brandCounterPrice != null && app.brandCounterPrice > 0 && (
              <span className="font-semibold text-amber-600">Giá thương lượng: {vnd.format(app.brandCounterPrice)}</span>
            )}
            {app.bookingId && (
              <Link
                href={`/bookings/${app.bookingId}`}
                className="inline-flex items-center gap-1 font-bold text-ink hover:text-pin-red"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Booking #{app.bookingId}
              </Link>
            )}
            {app.rejectReason && <span className="text-pin-red">Lý do: {app.rejectReason}</span>}
          </div>
        </div>
      </div>

      {(canShortlist || canCounterOffer || canAccept || canReject) && (
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-hairline-soft">
          {canShortlist && (
            <button
              type="button"
              onClick={onShortlist}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-50"
            >
              <ListChecks className="w-4 h-4" />
              Danh sách rút gọn
            </button>
          )}
          {canCounterOffer && (
            <button
              type="button"
              onClick={onCounterOffer}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Thương lượng
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-pin-red bg-pin-red/10 hover:bg-pin-red/20 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Từ chối
            </button>
          )}
          {canAccept && (
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-on-dark bg-ink hover:bg-charcoal transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Duyệt & tạo booking
            </button>
          )}
        </div>
      )}
    </li>
  );
}
