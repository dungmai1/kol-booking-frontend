'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Loader2, PackageOpen, Plus, ClipboardList } from 'lucide-react';
import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { PaginationBar } from '@/components/pagination-bar';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { useAuth } from '@/contexts/AuthContext';
import type { ProductResponse, CategoryResponse, Platform } from '@/lib/api/types';
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from '@/lib/products/meta';

const PAGE_SIZE = 12;

interface Filters {
  q: string;
  categoryId: string;
  platform: string;
  minBudget: string;
  maxBudget: string;
}

const EMPTY_FILTERS: Filters = {
  q: '',
  categoryId: '',
  platform: '',
  minBudget: '',
  maxBudget: '',
};

export default function ProductsBrowsePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Draft filters (form) vs applied filters (committed to the query).
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await productsApi.browse({
        q: applied.q.trim() || undefined,
        categoryId: applied.categoryId ? Number(applied.categoryId) : undefined,
        platform: (applied.platform as Platform) || undefined,
        minBudget: applied.minBudget ? Number(applied.minBudget) : undefined,
        maxBudget: applied.maxBudget ? Number(applied.maxBudget) : undefined,
        page,
        size: PAGE_SIZE,
      });
      setProducts(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    setPage(0);
    setApplied(draft);
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  }

  // Flatten category tree (parent + children) for the dropdown.
  const flatCategories: CategoryResponse[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  const hasActiveFilters = JSON.stringify(applied) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-8 pb-16">
          {/* Heading + role CTA */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display font-bold text-ink text-[28px] lg:text-[40px] tracking-[-0.8px]">
                Chiến dịch đang tuyển KOL
              </h1>
              <p className="text-mute mt-1.5">
                Khám phá tin đăng từ các thương hiệu và ứng tuyển vào chiến dịch phù hợp.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'BRAND' && (
                <>
                  <Link href="/products/manage" className="btn-pin-secondary !rounded-full">
                    <ClipboardList className="w-4 h-4" />
                    Tin của tôi
                  </Link>
                  <Link href="/products/new" className="btn-pin-primary !rounded-full">
                    <Plus className="w-4 h-4" />
                    Đăng sản phẩm
                  </Link>
                </>
              )}
              {user?.role === 'KOL' && (
                <Link href="/applications/mine" className="btn-pin-secondary !rounded-full">
                  <ClipboardList className="w-4 h-4" />
                  Ứng tuyển của tôi
                </Link>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <form
            onSubmit={applyFilters}
            className="bg-canvas rounded-2xl border border-hairline p-4 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
                <input
                  type="text"
                  value={draft.q}
                  onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                  placeholder="Tìm theo tiêu đề, mô tả…"
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm"
                />
              </div>

              <select
                value={draft.categoryId}
                onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
                className="md:col-span-3 h-11 px-3 rounded-xl border border-hairline bg-surface-soft focus:border-ink focus:outline-none text-sm text-ink"
              >
                <option value="">Tất cả danh mục</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={draft.platform}
                onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))}
                className="md:col-span-2 h-11 px-3 rounded-xl border border-hairline bg-surface-soft focus:border-ink focus:outline-none text-sm text-ink"
              >
                <option value="">Mọi nền tảng</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABEL[p]}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={draft.minBudget}
                onChange={(e) => setDraft((d) => ({ ...d, minBudget: e.target.value }))}
                placeholder="Ngân sách từ"
                className="md:col-span-1 h-11 px-3 rounded-xl border border-hairline bg-surface-soft focus:border-ink focus:outline-none text-sm"
              />
              <input
                type="number"
                min={0}
                value={draft.maxBudget}
                onChange={(e) => setDraft((d) => ({ ...d, maxBudget: e.target.value }))}
                placeholder="đến"
                className="md:col-span-1 h-11 px-3 rounded-xl border border-hairline bg-surface-soft focus:border-ink focus:outline-none text-sm"
              />

              <button type="submit" className="btn-pin-primary !rounded-xl md:col-span-1 justify-center">
                <SlidersHorizontal className="w-4 h-4" />
                Lọc
              </button>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-mute">{totalElements} kết quả</span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-ink hover:text-pin-red"
                >
                  Xoá bộ lọc
                </button>
              </div>
            )}
          </form>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-hairline bg-canvas overflow-hidden">
                  <div className="aspect-[16/10] bg-surface-card animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-surface-card rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-surface-card rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-pin-red font-semibold mb-4">{error}</p>
              <button onClick={() => fetchProducts()} className="btn-pin-secondary !rounded-full">
                Thử lại
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <PackageOpen className="w-12 h-12 text-mute mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-ink mb-2">
                Chưa có chiến dịch nào
              </h2>
              <p className="text-mute text-sm mb-6">
                {hasActiveFilters
                  ? 'Không tìm thấy tin đăng khớp bộ lọc. Thử nới rộng tiêu chí.'
                  : 'Hiện chưa có thương hiệu nào đăng tin tuyển KOL.'}
              </p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="btn-pin-secondary !rounded-full">
                  Xoá bộ lọc
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
