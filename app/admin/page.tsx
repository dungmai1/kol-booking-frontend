'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Building2,
  Briefcase,
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CalendarRange,
  ArrowUpRight,
  Star,
  Trophy,
  Lock,
  Clock,
  RotateCcw,
  Ban,
  AlertTriangle,
  UserCog,
  Store,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
} from 'recharts';

import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type {
  AdminStatsOverview,
  AdminRevenueStats,
  AdminBookingStats,
  AdminTopKol,
  AdminEscrowMetrics,
} from '@/lib/api/types';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const compactVnd = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n ?? 0);
};

const compactNumber = (n: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(n ?? 0);

const fmtMonthLabel = (raw: string) => {
  // Accept "YYYY-MM" or "YYYY-MM-DD"
  if (!raw) return '';
  const parts = raw.split('-');
  if (parts.length < 2) return raw;
  return `T${Number(parts[1])}/${parts[0].slice(-2)}`;
};

// Backend expects ISO 8601 Instant (e.g. "2026-06-10T00:00:00Z"), not date-only.
const toIsoDateTime = (d: Date, endOfDay = false): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const time = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  return `${y}-${m}-${day}${time}`;
};

const fmtDateLabel = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

type Preset = '30d' | '90d' | '1y' | 'custom';

function computePresetRange(preset: Exclude<Preset, 'custom'>): {
  from: string;
  to: string;
} {
  const to = new Date();
  const from = new Date();
  if (preset === '30d') from.setDate(to.getDate() - 30);
  else if (preset === '90d') from.setDate(to.getDate() - 90);
  else if (preset === '1y') from.setFullYear(to.getFullYear() - 1);
  return { from: toIsoDateTime(from), to: toIsoDateTime(to, true) };
}

function deltaInfo(curr: number, prev?: number) {
  if (prev === undefined || prev === null) return null;
  if (prev === 0) {
    if (curr === 0) return { pct: 0, dir: 'flat' as const };
    return { pct: 100, dir: 'up' as const };
  }
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return {
    pct: Math.abs(pct),
    dir: pct > 0.5 ? ('up' as const) : pct < -0.5 ? ('down' as const) : ('flat' as const),
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customPopOpen, setCustomPopOpen] = useState(false);

  const range = useMemo<{ from?: string; to?: string }>(() => {
    if (preset === 'custom') {
      return {
        from: customRange?.from ? toIsoDateTime(customRange.from) : undefined,
        to: customRange?.to ? toIsoDateTime(customRange.to, true) : undefined,
      };
    }
    return computePresetRange(preset);
  }, [preset, customRange]);

  const [overview, setOverview] = useState<AdminStatsOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [revenue, setRevenue] = useState<AdminRevenueStats[] | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<AdminBookingStats[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [topKols, setTopKols] = useState<AdminTopKol[] | null>(null);
  const [topKolsLoading, setTopKolsLoading] = useState(true);
  const [topKolsError, setTopKolsError] = useState<string | null>(null);

  const [escrow, setEscrow] = useState<AdminEscrowMetrics | null>(null);
  const [escrowLoading, setEscrowLoading] = useState(true);
  const [escrowError, setEscrowError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const params = { from: range.from, to: range.to };

    setOverviewLoading(true);
    setOverviewError(null);
    adminApi
      .getStatsOverview(params)
      .then((data) => setOverview(data))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'Không tải được tổng quan';
        setOverviewError(msg);
        toast.error(msg);
      })
      .finally(() => setOverviewLoading(false));

    setRevenueLoading(true);
    setRevenueError(null);
    adminApi
      .getRevenueStats(params)
      .then((data) => setRevenue(data))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'Không tải được doanh thu';
        setRevenueError(msg);
      })
      .finally(() => setRevenueLoading(false));

    setBookingsLoading(true);
    setBookingsError(null);
    adminApi
      .getBookingStats(params)
      .then((data) => setBookings(data))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'Không tải được booking';
        setBookingsError(msg);
      })
      .finally(() => setBookingsLoading(false));

    setTopKolsLoading(true);
    setTopKolsError(null);
    adminApi
      .getTopKols({ ...params, limit: 10 })
      .then((data) => setTopKols(data))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'Không tải được Top KOL';
        setTopKolsError(msg);
      })
      .finally(() => setTopKolsLoading(false));

    setEscrowLoading(true);
    setEscrowError(null);
    adminApi
      .getEscrowMetrics(params)
      .then((data) => setEscrow(data))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'Không tải được chỉ số escrow';
        setEscrowError(msg);
      })
      .finally(() => setEscrowLoading(false));
  }, [range.from, range.to]);

  useEffect(() => {
    if (preset === 'custom' && (!range.from || !range.to)) return;
    fetchAll();
  }, [fetchAll, preset, range.from, range.to]);

  // ─── KPI definitions ────────────────────────────────────────────────────────

  type KpiKey = 'totalUsers' | 'totalKols' | 'totalBrands' | 'totalBookings' | 'totalRevenue' | 'activeBookings';
  const KPIS: Array<{
    key: KpiKey;
    label: string;
    icon: LucideIcon;
    accent: string;
    formatter: (v: number) => string;
  }> = [
    { key: 'totalUsers',     label: 'Tổng người dùng', icon: Users,     accent: 'text-pin-red',          formatter: compactNumber },
    { key: 'totalKols',      label: 'KOL',             icon: UserCheck, accent: 'text-accent-purple',    formatter: compactNumber },
    { key: 'totalBrands',    label: 'Brand',           icon: Building2, accent: 'text-accent-pressed-blue', formatter: compactNumber },
    { key: 'totalBookings',  label: 'Tổng booking',    icon: Briefcase, accent: 'text-charcoal',         formatter: compactNumber },
    { key: 'totalRevenue',   label: 'Doanh thu',       icon: Wallet,    accent: 'text-success-deep',     formatter: vnd },
    { key: 'activeBookings', label: 'Booking đang chạy', icon: Activity, accent: 'text-pin-red',         formatter: compactNumber },
  ];

  // ─── Chart configs ──────────────────────────────────────────────────────────

  const revenueConfig: ChartConfig = {
    fee: { label: 'Phí nền tảng', color: 'var(--chart-2)' },
  };
  const bookingConfig: ChartConfig = {
    count: { label: 'Số booking', color: 'var(--chart-4)' },
  };

  const revenueData = useMemo(
    () =>
      (revenue ?? []).map((r) => ({
        month: fmtMonthLabel(r.month),
        fee: r.fee,
      })),
    [revenue],
  );

  const bookingData = useMemo(
    () =>
      (bookings ?? []).map((r) => ({
        month: fmtMonthLabel(r.month),
        count: r.count,
      })),
    [bookings],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  const currentRangeLabel =
    preset === 'custom' && range.from && range.to
      ? `${fmtDateLabel(range.from)} → ${fmtDateLabel(range.to)}`
      : preset === '30d'
        ? '30 ngày qua'
        : preset === '90d'
          ? '90 ngày qua'
          : preset === '1y'
            ? '1 năm qua'
            : 'Chọn khoảng ngày';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="text-mute hover:text-pin-red">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin" className="text-mute hover:text-pin-red">Quản trị</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-ink font-semibold">Tổng quan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Dashboard header with filter */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-ink text-[26px] tracking-tight leading-tight">
            Tổng quan nền tảng
          </h2>
          <p className="text-sm text-mute mt-1">
            Theo dõi tăng trưởng người dùng, doanh thu và hiệu suất KOL — {currentRangeLabel}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(['30d', '90d', '1y'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`h-9 px-3 rounded-full text-sm font-semibold transition-colors border ${
                preset === p
                  ? 'bg-ink text-on-dark border-ink'
                  : 'bg-surface-card text-ink border-hairline hover:border-ink'
              }`}
            >
              {p === '30d' ? '30 ngày' : p === '90d' ? '90 ngày' : '1 năm'}
            </button>
          ))}

          <Popover open={customPopOpen} onOpenChange={setCustomPopOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => setPreset('custom')}
                className={`h-9 px-3 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-colors border ${
                  preset === 'custom'
                    ? 'bg-ink text-on-dark border-ink'
                    : 'bg-surface-card text-ink border-hairline hover:border-ink'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                {preset === 'custom' && customRange?.from && customRange?.to
                  ? `${fmtDateLabel(toIsoDateTime(customRange.from))} → ${fmtDateLabel(toIsoDateTime(customRange.to, true))}`
                  : 'Tùy chọn'}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={customRange}
                onSelect={(r) => {
                  setCustomRange(r);
                  if (r?.from && r?.to) setCustomPopOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Row 1: KPI cards ────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        aria-label="Chỉ số tổng quan"
      >
        {KPIS.map((k) => {
          const Icon = k.icon;
          const value = overview ? overview[k.key] : 0;
          const prev = overview?.previousMonth?.[k.key];
          const delta = deltaInfo(value, prev);
          return (
            <Card
              key={k.key}
              className="bg-surface-card border-hairline shadow-none rounded-2xl"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                    {k.label}
                  </CardDescription>
                  <span className={`grid place-items-center w-8 h-8 rounded-full bg-surface-soft ${k.accent}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {overviewLoading ? (
                  <Skeleton className="h-7 w-24 mb-2" />
                ) : overviewError ? (
                  <div className="text-xs text-pin-red flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Lỗi tải dữ liệu
                  </div>
                ) : (
                  <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                    {k.formatter(value)}
                  </div>
                )}
                {!overviewLoading && !overviewError && delta && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                      delta.dir === 'up'
                        ? 'text-success-deep'
                        : delta.dir === 'down'
                          ? 'text-pin-red'
                          : 'text-mute'
                    }`}
                  >
                    {delta.dir === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                    {delta.dir === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                    {delta.dir === 'flat' && <Minus className="w-3.5 h-3.5" />}
                    {delta.pct.toFixed(1)}% so với tháng trước
                  </div>
                )}
                {!overviewLoading && !overviewError && !delta && (
                  <div className="mt-2 text-xs text-mute">&nbsp;</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* ── Row 1b: Operational alerts ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Cảnh báo vận hành">
        {[
          {
            label: 'Tranh chấp đang mở',
            value: overview?.disputeCount ?? 0,
            icon: AlertTriangle,
            accent: 'text-pin-red',
            desc: 'Booking cần admin xử lý',
          },
          {
            label: 'KOL chờ duyệt',
            value: overview?.pendingKolApprovals ?? 0,
            icon: UserCog,
            accent: 'text-accent-purple',
            desc: 'Hồ sơ PENDING_REVIEW',
          },
          {
            label: 'Brand chờ duyệt',
            value: overview?.pendingBrandApprovals ?? 0,
            icon: Store,
            accent: 'text-accent-pressed-blue',
            desc: 'Hồ sơ PENDING_REVIEW',
          },
        ].map((card) => (
          <Card key={card.label} className="bg-surface-card border-hairline shadow-none rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                  {card.label}
                </CardDescription>
                <span className={`grid place-items-center w-8 h-8 rounded-full bg-surface-soft ${card.accent}`}>
                  <card.icon className="w-4 h-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {overviewLoading ? (
                <Skeleton className="h-7 w-16 mb-2" />
              ) : overviewError ? (
                <div className="text-xs text-pin-red flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                </div>
              ) : (
                <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                  {compactNumber(card.value)}
                </div>
              )}
              <div className="mt-2 text-xs text-mute">{card.desc}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── Row 2: Charts ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue line chart */}
        <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle className="text-ink font-display text-base">
              Phí nền tảng theo tháng
            </CardTitle>
            <CardDescription className="text-mute text-xs">
              Hoa hồng nền tảng thu được từ các đơn hoàn tất.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : revenueError ? (
              <ChartErrorState message={revenueError} />
            ) : revenueData.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                <RechartsLineChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    tickFormatter={(v: number) => compactVnd(v)}
                    width={56}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const label =
                            revenueConfig[name as keyof typeof revenueConfig]?.label ?? name;
                          return [vnd(Number(value)), String(label)];
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="fee"
                    type="monotone"
                    stroke="var(--color-fee)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </RechartsLineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking bar chart */}
        <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
          <CardHeader>
            <CardTitle className="text-ink font-display text-base">
              Số booking theo tháng
            </CardTitle>
            <CardDescription className="text-mute text-xs">
              Lượng booking được tạo trong từng tháng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : bookingsError ? (
              <ChartErrorState message={bookingsError} />
            ) : bookingData.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <ChartContainer config={bookingConfig} className="h-[280px] w-full">
                <RechartsBarChart data={bookingData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    width={40}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [compactNumber(Number(value)), 'Số booking']}
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </RechartsBarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Row 3: Escrow / financial-risk metrics ────────────────────────── */}
      <section aria-label="Chỉ số tài chính rủi ro">
        <h3 className="text-sm font-bold text-mute uppercase tracking-wide mb-3">
          Rủi ro tài chính
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* 1 — Tiền đang giữ escrow */}
          <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                  Tiền đang escrow
                </CardDescription>
                <span className="grid place-items-center w-8 h-8 rounded-full bg-surface-soft text-accent-purple">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {escrowLoading ? (
                <Skeleton className="h-7 w-28 mb-2" />
              ) : escrowError ? (
                <div className="text-xs text-pin-red flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                </div>
              ) : (
                <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                  {vnd(escrow?.totalEscrowHeld ?? 0)}
                </div>
              )}
              <div className="mt-2 text-xs text-mute">Tổng balance_held của Brand</div>
            </CardContent>
          </Card>

          {/* 2 — Booking chờ Brand duyệt */}
          <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                  Chờ nghiệm thu
                </CardDescription>
                <span className="grid place-items-center w-8 h-8 rounded-full bg-surface-soft text-pin-red">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {escrowLoading ? (
                <Skeleton className="h-7 w-16 mb-2" />
              ) : escrowError ? (
                <div className="text-xs text-pin-red flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                </div>
              ) : (
                <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                  {compactNumber(escrow?.bookingsPendingApproval ?? 0)}
                </div>
              )}
              <div className="mt-2 text-xs text-mute">Đang ở DELIVERED (snapshot)</div>
            </CardContent>
          </Card>

          {/* 3 — Tỷ lệ reject */}
          <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                  Tỷ lệ từ chối
                </CardDescription>
                <span className="grid place-items-center w-8 h-8 rounded-full bg-surface-soft text-charcoal">
                  <Ban className="w-4 h-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {escrowLoading ? (
                <Skeleton className="h-7 w-20 mb-2" />
              ) : escrowError ? (
                <div className="text-xs text-pin-red flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                </div>
              ) : (
                <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                  {((escrow?.refundRate ?? 0) * 100).toFixed(1)}%
                </div>
              )}
              <div className="mt-2 text-xs text-mute">
                {escrow
                  ? `${escrow.rejectedDeliveries} từ chối / ${escrow.completedBookings + escrow.rejectedDeliveries} hoàn tất`
                  : 'DELIVERY_REJECTED / hoàn tất'}
              </div>
            </CardContent>
          </Card>

          {/* 4 — Tổng đã hoàn tiền */}
          <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                  Đã hoàn tiền
                </CardDescription>
                <span className="grid place-items-center w-8 h-8 rounded-full bg-surface-soft text-success-deep">
                  <RotateCcw className="w-4 h-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {escrowLoading ? (
                <Skeleton className="h-7 w-28 mb-2" />
              ) : escrowError ? (
                <div className="text-xs text-pin-red flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                </div>
              ) : (
                <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                  {vnd(escrow?.totalRefunded ?? 0)}
                </div>
              )}
              <div className="mt-2 text-xs text-mute">REFUND transactions trong range</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Row 4: Top 10 KOL ─────────────────────────────────────────────── */}
      <section>
        <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="text-ink font-display text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-pin-red" /> Top 10 KOL
              </CardTitle>
              <CardDescription className="text-mute text-xs mt-0.5">
                Xếp hạng theo tổng thu nhập trong khoảng thời gian đã chọn.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-mute hover:text-pin-red h-8 px-2"
            >
              <Link href="/admin/kols/review" className="inline-flex items-center gap-1 text-sm font-semibold">
                Quản lý KOL <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topKolsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 flex-1 max-w-[220px]" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topKolsError ? (
              <ChartErrorState message={topKolsError} />
            ) : !topKols || topKols.length === 0 ? (
              <div className="py-10 text-center text-mute text-sm">
                Chưa có dữ liệu Top KOL.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-hairline hover:bg-transparent">
                      <TableHead className="w-14 text-mute font-semibold">#</TableHead>
                      <TableHead className="text-mute font-semibold">KOL</TableHead>
                      <TableHead className="text-mute font-semibold text-right">Thu nhập KOL</TableHead>
                      <TableHead className="text-mute font-semibold text-right">Booking</TableHead>
                      <TableHead className="text-mute font-semibold">Đánh giá</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topKols.slice(0, 10).map((kol, idx) => {
                      const rank = idx + 1;
                      const avatarUrl = (kol as AdminTopKol & { avatarUrl?: string | null }).avatarUrl ?? null;
                      const trimmedName = kol.displayName?.trim() ?? '';
                      const avatarInitials = trimmedName.slice(0, 2).toUpperCase();
                      const hasId = typeof kol.id === 'number' && kol.id > 0;
                      return (
                        <TableRow key={kol.id ?? `idx-${idx}`} className="border-hairline">
                          <TableCell>
                            <RankBadge rank={rank} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 ring-1 ring-hairline">
                                {avatarUrl && <AvatarImage src={avatarUrl} alt={trimmedName || 'KOL'} />}
                                <AvatarFallback className="bg-surface-soft text-ink text-xs font-bold">
                                  {avatarInitials || '—'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="text-ink font-semibold text-sm truncate">
                                  {trimmedName || <span className="text-mute italic">Chưa có tên</span>}
                                </div>
                                {hasId && <div className="text-mute text-xs">ID #{kol.id}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-ink font-semibold tabular-nums">
                            {vnd(kol.kolNet)}
                          </TableCell>
                          <TableCell className="text-right text-ink tabular-nums">
                            {compactNumber(kol.bookingCount)}
                          </TableCell>
                          <TableCell>
                            <StarRating value={kol.avgRating} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartErrorState({ message }: { message: string }) {
  return (
    <div className="h-[280px] grid place-items-center text-center">
      <div className="text-pin-red text-sm font-semibold inline-flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> {message}
      </div>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="h-[280px] grid place-items-center text-center text-mute text-sm">
      Chưa có dữ liệu trong khoảng thời gian này.
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const palette =
    rank === 1
      ? 'bg-pin-red text-on-dark'
      : rank === 2
        ? 'bg-accent-purple text-on-dark'
        : rank === 3
          ? 'bg-accent-pressed-blue text-on-dark'
          : 'bg-surface-soft text-ink';
  return (
    <span
      className={`inline-grid place-items-center w-8 h-8 rounded-full text-xs font-bold ${palette}`}
    >
      {rank}
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value ?? 0));
  return (
    <div className="inline-flex items-center gap-1">
      <div className="relative inline-flex">
        <div className="flex text-hairline">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4" fill="currentColor" />
          ))}
        </div>
        <div
          className="absolute inset-y-0 left-0 overflow-hidden flex text-pin-red"
          style={{ width: `${(v / 5) * 100}%` }}
          aria-hidden
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4" fill="currentColor" />
          ))}
        </div>
      </div>
      <span className="text-mute text-xs font-semibold tabular-nums">
        {v.toFixed(1)}
      </span>
    </div>
  );
}
