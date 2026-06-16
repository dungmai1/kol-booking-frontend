'use client';

import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import { kolApi } from '@/lib/api/kol';
import type { KolAnalyticsOverview, KolEarningsPoint } from '@/lib/api/kol';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Wallet, TrendingUp, BookOpen, Star, CheckCircle2, Clock,
  XCircle, Loader2, AlertCircle, Award,
} from 'lucide-react';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const shortVnd = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#22c55e',
  ACCEPTED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  DELIVERED: '#f59e0b',
  PENDING: '#94a3b8',
  CANCELLED: '#ef4444',
  DISPUTED: '#f97316',
  REJECTED: '#dc2626',
  DELIVERY_REJECTED: '#b91c1c',
  CANCELLED_BY_ADMIN: '#991b1b',
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  ACCEPTED: 'Đã chấp nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã bàn giao',
  PENDING: 'Chờ duyệt',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Tranh chấp',
  REJECTED: 'Đã từ chối',
  DELIVERY_REJECTED: 'Từ chối nội dung',
  CANCELLED_BY_ADMIN: 'Admin hủy',
};

export default function KolAnalyticsPage() {
  const [overview, setOverview] = useState<KolAnalyticsOverview | null>(null);
  const [earnings, setEarnings] = useState<KolEarningsPoint[]>([]);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      kolApi.getAnalyticsOverview(),
      kolApi.getEarningsChart(months),
    ])
      .then(([ov, ch]) => { setOverview(ov); setEarnings(ch); })
      .catch(() => setError('Không thể tải dữ liệu analytics.'))
      .finally(() => setLoading(false));
  }, [months]);

  const pieData = overview
    ? Object.entries(overview.bookingsByStatus).map(([k, v]) => ({
        name: STATUS_LABEL[k] ?? k,
        value: v,
        color: STATUS_COLORS[k] ?? '#94a3b8',
        key: k,
      }))
    : [];

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Analytics</h1>
            <p className="text-ink/60 text-sm mt-1">Thống kê hiệu suất và doanh thu của bạn</p>
          </div>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="border border-ink/20 rounded-xl px-3 py-2 text-sm font-semibold bg-surface-card focus:outline-none focus:ring-2 focus:ring-ink/20"
          >
            <option value={3}>3 tháng</option>
            <option value={6}>6 tháng</option>
            <option value={12}>12 tháng</option>
            <option value={24}>24 tháng</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-ink/40" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {!loading && !error && overview && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Wallet className="w-5 h-5" />}
                label="Số dư khả dụng"
                value={vnd.format(overview.availableBalance)}
                sub={overview.pendingBalance > 0 ? `${vnd.format(overview.pendingBalance)} đang giữ` : undefined}
                color="green"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Tổng thu nhập"
                value={vnd.format(overview.totalEarned)}
                color="blue"
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="Tổng booking"
                value={String(overview.totalBookings)}
                sub={`${pct(overview.completionRate)} hoàn thành`}
                color="purple"
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                label="Đánh giá TB"
                value={overview.avgRating != null ? overview.avgRating.toFixed(1) : '—'}
                sub={`${overview.reviewCount} lượt đánh giá`}
                color="amber"
              />
            </div>

            {/* Earnings area chart */}
            <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
              <h2 className="text-base font-black text-ink mb-5">Thu nhập theo tháng</h2>
              {earnings.every((p) => p.amount === 0) ? (
                <EmptyChart message="Chưa có thu nhập trong khoảng thời gian này" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={earnings} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={shortVnd}
                    />
                    <Tooltip
                      formatter={(v: number) => [vnd.format(v), 'Thu nhập']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#earningsGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#22c55e' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Bottom row: Booking count bar + Pie */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly booking count bar chart */}
              <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
                <h2 className="text-base font-black text-ink mb-5">Số booking theo tháng</h2>
                {earnings.every((p) => p.bookings === 0) ? (
                  <EmptyChart message="Chưa có booking hoàn thành" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={earnings} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(v: number) => [v, 'Booking']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              {/* Booking status pie */}
              <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
                <h2 className="text-base font-black text-ink mb-5">Trạng thái booking</h2>
                {pieData.length === 0 ? (
                  <EmptyChart message="Chưa có booking nào" />
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={80}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [v, 'Booking']}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="flex-1 space-y-2">
                      {pieData.map((d) => (
                        <li key={d.key} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-ink/70 flex-1">{d.name}</span>
                          <span className="font-black text-ink">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            {/* Completion rate progress */}
            <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-ink">Tỷ lệ hoàn thành</h2>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-ink">{pct(overview.completionRate)}</span>
                </div>
              </div>
              <div className="w-full bg-ink/10 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
                  style={{ width: pct(overview.completionRate) }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-ink/50">
                <span>0%</span>
                <span>
                  {overview.bookingsByStatus['COMPLETED'] ?? 0} / {overview.totalBookings} booking hoàn thành
                </span>
                <span>100%</span>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: 'green' | 'blue' | 'purple' | 'amber';
}) {
  const colorMap = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-surface-card rounded-2xl border border-ink/10 p-5 space-y-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-xs text-ink/50 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-xl font-black text-ink mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-ink/50 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[180px] text-ink/40 text-sm">{message}</div>
  );
}
