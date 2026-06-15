'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  PackageOpen,
  Users,
  CalendarClock,
  Pencil,
  ClipboardList,
  Lock,
  Unlock,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/header';
import { BrandProfileGateBanner } from '@/components/brand-profile-gate-banner';
import { ProductStatusPill } from '@/components/product-status-pill';
import { PaginationBar } from '@/components/pagination-bar';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { useBrandProfileGate } from '@/lib/hooks/use-brand-profile-gate';
import type { ProductResponse } from '@/lib/api/types';
import { vnd, formatDate } from '@/lib/products/meta';

const PAGE_SIZE = 10;

export default function ManageProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { isReady, canProceed, status } = useBrandProfileGate({
    loginRedirect: '/auth/login?redirect=/products/manage',
  });
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/products/manage');
    } else if (user && user.role !== 'BRAND') {
      router.replace('/products');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productsApi.listMine(page, PAGE_SIZE);
      setProducts(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== 'BRAND') return;
    void fetchMine();
  }, [authLoading, isAuthenticated, user, fetchMine]);

  async function toggleStatus(p: ProductResponse) {
    setBusyId(p.id);
    try {
      const updated = p.status === 'OPEN' ? await productsApi.close(p.id) : await productsApi.reopen(p.id);
      setProducts((list) => list.map((x) => (x.id === p.id ? updated : x)));
    } catch {
      // keep current state; surface a soft error
      setError('Không thể đổi trạng thái tin. Vui lòng thử lại.');
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !isReady || user?.role !== 'BRAND') {
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
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">Tin đăng của tôi</h1>
            <p className="text-mute mt-1">Quản lý các chiến dịch tuyển KOL bạn đã đăng.</p>
          </div>
          <Link
            href={canProceed ? '/products/new' : '/profile'}
            className={`btn-pin-primary !rounded-full ${!canProceed ? 'opacity-80' : ''}`}
          >
            <Plus className="w-4 h-4" />
            {canProceed ? 'Đăng sản phẩm' : 'Hoàn thiện hồ sơ'}
          </Link>
        </div>

        <BrandProfileGateBanner status={status} />

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-canvas border border-hairline animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-canvas rounded-2xl border border-hairline">
            <PackageOpen className="w-12 h-12 text-mute mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-ink mb-2">Chưa có tin đăng nào</h2>
            <p className="text-mute text-sm mb-6">Đăng chiến dịch đầu tiên để KOL có thể ứng tuyển.</p>
            <Link href={canProceed ? '/products/new' : '/profile'} className="btn-pin-primary !rounded-full">
              <Plus className="w-4 h-4" />
              {canProceed ? 'Đăng sản phẩm' : 'Hoàn thiện hồ sơ Brand'}
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="bg-canvas rounded-2xl border border-hairline p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="w-full sm:w-28 h-24 sm:h-20 rounded-xl bg-surface-card overflow-hidden flex-shrink-0">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-mute">
                        <PackageOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ProductStatusPill status={p.status} />
                      <span className="text-xs text-mute inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {p.applicationCount} ứng tuyển
                      </span>
                    </div>
                    <Link href={`/products/${p.id}`} className="font-bold text-ink hover:text-pin-red line-clamp-1">
                      {p.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-mute">
                      <span>{p.budget != null && p.budget > 0 ? vnd.format(p.budget) : 'Thỏa thuận'}</span>
                      {p.deadline && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          Hạn {formatDate(p.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/products/${p.id}/applications`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-ink bg-surface-card hover:bg-secondary-bg transition-colors"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Ứng viên
                    </Link>
                    <Link
                      href={`/products/${p.id}/edit`}
                      className="grid place-items-center w-9 h-9 rounded-xl text-ink bg-surface-card hover:bg-secondary-bg transition-colors"
                      aria-label="Chỉnh sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleStatus(p)}
                      disabled={busyId === p.id}
                      className="grid place-items-center w-9 h-9 rounded-xl text-ink bg-surface-card hover:bg-secondary-bg transition-colors disabled:opacity-50"
                      aria-label={p.status === 'OPEN' ? 'Đóng tin' : 'Mở lại tin'}
                    >
                      {busyId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : p.status === 'OPEN' ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      href={`/products/${p.id}`}
                      className="grid place-items-center w-9 h-9 rounded-xl text-ink bg-surface-card hover:bg-secondary-bg transition-colors"
                      aria-label="Xem tin"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </main>
    </div>
  );
}
