'use client';

import { KOL } from '@/lib/mock-data';
import { Star, MapPin, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function KOLCard({ kol }: { kol: KOL }) {
  return (
    <Link href={`/kol/${kol.id}`}>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-cyan-300 transition-all cursor-pointer h-full group">
        {/* Header with image */}
        <div className="relative h-48 bg-gradient-to-br from-cyan-400 to-teal-500 overflow-hidden">
          <img
            src={kol.avatar}
            alt={kol.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {kol.verified && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-full p-1 shadow-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-medium">
            {kol.platform}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Name and Category */}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-900">{kol.name}</h3>
            <p className="text-sm text-slate-600">@{kol.username}</p>
            <p className="text-xs text-cyan-600 font-medium mt-2">{kol.category}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-100">
              <div className="flex items-center gap-1 text-slate-600 mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-xs font-medium">Người theo dõi</span>
              </div>
              <p className="font-bold text-slate-900">
                {(kol.followers / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-3 rounded-lg border border-teal-100">
              <div className="flex items-center gap-1 text-slate-600 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-xs font-medium">Tương tác</span>
              </div>
              <p className="font-bold text-slate-900">{kol.engagementRate}%</p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-900">{kol.rating}</span>
            </div>
            <span className="text-xs text-slate-600">({kol.reviewCount})</span>
          </div>

          {/* Pricing */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-600 font-medium">Theo giờ</p>
                <p className="font-bold text-slate-900 text-sm">${kol.hourlyRate}</p>
              </div>
              <div>
                <p className="text-slate-600 font-medium">Theo tháng</p>
                <p className="font-bold text-slate-900 text-sm">${kol.monthlyRate}</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
            Xem hồ sơ
          </button>
        </div>
      </div>
    </Link>
  );
}
