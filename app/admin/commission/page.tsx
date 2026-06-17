'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Percent,
  Wallet,
  Coins,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  Info,
  RefreshCw,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type { AdminCommissionSummary, AdminCommissionTransaction, AdminRevenueStats } from '@/lib/api/types';
import { PaginationBar } from '@/components/pagination-bar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtMonth = (raw: string) => {
  const parts = raw.split('-');
  if (parts.length < 2) return raw;
  return `Tháng ${Number(parts[1])}/${parts[0]}`;
};

const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  CANCELLED_BY_ADMIN: 'Admin hủy',
  DISPUTED: 'Tranh chấp',
  DELIVERY_REJECTED: 'Từ chối nội dung',
};

const PAGE_SIZE = 15;

export default function AdminCommissionPage() {
  const [summary, setSummary] = useState<AdminCommissionSummary | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenueStats[]>([]);
  const [ledger, setLedger] = useState<AdminCommissionTransaction[]>([]);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(0);
  const [ledgerTotal, setLedgerTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        adminApi.getCommissionSummary(),
        adminApi.getRevenueStats().catch(() => [] as AdminRevenueStats[]),
      ]);
      setSummary(s);
      setRevenue(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được dữ liệu hoa hồng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const res = await adminApi.getCommissionTransactions({ page: ledgerPage, size: PAGE_SIZE });
      setLedger(res.content);
      setLedgerTotalPages(res.totalPages);
      setLedgerTotal(res.totalElements);
    } catch (e) {
      setLedgerError(e instanceof ApiError ? e.message : 'Không tải được sổ giao dịch phí.');
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerPage]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchLedger();
  }, [fetchLedger]);

  const maxFee = revenue.reduce((m, r) => Math.max(m, r.fee ?? 0), 0);
  const feePercent = summary?.defaultFeePercent ?? 10;

  const cards = [
    {
      label: 'Tỷ lệ hoa hồng',
      value: summary ? `${summary.defaultFeePercent}%` : '—',
      icon: Percent,
      accent: 'text-pin-red',
      hint: `Phí = ngân sách booking × ${feePercent}% khi đơn hoàn tất`,
    },
    {
      label: 'Ví nền tảng khả dụng',
      value: summary ? vnd(summary.platformWalletAvailable) : '—',
      icon: Wallet,
      accent: 'text-success-deep',
      hint: 'Số dư ví hệ thống (user #0) sau các lần ghi FEE',
    },
    {
      label: 'Tổng hoa hồng đã thu',
      value: summary ? vnd(summary.totalCommission) : '—',
      icon: Coins,
      accent: 'text-accent-purple',
      hint: 'Tổng các giao dịch FEE trong sổ cái ví nền tảng',
    },
    {
      label: 'Số giao dịch phí',
      value: summary ? summary.commissionTransactions.toLocaleString('vi-VN') : '—',
      icon: Receipt,
      accent: 'text-accent-pressed-blue',
      hint: 'Mỗi booking giải ngân tạo 1 bản ghi FEE (xem bảng bên dưới)',
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin" className="text-mute hover:text-pin-red">Quản trị</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-ink font-semibold">Hoa hồng</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h2 className="font-display font-bold text-ink text-[26px] tracking-tight leading-tight">
          Hoa hồng nền tảng
        </h2>
        <p className="text-sm text-mute mt-1">
          Phí nền tảng được ghi nhận khi booking hoàn tất — Brand thanh toán, KOL nhận net, phần còn lại vào ví hệ thống.
        </p>
      </div>

      {/* Source explanation */}
      <div className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5 flex gap-3">
        <Info className="w-5 h-5 text-pin-red shrink-0 mt-0.5" />
        <div className="text-sm text-ink space-y-1">
          <p className="font-semibold">Nguồn hoa hồng</p>
          <p className="text-mute leading-relaxed">
            Khi Brand thanh toán, tiền được giữ trong escrow. Khi booking chuyển sang{' '}
            <span className="font-semibold text-ink">Hoàn thành</span> (Brand phê duyệt giao hàng) hoặc admin giải
            ngân tranh chấp cho KOL, hệ thống giải ngân: KOL nhận{' '}
            <span className="font-semibold text-ink">{100 - feePercent}%</span> ngân sách, nền tảng ghi{' '}
            <span className="font-semibold text-ink">{feePercent}%</span> vào ví hệ thống dưới dạng giao dịch{' '}
            <span className="font-mono text-xs bg-surface-soft px-1.5 py-0.5 rounded">FEE</span>.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="bg-surface-card border-hairline shadow-none rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardDescription className="text-xs font-semibold text-mute uppercase tracking-wide">
                    {c.label}
                  </CardDescription>
                  <span className={`grid place-items-center w-8 h-8 rounded-full bg-surface-soft ${c.accent}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Skeleton className="h-7 w-28 mb-2" />
                ) : (
                  <div className="font-display font-bold text-ink text-2xl tracking-tight leading-none">
                    {c.value}
                  </div>
                )}
                <p className="mt-2 text-xs text-mute">{c.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Commission ledger — traceable sources */}
      <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-ink font-display text-base">Sổ giao dịch phí (FEE)</CardTitle>
            <CardDescription className="text-mute text-xs mt-0.5">
              {ledgerLoading
                ? 'Đang tải…'
                : `${ledgerTotal.toLocaleString('vi-VN')} giao dịch — mỗi dòng là phí thu từ một booking cụ thể`}
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => {
              void fetchLedger();
              void fetchSummary();
            }}
            disabled={ledgerLoading}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute hover:text-pin-red disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${ledgerLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </CardHeader>
        <CardContent>
          {ledgerError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {ledgerError}
            </div>
          )}

          {ledgerLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : ledger.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="w-10 h-10 text-mute mx-auto mb-3" />
              <p className="text-ink font-semibold mb-1">Chưa có giao dịch phí</p>
              <p className="text-mute text-sm">
                Phí sẽ xuất hiện khi có booking hoàn tất và được giải ngân.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-hairline hover:bg-transparent">
                    <TableHead className="text-mute font-semibold whitespace-nowrap">Thời gian</TableHead>
                    <TableHead className="text-mute font-semibold">Booking / Chiến dịch</TableHead>
                    <TableHead className="text-mute font-semibold">Brand → KOL</TableHead>
                    <TableHead className="text-mute font-semibold text-right whitespace-nowrap">Ngân sách</TableHead>
                    <TableHead className="text-mute font-semibold text-right whitespace-nowrap">Phí ({feePercent}%)</TableHead>
                    <TableHead className="text-mute font-semibold">Trạng thái đơn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((tx) => {
                    const brand = tx.brandCompanyName?.trim() || '—';
                    const kol = tx.kolDisplayName?.trim() || '—';
                    const statusLabel = tx.bookingStatus
                      ? BOOKING_STATUS_LABEL[tx.bookingStatus] ?? tx.bookingStatus
                      : '—';
                    const pct =
                      tx.feePercent != null
                        ? Number(tx.feePercent)
                        : tx.bookingBudget && tx.bookingBudget > 0
                          ? Math.round((tx.amount / tx.bookingBudget) * 1000) / 10
                          : feePercent;

                    return (
                      <TableRow key={tx.id} className="border-hairline">
                        <TableCell className="text-xs text-mute whitespace-nowrap tabular-nums">
                          {fmtDateTime(tx.recordedAt)}
                        </TableCell>
                        <TableCell>
                          {tx.bookingId ? (
                            <div className="min-w-[160px]">
                              <Link
                                href={`/admin/bookings`}
                                className="font-semibold text-ink text-sm hover:text-pin-red line-clamp-1"
                                title={tx.campaignTitle ?? undefined}
                              >
                                {tx.campaignTitle ?? `Booking #${tx.bookingId}`}
                              </Link>
                              <p className="text-xs text-mute mt-0.5 flex items-center gap-1">
                                #{tx.bookingId}
                                <ExternalLink className="w-3 h-3" />
                              </p>
                            </div>
                          ) : (
                            <span className="text-mute text-sm italic">Không gắn booking</span>
                          )}
                          {tx.note && (
                            <p className="text-[11px] text-mute mt-0.5 line-clamp-1" title={tx.note}>
                              {tx.note}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold text-ink">{brand}</span>
                          <span className="text-mute mx-1">→</span>
                          <span className="font-semibold text-ink">{kol}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums whitespace-nowrap">
                          {tx.bookingBudget != null ? vnd(tx.bookingBudget) : '—'}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className="font-display font-bold text-pin-red tabular-nums">
                            {vnd(tx.amount)}
                          </span>
                          <span className="block text-[11px] text-mute">{pct}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-surface-soft text-ink border border-hairline">
                            {statusLabel}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <PaginationBar
            page={ledgerPage}
            totalPages={ledgerTotalPages}
            onPage={(p) => {
              setLedgerPage(p);
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Monthly fee breakdown */}
      <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-ink font-display text-base">Phí thu theo tháng</CardTitle>
            <CardDescription className="text-mute text-xs mt-0.5">
              Tổng hợp từ sổ FEE — 12 tháng gần nhất.
            </CardDescription>
          </div>
          <Link
            href="/admin"
            className="text-mute hover:text-pin-red inline-flex items-center gap-1 text-sm font-semibold"
          >
            Tổng quan <ArrowUpRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : revenue.length === 0 ? (
            <div className="py-10 text-center text-mute text-sm">Chưa có dữ liệu phí trong kỳ.</div>
          ) : (
            <ul className="space-y-2.5">
              {revenue.map((r) => (
                <li key={r.period} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-mute shrink-0">{fmtMonth(r.period)}</span>
                  <div className="flex-1 h-6 rounded-full bg-surface-soft overflow-hidden">
                    <div
                      className="h-full bg-pin-red/80 rounded-full"
                      style={{ width: maxFee > 0 ? `${Math.max(4, ((r.fee ?? 0) / maxFee) * 100)}%` : '0%' }}
                    />
                  </div>
                  <span className="w-32 text-right text-sm font-semibold text-ink tabular-nums shrink-0">
                    {vnd(r.fee ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
