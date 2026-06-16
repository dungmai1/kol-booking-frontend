'use client';

import { Header } from '@/components/header';
import { useEffect, useState } from 'react';
import { brandApi } from '@/lib/api/brand';
import type { BrandAnalyticsOverview, BrandSpendingPoint } from '@/lib/api/brand';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Megaphone, TrendingUp, CheckCircle2, Clock, Loader2, AlertCircle, DollarSign, Target,
} from 'lucide-react';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
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
};

export default function BrandAnalyticsPage() {
  const [overview, setOverview] = useState<BrandAnalyticsOverview | null>(null);
  const [spending, setSpending] = useState<BrandSpendingPoint[]>([]);
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      brandApi.getAnalyticsOverview(),
      brandApi.getSpendingChart(months),
    ])
      .then(([ov, ch]) => { setOverview(ov); setSpending(ch); })
      .catch(() => setError('Không thể tải dữ liệu analytics.'))
      .finally(() => setLoading(false));
  }, [months]);

  const pieData = overview
    ? Object.entries(overview.campaignsByStatus).map(([k, v]) => ({
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Analytics Chiến dịch</h1>
            <p className="text-ink/60 text-sm mt-1">Thống kê hiệu suất và chi tiêu của thương hiệu</p>
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
                icon={<DollarSign className="w-5 h-5" />}
                label="Tổng chi tiêu"
                value={vnd.format(overview.totalSpend)}
                sub={overview.pendingEscrow > 0 ? `${vnd.format(overview.pendingEscrow)} đang giữ` : undefined}
                color="blue"
              />
              <StatCard
                icon={<Megaphone className="w-5 h-5" />}
                label="Tổng chiến dịch"
                value={String(overview.totalCampaigns)}
                sub={`${overview.activeCampaigns} đang hoạt động`}
                color="purple"
              />
              <StatCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Đã hoàn thành"
                value={String(overview.completedCampaigns)}
                color="green"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="Chi tiêu TB / Campaign"
                value={vnd.format(overview.avgBudget)}
                color="amber"
              />
            </div>

            {/* Spending area chart */}
            <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
              <h2 className="text-base font-black text-ink mb-5">Chi tiêu theo tháng</h2>
              {spending.every((p) => p.spend === 0) ? (
                <EmptyChart message="Chưa có chiến dịch nào hoàn thành trong khoảng thời gian này" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={spending} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                      formatter={(v: number) => [vnd.format(v), 'Chi tiêu']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#spendGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Bottom row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Campaign count bar */}
              <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
                <h2 className="text-base font-black text-ink mb-5">Số chiến dịch theo tháng</h2>
                {spending.every((p) => p.campaigns === 0) ? (
                  <EmptyChart message="Chưa có chiến dịch nào" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={spending} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(v: number) => [v, 'Chiến dịch']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      />
                      <Bar dataKey="campaigns" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              {/* Campaign status pie */}
              <section className="bg-surface-card rounded-2xl border border-ink/10 p-6">
                <h2 className="text-base font-black text-ink mb-5">Trạng thái chiến dịch</h2>
                {pieData.length === 0 ? (
                  <EmptyChart message="Chưa có chiến dịch nào" />
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
                          formatter={(v: number) => [v, 'Chiến dịch']}
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
