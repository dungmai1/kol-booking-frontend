'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Header } from '@/components/header';
import { KolSearchCard } from '@/components/kol-search-card';
import { PaginationBar } from '@/components/pagination-bar';
import { useAuth } from '@/contexts/AuthContext';
import { kolApi } from '@/lib/api/kol';
import { categoriesApi } from '@/lib/api/categories';
import type {
  CategoryResponse,
  Gender,
  KolSearchParams,
  KolSummaryResponse,
  PageResponse,
  Platform,
} from '@/lib/api/types';

const PLATFORMS: Platform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];
const PLATFORM_LABEL: Record<Platform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

type SortValue = NonNullable<KolSearchParams['sort']>;

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'newest', label: 'Mới nhất' },
];

const PAGE_SIZE = 20;

interface FilterState {
  q: string;
  categoryIds: number[];
  platforms: Platform[];
  minPrice: number | '';
  maxPrice: number | '';
  minFollower: number | '';
  maxFollower: number | '';
  gender: Gender | '';
  minRating: number;
  sort: SortValue;
}

const EMPTY_FILTERS: FilterState = {
  q: '',
  categoryIds: [],
  platforms: [],
  minPrice: '',
  maxPrice: '',
  minFollower: '',
  maxFollower: '',
  gender: '',
  minRating: 0,
  sort: 'featured',
};

export default function KolsSearchPage() {
  const { user, isAuthenticated } = useAuth();
  const canFavorite = isAuthenticated && user?.role === 'BRAND';

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<KolSummaryResponse> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load categories once
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  // Build search params from current filter state
  const searchParams: KolSearchParams = useMemo(() => {
    const p: KolSearchParams = {
      page,
      size: PAGE_SIZE,
      sort: filters.sort,
    };
    if (filters.q.trim()) p.q = filters.q.trim();
    if (filters.categoryIds.length) p.categoryIds = filters.categoryIds;
    if (filters.platforms.length) p.platforms = filters.platforms;
    if (filters.minPrice !== '') p.minPrice = Number(filters.minPrice);
    if (filters.maxPrice !== '') p.maxPrice = Number(filters.maxPrice);
    if (filters.minFollower !== '') p.minFollower = Number(filters.minFollower);
    if (filters.maxFollower !== '') p.maxFollower = Number(filters.maxFollower);
    if (filters.gender) p.gender = filters.gender;
    if (filters.minRating > 0) p.minRating = filters.minRating;
    return p;
  }, [filters, page]);

  // Fetch on filter/page change (debounced for free-text search)
  const fetchKols = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await kolApi.search(searchParams);
      setData(res);
    } catch {
      setError('Không thể tải danh sách KOL. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(fetchKols, 300);
    return () => clearTimeout(t);
  }, [fetchKols]);

  // When non-page filters change, jump back to page 0
  useEffect(() => {
    setPage(0);
  }, [
    filters.q,
    filters.categoryIds,
    filters.platforms,
    filters.minPrice,
    filters.maxPrice,
    filters.minFollower,
    filters.maxFollower,
    filters.gender,
    filters.minRating,
    filters.sort,
  ]);

  function patch<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function toggleCategory(id: number) {
    setFilters((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((x) => x !== id)
        : [...f.categoryIds, id],
    }));
  }

  function togglePlatform(p: Platform) {
    setFilters((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  const activeFilterCount =
    filters.categoryIds.length +
    filters.platforms.length +
    (filters.minPrice !== '' || filters.maxPrice !== '' ? 1 : 0) +
    (filters.minFollower !== '' || filters.maxFollower !== '' ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const kols = data?.content ?? [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 pt-6 pb-16">
          {/* Page header — search bar + title */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mute pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm KOL theo tên, slug…"
                value={filters.q}
                onChange={(e) => patch('q', e.target.value)}
                className="pin-search h-12"
                aria-label="Tìm KOL"
              />
            </div>
          </div>

          <div className="flex gap-6">
            {/* ─── Sidebar (desktop) ─── */}
            <aside className="hidden lg:block w-72 shrink-0">
              <FilterPanel
                filters={filters}
                categories={categories}
                onPatch={patch}
                onToggleCategory={toggleCategory}
                onTogglePlatform={togglePlatform}
                onReset={resetFilters}
                activeFilterCount={activeFilterCount}
              />
            </aside>

            {/* ─── Main content ─── */}
            <section className="flex-1 min-w-0">
              {/* Toolbar — count + sort + mobile filter trigger */}
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h1 className="font-display font-bold text-ink text-[20px] lg:text-[22px] tracking-tight">
                  {isLoading ? (
                    'Đang tìm…'
                  ) : (
                    <>
                      <span className="text-pin-red">{totalElements}</span> KOL phù hợp
                      {filters.q && (
                        <span className="text-mute font-normal text-[15px]">
                          {' '}
                          với "{filters.q}"
                        </span>
                      )}
                    </>
                  )}
                </h1>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden inline-flex items-center gap-2 bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold hover:bg-secondary-bg transition-colors"
                    aria-label="Mở bộ lọc"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Bộ lọc
                    {activeFilterCount > 0 && (
                      <span className="grid place-items-center min-w-[20px] h-5 px-1 rounded-full bg-pin-red text-on-dark text-[10px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <label className="sr-only" htmlFor="sort-select">
                    Sắp xếp
                  </label>
                  <select
                    id="sort-select"
                    value={filters.sort}
                    onChange={(e) => patch('sort', e.target.value as SortValue)}
                    className="bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-focus-outer cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results region */}
              {isLoading ? (
                <ResultsSkeleton />
              ) : error ? (
                <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
                  <p className="text-pin-red text-base font-bold mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={fetchKols}
                    className="btn-pin-secondary !rounded-full"
                  >
                    Thử lại
                  </button>
                </div>
              ) : kols.length === 0 ? (
                <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
                  <p className="text-ink text-lg font-bold mb-2">
                    Không tìm thấy KOL phù hợp
                  </p>
                  <p className="text-mute mb-6">
                    Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn-pin-primary !rounded-full"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {kols.map((kol) => (
                      <KolSearchCard
                        key={kol.id}
                        kol={kol}
                        canFavorite={canFavorite}
                      />
                    ))}
                  </div>
                  <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    onPage={(p) => {
                      setPage(p);
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  />
                </>
              )}
            </section>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="absolute inset-y-0 right-0 w-[88%] max-w-sm bg-canvas overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 bg-canvas border-b border-hairline px-4 py-3 flex items-center justify-between">
                <h2 className="font-display font-bold text-ink text-lg">Bộ lọc</h2>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="grid place-items-center w-9 h-9 rounded-full hover:bg-surface-card transition-colors"
                  aria-label="Đóng bộ lọc"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <FilterPanel
                  filters={filters}
                  categories={categories}
                  onPatch={patch}
                  onToggleCategory={toggleCategory}
                  onTogglePlatform={togglePlatform}
                  onReset={resetFilters}
                  activeFilterCount={activeFilterCount}
                />
              </div>
              <div className="sticky bottom-0 bg-canvas border-t border-hairline p-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="w-full btn-pin-primary !rounded-full"
                >
                  Áp dụng ({totalElements} KOL)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ───────────────────────────── Filter Panel ───────────────────────────── */

interface FilterPanelProps {
  filters: FilterState;
  categories: CategoryResponse[];
  onPatch: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onToggleCategory: (id: number) => void;
  onTogglePlatform: (p: Platform) => void;
  onReset: () => void;
  activeFilterCount: number;
}

function FilterPanel({
  filters,
  categories,
  onPatch,
  onToggleCategory,
  onTogglePlatform,
  onReset,
  activeFilterCount,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="hidden lg:block font-display font-bold text-ink text-lg">
          Bộ lọc
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-pin-red hover:underline"
          >
            Xóa tất cả ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Categories */}
      <FilterSection title="Danh mục">
        {categories.length === 0 ? (
          <p className="text-xs text-mute">Đang tải…</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map((c) => (
              <CheckboxRow
                key={c.id}
                label={c.name}
                checked={filters.categoryIds.includes(c.id)}
                onChange={() => onToggleCategory(c.id)}
              />
            ))}
          </div>
        )}
      </FilterSection>

      {/* Platforms */}
      <FilterSection title="Nền tảng">
        <div className="space-y-2">
          {PLATFORMS.map((p) => (
            <CheckboxRow
              key={p}
              label={PLATFORM_LABEL[p]}
              checked={filters.platforms.includes(p)}
              onChange={() => onTogglePlatform(p)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Price range (VND) */}
      <FilterSection title="Khoảng giá (VND)">
        <RangeRow
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          minPlaceholder="Tối thiểu"
          maxPlaceholder="Tối đa"
          onMinChange={(v) => onPatch('minPrice', v)}
          onMaxChange={(v) => onPatch('maxPrice', v)}
        />
      </FilterSection>

      {/* Follower range */}
      <FilterSection title="Số follower">
        <RangeRow
          minValue={filters.minFollower}
          maxValue={filters.maxFollower}
          minPlaceholder="Tối thiểu"
          maxPlaceholder="Tối đa"
          onMinChange={(v) => onPatch('minFollower', v)}
          onMaxChange={(v) => onPatch('maxFollower', v)}
        />
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Giới tính">
        <div className="flex flex-wrap gap-2">
          <ChipButton
            active={filters.gender === ''}
            onClick={() => onPatch('gender', '')}
          >
            Tất cả
          </ChipButton>
          {GENDERS.map((g) => (
            <ChipButton
              key={g.value}
              active={filters.gender === g.value}
              onClick={() =>
                onPatch('gender', filters.gender === g.value ? '' : g.value)
              }
            >
              {g.label}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      {/* Min rating */}
      <FilterSection title="Đánh giá tối thiểu">
        <div className="flex flex-wrap gap-2">
          <ChipButton
            active={filters.minRating === 0}
            onClick={() => onPatch('minRating', 0)}
          >
            Tất cả
          </ChipButton>
          {[5, 4, 3, 2, 1].map((r) => (
            <ChipButton
              key={r}
              active={filters.minRating === r}
              onClick={() =>
                onPatch('minRating', filters.minRating === r ? 0 : r)
              }
            >
              {r}★ trở lên
            </ChipButton>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink mb-3">{title}</h3>
      {children}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <span
        className={`grid place-items-center w-5 h-5 rounded border-2 transition-colors ${
          checked
            ? 'bg-ink border-ink text-on-dark'
            : 'border-hairline group-hover:border-mute bg-canvas'
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

function RangeRow({
  minValue,
  maxValue,
  minPlaceholder,
  maxPlaceholder,
  onMinChange,
  onMaxChange,
}: {
  minValue: number | '';
  maxValue: number | '';
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (v: number | '') => void;
  onMaxChange: (v: number | '') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={minPlaceholder}
        value={minValue}
        onChange={(e) => onMinChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="pin-input w-full h-10 text-sm"
      />
      <span className="text-mute text-sm shrink-0">–</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={maxPlaceholder}
        value={maxValue}
        onChange={(e) => onMaxChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="pin-input w-full h-10 text-sm"
      />
    </div>
  );
}

function ChipButton({
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
      type="button"
      onClick={onClick}
      className={`pin-chip text-xs ${active ? 'pin-chip-active' : ''}`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────── Skeleton ───────────────────────────── */

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[4/5] rounded-md bg-surface-card animate-pulse" />
          <div className="px-1 pt-2 pb-3 space-y-1.5">
            <div className="h-3.5 bg-surface-card rounded animate-pulse w-3/4" />
            <div className="h-3 bg-surface-card rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
