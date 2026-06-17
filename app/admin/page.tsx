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
  AlertCircle,
  AlertTriangle,
  CalendarRange,
  ArrowUpRight,
  Star,
  Trophy,
  Lock,
  Clock,
  RotateCcw,
  Ban,
  Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import {
  CartesianGrid,
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
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
  StatsGranularity,
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

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Fill missing periods for day/month/year granularity so charts always show a continuous series.
function fillPeriodRange<T extends { period: string }>(
  rows: T[],
  from: string | undefined,
  to: string | undefined,
  gran: StatsGranularity,
  defaults: Omit<T, 'period'>,
): T[] {
  const sliceLen = gran === 'day' ? 10 : gran === 'month' ? 7 : 4;
  const startKey = (from ? from.slice(0, sliceLen) : rows[0]?.period?.slice(0, sliceLen)) ?? '';
  const endKey = (to ? to.slice(0, sliceLen) : rows[rows.length - 1]?.period?.slice(0, sliceLen)) ?? startKey;
  if (!startKey || !endKey) return rows;
  const map = new Map(rows.map((r) => [r.period.slice(0, sliceLen), r]));
  const result: T[] = [];
  if (gran === 'day') {
    const cur = new Date(startKey + 'T00:00:00Z');
    const end = new Date(endKey + 'T00:00:00Z');
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      result.push(map.get(key) ?? ({ period: key, ...defaults } as T));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  } else if (gran === 'month') {
    let [y, m] = startKey.split('-').map(Number);
    const [ey, em] = endKey.split('-').map(Number);
    while (y < ey || (y === ey && m <= em)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      result.push(map.get(key) ?? ({ period: key, ...defaults } as T));
      if (m === 12) { y++; m = 1; } else { m++; }
    }
  } else {
    let y = parseInt(startKey.slice(0, 4), 10);
    const ey = parseInt(endKey.slice(0, 4), 10);
    if (!isNaN(y) && !isNaN(ey)) {
      while (y <= ey) {
        const key = String(y);
        result.push(map.get(key) ?? ({ period: key, ...defaults } as T));
        y++;
      }
    }
  }
  return result;
}

function fmtPeriodLabel(period: string, gran: StatsGranularity): string {
  if (!period) return '';
  if (gran === 'year') return period.slice(0, 4);
  if (gran === 'month') {
    const parts = period.split('-');
    if (parts.length < 2) return period;
    return `T${Number(parts[1])}/${parts[0].slice(-2)}`;
  }
  // day: "YYYY-MM-DD" → "DD/MM"
  const parts = period.split('-');
  if (parts.length < 3) return period;
  return `${parts[2]}/${parts[1]}`;
}

type Preset = '30d' | '90d' | '1y' | 'custom';
type ChartType = 'bar' | 'line' | 'area' | 'stackbar';

const CHART_TYPE_OPTIONS: { t: ChartType; label: string }[] = [
  { t: 'bar',      label: 'Cột'   },
  { t: 'line',     label: 'Đường' },
  { t: 'area',     label: 'Vùng'  },
  { t: 'stackbar', label: 'Chồng' },
];

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

  const [chartMetric, setChartMetric] = useState<'fee' | 'count'>('fee');
  const [activeChartType, setActiveChartType] = useState<ChartType>('bar');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [granularity, setGranularity] = useState<StatsGranularity>('day');

  // Preset selection — always update preset + granularity in the same React batch
  // so that fetchAll only fires once with the correct granularity (avoids a spurious
  // fetch with the old granularity when the preset changes).
  function handlePresetSelect(p: Exclude<Preset, 'custom'>) {
    setPreset(p);
    if (p === '30d' || p === '90d') setGranularity('day');
    else if (p === '1y') setGranularity('month');
  }

  const fetchAll = useCallback(async () => {
    setLastUpdated(new Date());
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
      .getRevenueStats({ ...params, granularity })
      .then((data) => setRevenue(data))
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : 'Không tải được doanh thu';
        setRevenueError(msg);
      })
      .finally(() => setRevenueLoading(false));

    setBookingsLoading(true);
    setBookingsError(null);
    adminApi
      .getBookingStats({ ...params, granularity })
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
  }, [range.from, range.to, granularity]);

  useEffect(() => {
    if (preset === 'custom' && (!range.from || !range.to)) return;
    fetchAll();
  }, [fetchAll, preset, range.from, range.to]);

  // Auto-refresh every 60 s, matching the reference dashboard pattern
  useEffect(() => {
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ─── KPI definitions ────────────────────────────────────────────────────────

  type KpiKey = 'totalUsers' | 'totalKols' | 'totalBrands' | 'totalBookings' | 'totalRevenue' | 'activeBookings';
  const KPIS: Array<{
    key: KpiKey;
    label: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    formatter: (v: number) => string;
  }> = [
    { key: 'totalUsers',     label: 'Tổng người dùng',    icon: Users,     iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   formatter: compactNumber },
    { key: 'totalKols',      label: 'KOL',                icon: UserCheck, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', formatter: compactNumber },
    { key: 'totalBrands',    label: 'Brand',              icon: Building2, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', formatter: compactNumber },
    { key: 'totalBookings',  label: 'Tổng booking',       icon: Briefcase, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', formatter: compactNumber },
    { key: 'totalRevenue',   label: 'Doanh thu',          icon: Wallet,    iconBg: 'bg-green-50',  iconColor: 'text-green-600',  formatter: vnd },
    { key: 'activeBookings', label: 'Booking đang chạy',  icon: Activity,  iconBg: 'bg-red-50',    iconColor: 'text-red-500',    formatter: compactNumber },
  ];

  // ─── Chart configs ──────────────────────────────────────────────────────────

  const revenueConfig: ChartConfig = {
    fee: { label: 'Phí nền tảng', color: '#6366f1' },
  };
  const bookingConfig: ChartConfig = {
    count: { label: 'Số booking', color: '#22c55e' },
  };

  const revenueData = useMemo(() => {
    const rows = revenue ?? [];
    const detected: StatsGranularity = rows.length > 0
      ? (rows[0].period.length <= 4 ? 'year' : rows[0].period.length <= 7 ? 'month' : 'day')
      : granularity;
    // Daily: skip zero-fill — only show days with actual data so the chart stays clean.
    // Monthly/yearly: fill gaps so the continuous timeline looks natural (12 months, few years).
    const filled = detected === 'day'
      ? rows
      : fillPeriodRange(rows, range.from, range.to, detected, { fee: 0 } as Omit<AdminRevenueStats, 'period'>);
    // Client-side year aggregation when user selects 'year' but backend returned monthly data.
    if (granularity === 'year' && detected === 'month') {
      const ymap = new Map<string, number>();
      filled.forEach((r) => { const y = r.period.slice(0, 4); ymap.set(y, (ymap.get(y) ?? 0) + r.fee); });
      return Array.from(ymap.entries()).map(([period, fee]) => ({ period, fee }));
    }
    return filled.map((r) => ({ period: fmtPeriodLabel(r.period, detected), fee: Number(r.fee) }));
  }, [revenue, range.from, range.to, granularity]);

  const bookingData = useMemo(() => {
    const rows = bookings ?? [];
    const detected: StatsGranularity = rows.length > 0
      ? (rows[0].period.length <= 4 ? 'year' : rows[0].period.length <= 7 ? 'month' : 'day')
      : granularity;
    // Daily: skip zero-fill — sparse bar chart is cleaner than a sea of invisible zero bars.
    // Monthly/yearly: fill gaps for a continuous timeline.
    const filled = detected === 'day'
      ? rows
      : fillPeriodRange(rows, range.from, range.to, detected, { count: 0, total: 0 } as Omit<AdminBookingStats, 'period'>);
    if (granularity === 'year' && detected === 'month') {
      const ymap = new Map<string, number>();
      filled.forEach((r) => { const y = r.period.slice(0, 4); ymap.set(y, (ymap.get(y) ?? 0) + r.count); });
      return Array.from(ymap.entries()).map(([period, count]) => ({ period, count }));
    }
    return filled.map((r) => ({ period: fmtPeriodLabel(r.period, detected), count: Number(r.count) }));
  }, [bookings, range.from, range.to, granularity]);

  const revenuePeriodTotal = useMemo(
    () => revenueData.reduce((s, r) => s + r.fee, 0),
    [revenueData],
  );

  const bookingPeriodTotal = useMemo(
    () => bookingData.reduce((s, r) => s + r.count, 0),
    [bookingData],
  );

  // Trim leading + trailing zero-value periods so bars don't crowd one side of the chart.
  // Keeps 1 zero-padding period on each side of non-zero data for visual context.
  const revenueChartData = useMemo(() => {
    let first = revenueData.findIndex((r) => r.fee > 0);
    let last = [...revenueData].reverse().findIndex((r) => r.fee > 0);
    if (first === -1) return revenueData; // all zeros → let empty-state handle it
    last = revenueData.length - 1 - last;
    return revenueData.slice(Math.max(0, first - 1), Math.min(revenueData.length, last + 2));
  }, [revenueData]);

  const bookingChartData = useMemo(() => {
    let first = bookingData.findIndex((r) => r.count > 0);
    let last = [...bookingData].reverse().findIndex((r) => r.count > 0);
    if (first === -1) return bookingData;
    last = bookingData.length - 1 - last;
    return bookingData.slice(Math.max(0, first - 1), Math.min(bookingData.length, last + 2));
  }, [bookingData]);

  // Effective display granularity — reflects what the chart actually shows, not what the user requested.
  // 'year' is always honoured (client-side aggregation). For day/month, detect from backend response.
  const displayGranularity = useMemo((): StatsGranularity => {
    if (granularity === 'year') return 'year';
    const rows = chartMetric === 'fee' ? (revenue ?? []) : (bookings ?? []);
    if (!rows.length) return granularity;
    const plen = rows[0].period.length;
    return plen <= 4 ? 'year' : plen <= 7 ? 'month' : 'day';
  }, [granularity, chartMetric, revenue, bookings]);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const currentRangeLabel = useMemo(
    () =>
      preset === 'custom' && range.from && range.to
        ? `${fmtDateLabel(range.from)} → ${fmtDateLabel(range.to)}`
        : preset === '30d' ? '30 ngày qua'
        : preset === '90d' ? '90 ngày qua'
        : preset === '1y'  ? '1 năm qua'
        : 'Chọn khoảng ngày',
    [preset, range.from, range.to],
  );

  const isLoading =
    overviewLoading || revenueLoading || bookingsLoading || topKolsLoading || escrowLoading;

  function exportStatsCsv() {
    const slug = currentRangeLabel.replace(/[\s→/]+/g, '-');
    const csv = [
      `Phí nền tảng - ${currentRangeLabel}`,
      'Kỳ,Phí nền tảng (VND)',
      ...revenueData.map((r) => `${r.period},${r.fee}`),
      '',
      `Số booking - ${currentRangeLabel}`,
      'Kỳ,Số booking',
      ...bookingData.map((r) => `${r.period},${r.count}`),
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `stats-${slug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportTopKolCsv() {
    if (!topKols?.length) return;
    const slug = currentRangeLabel.replace(/[\s→/]+/g, '-');
    const header = 'Rank,Ten KOL,ID,Thu nhap KOL (VND),So booking,Danh gia';
    const rows = topKols
      .slice(0, 10)
      .map((k, i) =>
        `${i + 1},"${k.displayName.replace(/"/g, '""')}",${k.id},${k.kolNet},${k.bookingCount},${k.avgRating.toFixed(1)}`,
      );
    const csv = [`Top KOL - ${currentRangeLabel}`, header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `top-kol-${slug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

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

      {/* Dashboard header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-ink text-[26px] tracking-tight leading-tight">
            Tổng quan nền tảng
          </h2>
          <p className="text-sm text-mute mt-1">
            Theo dõi tăng trưởng người dùng, doanh thu và hiệu suất KOL.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-xs text-mute">
              Cập nhật lúc{' '}
              <span className="font-semibold text-ink">{fmtTime(lastUpdated)}</span>
            </span>
          )}
          <button
            type="button"
            onClick={fetchAll}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold border border-hairline bg-surface-card text-ink hover:border-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Global time bar — syncs all charts */}
      <div className="bg-surface-card border border-hairline rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink">Khoảng thời gian phân tích</p>
          <p className="text-xs text-mute mt-0.5">
            Đồng bộ tất cả biểu đồ và chỉ số —{' '}
            <span className="font-semibold text-ink">{currentRangeLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['30d', '90d', '1y'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className={`h-8 px-3 rounded-lg text-sm font-semibold transition-colors border ${
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
                className={`h-8 px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-colors border ${
                  preset === 'custom'
                    ? 'bg-ink text-on-dark border-ink'
                    : 'bg-surface-card text-ink border-hairline hover:border-ink'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
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
          <div className="w-px h-6 bg-hairline" />
          <button
            type="button"
            onClick={exportStatsCsv}
            disabled={revenueLoading || bookingsLoading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-semibold border border-hairline text-ink hover:border-ink transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Row 1: KPI cards ────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        aria-label="Chỉ số tổng quan"
      >
        {KPIS.map((kpi) => {
          const value = overview ? overview[kpi.key] : 0;
          const prev = overview?.previousMonth?.[kpi.key];
          const delta = deltaInfo(value, prev);
          return (
            <div key={kpi.key} className="rounded-2xl border border-hairline bg-surface-card p-5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}
              >
                <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
              </div>
              {/* Label + value */}
              <div className="mt-4">
                <p className="text-xs text-mute font-medium">{kpi.label}</p>
                <div className="mt-1.5 text-[22px] font-bold text-ink leading-tight break-all">
                  {overviewLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : overviewError ? (
                    <span className="text-sm text-pin-red inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Lỗi
                    </span>
                  ) : (
                    kpi.formatter(value)
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Operational highlights ─────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        aria-label="Cảnh báo vận hành"
      >
        {/* 1 — Tranh chấp */}
        <div className="rounded-2xl border border-hairline bg-surface-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-mute font-medium uppercase tracking-wider">TRANH CHẤP ĐANG MỞ</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[22px] font-bold text-ink leading-tight tabular-nums">
              {overviewLoading ? <Skeleton className="h-7 w-12" /> : compactNumber(overview?.disputeCount ?? 0)}
            </div>
            <p className="text-xs text-mute mt-1">Booking cần admin xử lý</p>
          </div>
        </div>

        {/* 2 — KOL chờ duyệt */}
        <div className="rounded-2xl border border-hairline bg-surface-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-mute font-medium uppercase tracking-wider">KOL CHỜ DUYỆT</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50">
              <UserCheck className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[22px] font-bold text-ink leading-tight tabular-nums">
              {overviewLoading ? <Skeleton className="h-7 w-12" /> : compactNumber(overview?.pendingKolApprovals ?? 0)}
            </div>
            <p className="text-xs text-mute mt-1">Hồ sơ PENDING_REVIEW</p>
          </div>
        </div>

        {/* 3 — Brand chờ duyệt */}
        <div className="rounded-2xl border border-hairline bg-surface-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs text-mute font-medium uppercase tracking-wider">BRAND CHỜ DUYỆT</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
              <Building2 className="w-5 h-5 text-violet-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[22px] font-bold text-ink leading-tight tabular-nums">
              {overviewLoading ? <Skeleton className="h-7 w-12" /> : compactNumber(overview?.pendingBrandApprovals ?? 0)}
            </div>
            <p className="text-xs text-mute mt-1">Hồ sơ PENDING_REVIEW</p>
          </div>
        </div>
      </section>

      {/* ── Biểu đồ thống kê ───────────────────────────────────────────────── */}
      <section aria-label="Biểu đồ thống kê">
        <Card className="bg-surface-card border-hairline shadow-none rounded-2xl overflow-hidden">
          {/* Toolbar — matches reference: title + metric selector left, chart type right */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-b border-hairline bg-surface-soft">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-ink">Biểu đồ thống kê</span>
              <div className="flex border border-hairline rounded-lg overflow-hidden">
                {([
                  { m: 'fee' as const, label: 'Phí nền tảng' },
                  { m: 'count' as const, label: 'Số booking' },
                ] as const).map(({ m, label }) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMetric(m)}
                    className={`h-7 px-3 text-xs font-semibold transition-colors border-r border-hairline last:border-r-0 ${
                      chartMetric === m ? 'bg-ink text-on-dark' : 'text-mute hover:bg-surface-card'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Granularity selector */}
              <div className="flex border border-hairline rounded-lg overflow-hidden">
                {([
                  { g: 'day' as const, label: 'Ngày' },
                  { g: 'month' as const, label: 'Tháng' },
                  { g: 'year' as const, label: 'Năm' },
                ] as const).map(({ g, label }) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`h-7 px-2.5 text-xs font-semibold transition-colors border-r border-hairline last:border-r-0 ${
                      granularity === g ? 'bg-ink text-on-dark' : 'text-mute hover:bg-surface-card'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex border border-hairline rounded-lg overflow-hidden">
              {CHART_TYPE_OPTIONS.map(({ t, label }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveChartType(t)}
                  className={`h-7 px-2.5 text-xs font-semibold transition-colors border-r border-hairline last:border-r-0 ${
                    activeChartType === t ? 'bg-ink text-on-dark' : 'text-mute hover:bg-surface-card'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart body */}
          <CardContent className="px-5 pt-5 pb-0">
            {(() => {
              const isFee = chartMetric === 'fee';
              const chartData = isFee ? revenueChartData : bookingChartData;
              const chartTotal = isFee ? revenuePeriodTotal : bookingPeriodTotal;
              const chartConfig = isFee ? revenueConfig : bookingConfig;
              const chartLoading = isFee ? revenueLoading : bookingsLoading;
              const chartError = isFee ? revenueError : bookingsError;
              const dataKey = isFee ? 'fee' : 'count';
              const color = isFee ? 'var(--color-fee)' : 'var(--color-count)';
              const yFmt = isFee
                ? (v: number) => compactVnd(v)
                : (v: number) => compactNumber(v);
              const yWidth = isFee ? 64 : 40;
              const tooltipFmt = isFee
                ? (v: unknown, n: unknown) => [vnd(Number(v)), String(revenueConfig[n as keyof typeof revenueConfig]?.label ?? n)]
                : (v: unknown) => [compactNumber(Number(v)), 'Số booking'];
              const gradId = isFee ? 'feeAreaGrad2' : 'bookAreaGrad2';

              if (chartLoading) return <Skeleton className="h-[380px] w-full rounded-xl" />;
              if (chartError) return <ChartErrorState message={chartError} onRetry={fetchAll} />;
              if (!chartData.length || chartTotal === 0) return <ChartEmptyState />;

              // Dynamic bar width: wider when few data points, capped when many
              const barSize = chartData.length <= 6
                ? Math.min(96, Math.floor(600 / Math.max(chartData.length, 1)))
                : Math.min(56, Math.floor(700 / Math.max(chartData.length, 1)));

              // Recharts iterates props.children by element type — JSX variables work fine here,
              // but never wrap them in a Fragment (<></>) since Recharts won't descend into it.
              const xAxis = (
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  tick={{ fill: '#64748b' }}
                  interval={chartData.length > 16 ? Math.ceil(chartData.length / 8) - 1 : 0}
                />
              );
              const yAxis = (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={yFmt}
                  width={yWidth}
                  tick={{ fill: '#64748b' }}
                  allowDecimals={false}
                />
              );
              const grid = (
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#f1f5f9" />
              );
              const tooltip = (
                <ChartTooltip
                  cursor={{ fill: 'rgba(100,116,139,0.06)' }}
                  content={<ChartTooltipContent formatter={tooltipFmt} />}
                />
              );

              return (
                <ChartContainer config={chartConfig} className="h-[380px] w-full">
                  {(activeChartType === 'bar' || activeChartType === 'stackbar') ? (
                    <RechartsBarChart data={chartData} barSize={barSize} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                      {grid}{xAxis}{yAxis}{tooltip}
                      <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
                    </RechartsBarChart>
                  ) : activeChartType === 'line' ? (
                    <RechartsLineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                      {grid}{xAxis}{yAxis}{tooltip}
                      <Line dataKey={dataKey} type="monotone" stroke={color} strokeWidth={3} dot={{ r: 5, fill: color, strokeWidth: 0 }} activeDot={{ r: 7, fill: color }} />
                    </RechartsLineChart>
                  ) : (
                    <RechartsAreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      {grid}{xAxis}{yAxis}{tooltip}
                      <Area dataKey={dataKey} type="monotone" stroke={color} strokeWidth={3} fill={`url(#${gradId})`} dot={{ r: 5, fill: color, strokeWidth: 0 }} activeDot={{ r: 7, fill: color }} />
                    </RechartsAreaChart>
                  )}
                </ChartContainer>
              );
            })()}
          </CardContent>

          {/* Legend row — like reference: colored dot + label left, context right */}
          <div className="flex items-center justify-between px-5 py-3.5 mt-2 border-t border-hairline">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: chartMetric === 'fee' ? 'var(--color-fee)' : 'var(--color-count)' }}
              />
              <span className="text-xs font-semibold text-mute">
                {chartMetric === 'fee' ? 'Phí nền tảng' : 'Số booking'}
              </span>
            </div>
            <span className="text-xs text-mute">
              {currentRangeLabel} · {displayGranularity === 'day' ? 'theo ngày' : displayGranularity === 'month' ? 'theo tháng' : 'theo năm'} · Tổng kỳ:{' '}
              <span className="font-semibold text-ink">
                {chartMetric === 'fee' ? vnd(revenuePeriodTotal) : compactNumber(bookingPeriodTotal) + ' booking'}
              </span>
            </span>
          </div>
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
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={exportTopKolCsv}
                disabled={topKolsLoading || !topKols?.length}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-mute border border-hairline rounded-lg px-3 h-8 hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <Button asChild variant="ghost" className="text-mute hover:text-pin-red h-8 px-2">
                <Link href="/admin/kols/review" className="inline-flex items-center gap-1 text-sm font-semibold">
                  Quản lý KOL <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
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
              <ChartErrorState message={topKolsError} onRetry={fetchAll} />
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

function ChartErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="h-[280px] grid place-items-center text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-pin-red text-sm font-semibold inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {message}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-mute border border-hairline rounded-lg px-3 h-7 hover:border-ink hover:text-ink transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Thử lại
          </button>
        )}
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
