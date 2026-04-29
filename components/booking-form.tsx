'use client';

import { useState } from 'react';
import { X, Calendar, DollarSign, FileText, Loader2 } from 'lucide-react';
import { bookingsApi } from '@/lib/api/bookings';
import { ApiError } from '@/lib/api/client';
import type { KolPublicResponse, KolSummaryResponse } from '@/lib/api/types';

type KolProp = Pick<KolPublicResponse | KolSummaryResponse, 'id' | 'displayName'> & {
  minPrice?: number;
};

interface BookingFormProps {
  kol: KolProp;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingForm({ kol, onClose, onSuccess }: BookingFormProps) {
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(kol.minPrice ? kol.minPrice.toString() : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await bookingsApi.create({
        kolProfileId: kol.id,
        campaignTitle: campaignName,
        campaignBrief: description,
        deliverables,
        budget: parseFloat(budget),
        startDate,
        endDate,
      });
      onSuccess?.();
      onClose();
      alert(`Đã gửi yêu cầu đặt lịch với ${kol.displayName} thành công!`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tạo booking. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Đặt lịch với {kol.displayName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {/* Campaign Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin chiến dịch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chiến dịch *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="VD: Ra mắt bộ sưu tập mùa hè"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chiến dịch và kỳ vọng của bạn..."
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thời gian chiến dịch</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ngân sách</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Tổng ngân sách (VND) *
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1"
                required
                placeholder="10000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {kol.minPrice && (
                <p className="text-sm text-gray-600 mt-2">
                  Gói thấp nhất: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kol.minPrice)}
                </p>
              )}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm bàn giao</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Mô tả deliverables
            </label>
            <textarea
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder='VD: [{"type":"VIDEO","platform":"TIKTOK","quantity":3}]'
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
