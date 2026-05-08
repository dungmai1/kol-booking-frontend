'use client';

import { Header } from '@/components/header';
import { kolApi } from '@/lib/api/kol';
import { categoriesApi } from '@/lib/api/categories';
import type { KolSummaryResponse, CategoryResponse } from '@/lib/api/types';
import { Search, Loader2, ChevronLeft, ChevronRight, Eye, Star } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { KOLDetailModal } from '@/components/kol-detail-modal';
import { KOLCard } from '@/components/kol-card';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function KOLProfilesPage() {
  const [kols, setKols] = useState<KolSummaryResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'followers' | 'price_asc'>('followers');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedKOL, setSelectedKOL] = useState<KolSummaryResponse | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  const fetchKols = useCallback(async (currentPage = 0) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await kolApi.search({
        page: currentPage,
        size: 24,
        sort: sortBy,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategoryId && { categoryIds: [selectedCategoryId as number] }),
      });
      setKols(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      setPage(currentPage);
    } catch {
      setError('Không thể tải danh sách KOL. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategoryId, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchKols(0), 350);
    return () => clearTimeout(timer);
  }, [fetchKols]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-4">
          <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">Hồ sơ KOL</h1>
          <p className="text-mute mt-2 max-w-xl">Khám phá đầy đủ các nhà sáng tạo nội dung trên nền tảng — duyệt theo lưới hoặc bảng.</p>
        </div>

        {/* Sticky filter strip */}
        <div className="sticky top-16 z-40 bg-surface-soft/95 backdrop-blur border-b border-hairline">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo tên KOL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pin-search h-11 !pl-10 !py-2 text-sm"
              />
            </div>

            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-focus-outer cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-focus-outer cursor-pointer"
            >
              <option value="followers">Nhiều follower</option>
              <option value="rating">Đánh giá cao</option>
              <option value="featured">Nổi bật</option>
              <option value="price_asc">Giá thấp</option>
            </select>

            <div className="inline-flex bg-surface-card rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${viewMode === 'grid' ? 'bg-ink text-on-dark' : 'text-ink hover:bg-secondary-bg'}`}
              >
                Lưới
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${viewMode === 'table' ? 'bg-ink text-on-dark' : 'text-ink hover:bg-secondary-bg'}`}
              >
                Bảng
              </button>
            </div>

            <span className="text-sm font-bold text-mute ml-auto">
              {isLoading ? 'Đang tải…' : `${totalElements} KOL`}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-3 sm:px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-pin-red animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-pin-red font-bold mb-4">{error}</p>
              <button onClick={() => fetchKols(0)} className="btn-pin-secondary !rounded-full">Thử lại</button>
            </div>
          ) : kols.length === 0 ? (
            <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
              <p className="text-ink font-bold mb-2">Không tìm thấy KOL</p>
              <p className="text-mute">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="pin-masonry">
              {kols.map((kol) => (
                <KOLCard key={kol.id} kol={kol} />
              ))}
            </div>
          ) : (
            <div className="bg-canvas rounded-md border border-hairline overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-card">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Hồ sơ</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Địa điểm</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Followers</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Đánh giá</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-mute uppercase tracking-wider">Từ</th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold text-mute uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {kols.map((kol) => (
                    <tr key={kol.id} className="border-t border-hairline-soft hover:bg-surface-soft transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {kol.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={kol.avatarUrl} alt={kol.displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="grid place-items-center w-10 h-10 rounded-full bg-ink text-on-dark font-bold text-sm">
                              {kol.displayName[0]}
                            </div>
                          )}
                          <p className="font-bold text-ink text-sm">{kol.displayName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-mute">{[kol.city, kol.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-ink">
                        {kol.maxFollowerCount >= 1_000_000
                          ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
                          : `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-ink text-ink" />
                          <span className="text-sm font-bold text-ink">{kol.avgRating > 0 ? kol.avgRating.toFixed(1) : '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-ink">{vnd.format(kol.minPrice)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedKOL(kol)}
                          className="grid place-items-center w-9 h-9 rounded-full bg-surface-card text-ink hover:bg-secondary-bg transition-colors ml-auto"
                          title="Xem hồ sơ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button onClick={() => fetchKols(page - 1)} disabled={page === 0}
                className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold text-ink">Trang {page + 1} / {totalPages}</span>
              <button onClick={() => fetchKols(page + 1)} disabled={page >= totalPages - 1}
                className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {selectedKOL && (
          <KOLDetailModal kol={selectedKOL} onClose={() => setSelectedKOL(null)} />
        )}
      </main>
    </>
  );
}
