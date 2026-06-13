'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { KOLCard } from '@/components/kol-card';
import { kolApi } from '@/lib/api/kol';
import { categoriesApi } from '@/lib/api/categories';
import type { KolSummaryResponse, CategoryResponse, Platform } from '@/lib/api/types';
import { Search, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';

const PLATFORMS: Platform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];

const SORT_VALUES = ['featured', 'rating', 'price_asc', 'price_desc', 'followers'] as const;
type SortValue = (typeof SORT_VALUES)[number];

function parseSort(param: string | null): SortValue {
  if (param && (SORT_VALUES as readonly string[]).includes(param)) {
    return param as SortValue;
  }
  return 'featured';
}

function DiscoverFallback() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
        </div>
      </main>
    </>
  );
}

/**
 * Discover — Pinterest search-results page (DESIGN.md §Layout):
 *   • Compact filter-chip strip at the top (no hero, no big banner)
 *   • Masonry pin grid with 8px gutters and mixed aspect ratios
 *   • Inverted chip = active filter
 */
function DiscoverPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = parseSort(searchParams.get('sort'));

  const [kols, setKols] = useState<KolSummaryResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('');
  const [minRating, setMinRating] = useState(0);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  // Pull ?q= and ?categoryId= from URL (e.g. homepage category tiles)
  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
    const catId = searchParams.get('categoryId');
    if (catId) {
      const parsed = parseInt(catId, 10);
      if (!isNaN(parsed)) setSelectedCategoryId(parsed);
    }
  }, [searchParams]);

  useEffect(() => {
    setKols([]);
    setIsLoading(true);
    setPage(0);
  }, [sort]);

  function handleSortChange(next: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'featured') params.delete('sort');
    else params.set('sort', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const fetchKols = useCallback(async (currentPage = 0) => {
    setIsLoading(true);
    setError('');
    try {
      const params: Parameters<typeof kolApi.search>[0] = {
        page: currentPage,
        size: 24,
        sort,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategoryId && { categoryIds: [selectedCategoryId as number] }),
        ...(selectedPlatform && { platforms: [selectedPlatform] }),
        ...(minRating > 0 && { minRating }),
      };
      const res = await kolApi.search(params);
      setKols(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      setPage(currentPage);
    } catch {
      setError('Không thể tải danh sách KOL. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategoryId, selectedPlatform, minRating, sort]);

  useEffect(() => {
    const timer = setTimeout(() => fetchKols(0), 350);
    return () => clearTimeout(timer);
  }, [fetchKols]);

  const hasActiveFilters = !!selectedCategoryId || !!selectedPlatform || minRating > 0;

  function clearFilters() {
    setSelectedCategoryId('');
    setSelectedPlatform('');
    setMinRating(0);
  }

  function resetAll() {
    clearFilters();
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-3 sm:px-6 pt-6">
          {/* Inline page search (mobile-first) */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mute pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo tên, danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pin-search h-12"
              />
            </div>
          </div>

          {/* Filter-chip strip — horizontally scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Category chip group */}
            <Chip
              active={selectedCategoryId === ''}
              onClick={() => setSelectedCategoryId('')}
            >
              Tất cả
            </Chip>
            {categories.slice(0, 12).map((cat) => (
              <Chip
                key={cat.id}
                active={selectedCategoryId === cat.id}
                onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? '' : cat.id)}
              >
                {cat.name}
              </Chip>
            ))}

            {/* Visual separator */}
            <span className="mx-1 h-6 w-px bg-hairline shrink-0" aria-hidden />

            {/* Platform chip group */}
            {PLATFORMS.map((p) => (
              <Chip
                key={p}
                active={selectedPlatform === p}
                onClick={() => setSelectedPlatform(selectedPlatform === p ? '' : p)}
              >
                {p[0] + p.slice(1).toLowerCase()}
              </Chip>
            ))}
          </div>

          {/* Result count + sort */}
          <div className="flex items-center justify-between gap-4 pt-4 pb-2 flex-wrap">
            <h1 className="font-display font-bold text-ink text-[20px] lg:text-[22px] tracking-tight">
              {isLoading ? 'Đang tìm…' : (
                <>
                  <span className="text-pin-red">{totalElements}</span> KOL phù hợp
                  {searchQuery && <span className="text-mute font-normal text-[16px]"> với "{searchQuery}"</span>}
                </>
              )}
            </h1>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:text-pin-red transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                </button>
              )}
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortValue)}
                className="bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-focus-outer cursor-pointer"
              >
                <option value="featured">Nổi bật</option>
                <option value="rating">Đánh giá cao</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="price_desc">Giá cao → thấp</option>
                <option value="followers">Nhiều follower</option>
              </select>
            </div>
          </div>
        </div>

        {/* Masonry grid */}
        <div className="mx-auto max-w-[1280px] px-3 sm:px-6 pb-16">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-pin-red text-base font-bold mb-4">{error}</p>
              <button onClick={() => fetchKols(0)} className="btn-pin-secondary !rounded-full">
                Thử lại
              </button>
            </div>
          ) : kols.length === 0 ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-ink text-lg font-bold mb-2">Không tìm thấy KOL phù hợp</p>
              <p className="text-mute mb-6">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm</p>
              <button onClick={resetAll} className="btn-pin-primary !rounded-full">
                Đặt lại tất cả
              </button>
            </div>
          ) : (
            <>
              <div className="pin-masonry">
                {kols.map((kol) => (
                  <KOLCard key={kol.id} kol={kol} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPage={fetchKols} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverFallback />}>
      <DiscoverPageContent />
    </Suspense>
  );
}

/* ────────────────────────── Chip / Pagination ────────────────────────── */

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pin-chip shrink-0 ${active ? 'pin-chip-active' : ''}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const visible = Math.min(totalPages, 7);
  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      {Array.from({ length: visible }, (_, i) => {
        const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
        const isActive = pageNum === page;
        return (
          <button
            key={pageNum}
            onClick={() => onPage(pageNum)}
            className={`grid place-items-center w-10 h-10 rounded-full text-sm font-bold transition-colors ${
              isActive
                ? 'bg-ink text-on-dark'
                : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
          >
            {pageNum + 1}
          </button>
        );
      })}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
        className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang sau"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
