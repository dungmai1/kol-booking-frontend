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

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

/**
 * Booking modal — DESIGN.md `modal-card`: 32px radius, 32px padding,
 * sits on a 50%-opacity scrim with a 16px ambient shadow lifting it.
 * Inputs use the signature double-ring focus.
 */
export function BookingForm({ kol, onClose, onSuccess }: BookingFormProps) {
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(kol.minPrice ? kol.minPrice.toString() : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-canvas rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]">
        <div className="sticky top-0 bg-canvas flex items-center justify-between px-8 py-6 border-b border-hairline-soft z-10 rounded-t-[2rem]">
          <h2 className="font-display font-bold text-ink text-[22px] tracking-tight">
            Đặt lịch với {kol.displayName}
          </h2>
          <button
            onClick={onClose}
            className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {error && (
            <div className="rounded-md px-4 py-3 text-sm font-bold" style={{ background: 'var(--success-pale)', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          <section>
            <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-4">Thông tin chiến dịch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Tên chiến dịch *</label>
                <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="VD: Ra mắt bộ sưu tập mùa hè" required className="pin-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Mô tả *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chiến dịch và kỳ vọng của bạn..." required rows={4} className="pin-input" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-4">Thời gian</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  <Calendar className="w-4 h-4 inline mr-1.5" />Bắt đầu *
                </label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="pin-input" />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  <Calendar className="w-4 h-4 inline mr-1.5" />Kết thúc *
                </label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="pin-input" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-4">Ngân sách</h3>
            <label className="block text-sm font-bold text-ink mb-2">
              <DollarSign className="w-4 h-4 inline mr-1.5" />
              Tổng ngân sách (VND) *
            </label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min="1" required placeholder="10000000" className="pin-input" />
            {kol.minPrice && (
              <p className="text-xs text-mute mt-2">Gói thấp nhất: {vnd.format(kol.minPrice)}</p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-bold text-mute uppercase tracking-wider mb-4">Deliverables</h3>
            <label className="block text-sm font-bold text-ink mb-2">
              <FileText className="w-4 h-4 inline mr-1.5" />Mô tả deliverables
            </label>
            <textarea
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder='VD: [{"type":"VIDEO","platform":"TIKTOK","quantity":3}]'
              rows={3}
              className="pin-input font-mono text-sm"
            />
          </section>

          <div className="flex gap-3 pt-4 border-t border-hairline-soft">
            <button type="button" onClick={onClose} className="btn-pin-secondary !rounded-full flex-1 !py-3">
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-pin-primary !rounded-full flex-1 !py-3">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
