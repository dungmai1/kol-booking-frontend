'use client';

import { Star, Users, DollarSign, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { KolSummaryResponse } from '@/lib/api/types';

export function KOLCard({ kol }: { kol: KolSummaryResponse }) {
  const formattedFollowers =
    kol.maxFollowerCount >= 1_000_000
      ? `${(kol.maxFollowerCount / 1_000_000).toFixed(1)}M`
      : `${(kol.maxFollowerCount / 1_000).toFixed(0)}K`;

  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(kol.minPrice);

  return (
    <Link href={`/kol/${kol.slug}`}>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-cyan-300 transition-all cursor-pointer h-full group">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-br from-cyan-400 to-teal-500 overflow-hidden">
          {kol.avatarUrl ? (
            <img
              src={kol.avatarUrl}
              alt={kol.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-6xl font-bold opacity-50">
                {kol.displayName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-900">{kol.displayName}</h3>
            {(kol.city || kol.country) && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {[kol.city, kol.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-100">
              <div className="flex items-center gap-1 text-slate-600 mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-xs font-medium">Người theo dõi</span>
              </div>
              <p className="font-bold text-slate-900">{formattedFollowers}</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-100">
              <div className="flex items-center gap-1 text-slate-600 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-xs font-medium">Từ</span>
              </div>
              <p className="font-bold text-slate-900 text-xs">{formattedPrice}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-900">
              {kol.avgRating > 0 ? kol.avgRating.toFixed(1) : 'Mới'}
            </span>
            <span className="text-xs text-slate-600">({kol.reviewCount} đánh giá)</span>
          </div>

          <button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
            Xem hồ sơ
          </button>
        </div>
      </div>
    </Link>
  );
}
