'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { KOLCard } from '@/components/kol-card';
import { mockKOLs, mockCategories } from '@/lib/mock-data';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [showFilters, setShowFilters] = useState(false);

  const platforms = Array.from(new Set(mockKOLs.map(k => k.platform)));

  // Filter KOLs
  const filteredKOLs = useMemo(() => {
    return mockKOLs.filter(kol => {
      const matchesSearch =
        kol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kol.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kol.bio.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || kol.category === selectedCategory;
      const matchesPlatform = !selectedPlatform || kol.platform === selectedPlatform;
      const matchesRating = kol.rating >= minRating;
      const matchesPrice = kol.monthlyRate <= maxPrice;

      return matchesSearch && matchesCategory && matchesPlatform && matchesRating && matchesPrice;
    });
  }, [searchQuery, selectedCategory, selectedPlatform, minRating, maxPrice]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-white mb-4">Tìm KOL phù hợp với bạn</h1>
            <p className="text-blue-100 mb-8 max-w-2xl">
              Khám phá các nhà sáng tạo nội dung và KOL tài năng cho chiến dịch tiếp theo của bạn
            </p>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, tài khoản hoặc danh mục..."
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

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Bộ lọc</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả danh mục</option>
                    {mockCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Platform Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nền tảng
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tất cả nền tảng</option>
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Đánh giá tối thiểu: {minRating.toFixed(1)}⭐
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

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Giá tháng tối đa: ${maxPrice}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Clear filters */}
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedPlatform('');
                  setMinRating(0);
                  setMaxPrice(10000);
                }}
                className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {/* Results */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                KOL tìm thấy: <span className="text-blue-600">{filteredKOLs.length}</span>
              </h2>
            </div>

            {filteredKOLs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredKOLs.map(kol => (
                  <KOLCard key={kol.id} kol={kol} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 text-lg mb-2">Không tìm thấy KOL phù hợp với tiêu chí của bạn</p>
                <p className="text-gray-500">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedPlatform('');
                    setMinRating(0);
                    setMaxPrice(10000);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
