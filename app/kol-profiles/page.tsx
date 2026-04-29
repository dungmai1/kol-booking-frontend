'use client';

import { Header } from '@/components/header';
import { kolApi } from '@/lib/api/kol';
import { categoriesApi } from '@/lib/api/categories';
import type { KolSummaryResponse, CategoryResponse } from '@/lib/api/types';
import {
  Star, Users, TrendingUp, CheckCircle2, Eye, Filter, Search, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { KOLDetailModal } from '@/components/kol-detail-modal';

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

  // Stats
  const [stats, setStats] = useState({ total: 0, avgRating: 0 });

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  const fetchKols = useCallback(async (currentPage = 0) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await kolApi.search({
        page: currentPage,
        size: 12,
        sort: sortBy,
        ...(searchQuery && { q: searchQuery }),
        ...(selectedCategoryId && { categoryIds: [selectedCategoryId as number] }),
      });
      setKols(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      setPage(currentPage);
      if (currentPage === 0) {
        const avgRating = res.content.length > 0
          ? res.content.reduce((s, k) => s + k.avgRating, 0) / res.content.length
          : 0;
        setStats({ total: res.totalElements, avgRating });
      }
    } catch {
      setError('Không thể tải danh sách KOL. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategoryId, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchKols(0), 400);
    return () => clearTimeout(timer);
  }, [fetchKols]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách KOL</h1>
              <p className="text-gray-600">Khám phá các nhà sáng tạo nội dung trên nền tảng</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Tổng KOL</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Đánh giá TB</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgRating.toFixed(1)}★</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Kết quả tìm kiếm</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalElements}</p>
                </div>
                <Search className="w-8 h-8 text-green-600 opacity-50" />
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Trang</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{page + 1}/{Math.max(totalPages, 1)}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên KOL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="followers">Nhiều follower nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="featured">Nổi bật</option>
                <option value="price_asc">Giá thấp nhất</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Lưới
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Bảng
                </button>
              </div>

              <div className="text-sm text-gray-600 flex items-center lg:col-span-2">
                {isLoading ? 'Đang tải...' : `${totalElements} KOL`}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => fetchKols(0)} className="text-blue-600 font-medium">Thử lại</button>
            </div>
          ) : kols.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy KOL</h3>
              <p className="text-gray-600">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kols.map((kol) => (
                <div key={kol.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-28 bg-gradient-to-r from-blue-400 to-purple-500" />
                  <div className="px-6 pb-6 -mt-10 relative">
                    <div className="mb-3">
                      {kol.avatarUrl ? (
                        <img src={kol.avatarUrl} alt={kol.displayName} className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                          {kol.displayName[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{kol.displayName}</h3>
                        {(kol.city || kol.country) && (
                          <p className="text-xs text-gray-500">{[kol.city, kol.country].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500">Followers</p>
                        <p className="font-bold text-gray-900">
                          {kol.maxFollowerCount >= 1_000_000
                            ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
                            : `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-500">Đánh giá</p>
                        <p className="font-bold text-gray-900">{kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Mới'} ⭐</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded col-span-2">
                        <p className="text-gray-500">Từ</p>
                        <p className="font-bold text-gray-900">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kol.minPrice)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedKOL(kol)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hồ sơ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Địa điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Followers</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Đánh giá</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Từ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kols.map((kol) => (
                    <tr key={kol.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {kol.avatarUrl ? (
                            <img src={kol.avatarUrl} alt={kol.displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                              {kol.displayName[0]}
                            </div>
                          )}
                          <p className="font-semibold text-gray-900">{kol.displayName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{[kol.city, kol.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {kol.maxFollowerCount >= 1_000_000
                          ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
                          : `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">{kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Mới'}</span>
                          {kol.avgRating > 0 && <span className="text-yellow-400">⭐</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kol.minPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedKOL(kol)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
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

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchKols(page - 1)}
                disabled={page === 0}
                className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-700 text-sm">Trang {page + 1} / {totalPages}</span>
              <button
                onClick={() => fetchKols(page + 1)}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-200 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedKOL && (
          <KOLDetailModal
            kol={selectedKOL}
            onClose={() => setSelectedKOL(null)}
          />
        )}
      </main>
    </>
  );
}
