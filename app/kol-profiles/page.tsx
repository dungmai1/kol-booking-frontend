'use client';

import { Header } from '@/components/header';
import { mockKOLs, KOL } from '@/lib/mock-data';
import {
  Star,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { useState } from 'react';
import { KOLDetailModal } from '@/components/kol-detail-modal';

const statusLabels: Record<string, string> = {
  all: 'Tất cả trạng thái',
  active: 'Đang hoạt động',
  inactive: 'Không hoạt động',
  on_holiday: 'Đang nghỉ',
};

export default function KOLProfilesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('followers');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedKOL, setSelectedKOL] = useState<KOL | null>(null);

  // Get unique categories
  const categories = ['all', ...new Set(mockKOLs.map(k => k.category))];
  const statuses = ['all', 'active', 'inactive', 'on_holiday'];

  // Filter KOLs
  const filteredKOLs = mockKOLs
    .filter(kol => {
      const matchesSearch = kol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           kol.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           kol.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || kol.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || kol.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'followers') return b.followers - a.followers;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'engagement') return b.engagementRate - a.engagementRate;
      if (sortBy === 'campaigns') return b.previousCampaigns - a.previousCampaigns;
      return 0;
    });

  const totalKOLs = mockKOLs.length;
  const activeKOLs = mockKOLs.filter(k => k.status === 'active').length;
  const verifiedKOLs = mockKOLs.filter(k => k.verified).length;
  const avgRating = (mockKOLs.reduce((sum, k) => sum + k.rating, 0) / mockKOLs.length).toFixed(2);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý hồ sơ KOL</h1>
              <p className="text-gray-600">Quản lý và xem toàn bộ nhà sáng tạo nội dung trên nền tảng</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Tổng KOL</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalKOLs}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeKOLs}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Đã xác minh</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{verifiedKOLs}</p>
                  </div>
                  <Star className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Đánh giá TB</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{avgRating}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, tài khoản hoặc mô tả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'Tất cả danh mục' : cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {statusLabels[status] ?? status}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="followers">Sắp xếp theo người theo dõi</option>
                  <option value="rating">Sắp xếp theo đánh giá</option>
                  <option value="engagement">Sắp xếp theo tương tác</option>
                  <option value="campaigns">Sắp xếp theo chiến dịch</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lưới
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bảng
                  </button>
                </div>

                <div className="text-sm text-gray-600 flex items-center justify-end">
                  {filteredKOLs.length} KOL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredKOLs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy KOL</h3>
              <p className="text-gray-600">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKOLs.map(kol => (
                <div key={kol.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Header Image */}
                  <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>

                  {/* Content */}
                  <div className="px-6 pb-6 -mt-12 relative z-10">
                    {/* Avatar */}
                    <div className="mb-4">
                      <img
                        src={kol.avatar}
                        alt={kol.name}
                        className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
                      />
                    </div>

                    {/* Name & Verification */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{kol.name}</h3>
                        <p className="text-sm text-gray-600">{kol.username}</p>
                      </div>
                      {kol.verified && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        kol.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : kol.status === 'on_holiday'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {statusLabels[kol.status] ?? kol.status}
                      </span>
                    </div>

                    {/* Category & Platform */}
                    <p className="text-sm text-gray-600 mb-3">{kol.category} • {kol.platform}</p>

                    {/* Bio */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{kol.bio}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Người theo dõi</p>
                        <p className="font-bold text-gray-900">{(kol.followers / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Tương tác</p>
                        <p className="font-bold text-gray-900">{kol.engagementRate}%</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Đánh giá</p>
                        <p className="font-bold text-gray-900">{kol.rating.toFixed(1)} ⭐</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Chiến dịch</p>
                        <p className="font-bold text-gray-900">{kol.previousCampaigns}</p>
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Giờ: <span className="font-bold text-gray-900">${kol.hourlyRate}</span></span>
                        <span className="text-gray-600">Tháng: <span className="font-bold text-gray-900">${kol.monthlyRate}</span></span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedKOL(kol)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        Xem hồ sơ
                      </button>
                      <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Table View
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hồ sơ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Người theo dõi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tương tác</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Đánh giá</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Giá theo giờ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredKOLs.map(kol => (
                    <tr key={kol.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={kol.avatar}
                            alt={kol.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{kol.name}</p>
                            <p className="text-sm text-gray-600">{kol.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{kol.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{(kol.followers / 1000).toFixed(0)}K</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{kol.engagementRate}%</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">{kol.rating.toFixed(1)}</span>
                          <span className="text-yellow-400">⭐</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          kol.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : kol.status === 'on_holiday'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {statusLabels[kol.status] ?? kol.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">${kol.hourlyRate}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedKOL(kol)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Xem hồ sơ">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" title="Chỉnh sửa">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* KOL Detail Modal */}
        {selectedKOL && (
          <KOLDetailModal
            kol={selectedKOL}
            onClose={() => setSelectedKOL(null)}
            onBook={() => {
              alert(`Đã mở yêu cầu đặt lịch với ${selectedKOL.name}!`);
              setSelectedKOL(null);
            }}
          />
        )}
      </main>
    </>
  );
}
