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
} from 'lucide-react';
import { Header } from '@/components/header';
import { ApplicationStatusPill } from '@/components/product-status-pill';
import { PaginationBar } from '@/components/pagination-bar';
import { applicationsApi } from '@/lib/api/applications';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import type { ProductApplicationResponse } from '@/lib/api/types';
import { vnd, formatDate } from '@/lib/products/meta';

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

  async function doRejectCounter(a: ProductApplicationResponse) {
    if (!window.confirm('Từ chối giá thương lượng? Ứng tuyển sẽ trở về trạng thái chờ duyệt.')) return;
    setBusyId(a.id);
    setError('');
    try {
      const updated = await applicationsApi.rejectCounter(a.id);
      setItems((list) => list.map((x) => (x.id === a.id ? updated : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể từ chối giá thương lượng.');
    } finally {
      setBusyId(null);
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
                const canWithdraw = a.status === 'PENDING' || a.status === 'SHORTLISTED';
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
                        <p className="text-sm text-amber-700 mb-3">
                          Giá đề xuất của bạn: <span className="font-semibold">{a.proposedPrice != null ? vnd.format(a.proposedPrice) : '—'}</span>
                          {' · '}
                          Giá brand đề nghị: <span className="font-semibold">{vnd.format(a.brandCounterPrice!)}</span>
                        </p>
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
                            onClick={() => doRejectCounter(a)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-pin-red bg-pin-red/10 hover:bg-pin-red/20 transition-colors disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Từ chối
                          </button>
                        </div>
                      </div>
                    )}

                    {a.message && (
                      <p className="text-sm text-body bg-surface-soft rounded-xl px-3 py-2 mb-2 whitespace-pre-wrap">
                        {a.message}
                      </p>
                    )}
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
                  </li>
                );
              })}
            </ul>
            <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </main>
    </div>
  );
}
