'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { KOLCard } from '@/components/kol-card';
import { kolApi } from '@/lib/api/kol';
import { categoriesApi } from '@/lib/api/categories';
import type { KolSummaryResponse, CategoryResponse, Platform, Gender } from '@/lib/api/types';
import { Search, Filter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const PLATFORMS: Platform[] = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'FACEBOOK'];

export default function DiscoverPage() {
  const [kols, setKols] = useState<KolSummaryResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<'featured' | 'rating' | 'price_asc' | 'price_desc' | 'followers'>('featured');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Load categories once
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  const fetchKols = useCallback(async (currentPage = 0) => {
    setIsLoading(true);
    setError('');
    try {
      const params: Parameters<typeof kolApi.search>[0] = {
        page: currentPage,
        size: 12,
        sort,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategoryId && { categoryIds: [selectedCategoryId as number] }),
        ...(selectedPlatform && { platforms: [selectedPlatform] }),
        ...(minRating > 0 && { minRating }),
        ...(maxPrice !== '' && { maxPrice: maxPrice as number }),
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
  }, [searchQuery, selectedCategoryId, selectedPlatform, minRating, maxPrice, sort]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => fetchKols(0), 400);
    return () => clearTimeout(timer);
  }, [fetchKols]);

  function clearFilters() {
    setSelectedCategoryId('');
    setSelectedPlatform('');
    setMinRating(0);
    setMaxPrice('');
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white mb-4">Tìm KOL phù hợp với bạn</h1>
            <p className="text-blue-100 mb-8 max-w-2xl">
              Khám phá các nhà sáng tạo nội dung và KOL tài năng cho chiến dịch tiếp theo của bạn
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên KOL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Bộ lọc</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Danh mục</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nền tảng</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as Platform | '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả nền tảng</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Đánh giá tối thiểu: {minRating > 0 ? `${minRating}★` : 'Tất cả'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Giá tối đa (VND)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Không giới hạn"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort + Clear */}
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="featured">Nổi bật</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="price_asc">Giá thấp → cao</option>
                    <option value="price_desc">Giá cao → thấp</option>
                    <option value="followers">Nhiều follower</option>
                  </select>
                </div>
                <button onClick={clearFilters} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Xóa tất cả bộ lọc
                </button>
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? 'Đang tìm kiếm...' : (
                <>KOL tìm thấy: <span className="text-blue-600">{totalElements}</span></>
              )}
            </h2>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg border border-red-200 p-12 text-center">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={() => fetchKols(0)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Thử lại
              </button>
            </div>
          ) : kols.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kols.map((kol) => (
                  <KOLCard key={kol.id} kol={kol} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => fetchKols(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageNum = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchKols(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 hover:border-blue-400 text-gray-700'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => fetchKols(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">Không tìm thấy KOL phù hợp</p>
              <p className="text-gray-500 mb-4">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              <button
                onClick={() => { clearFilters(); setSearchQuery(''); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đặt lại tất cả
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
