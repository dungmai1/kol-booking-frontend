'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Percent, Wallet, Coins, Receipt, AlertCircle, ArrowUpRight } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type { AdminCommissionSummary, AdminRevenueStats } from '@/lib/api/types';
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

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const fmtMonth = (raw: string) => {
  const parts = raw.split('-');
  if (parts.length < 2) return raw;
  return `Tháng ${Number(parts[1])}/${parts[0]}`;
};

export default function AdminCommissionPage() {
  const [summary, setSummary] = useState<AdminCommissionSummary | null>(null);
  const [revenue, setRevenue] = useState<AdminRevenueStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, r] = await Promise.all([
          adminApi.getCommissionSummary(),
          adminApi.getRevenueStats().catch(() => [] as AdminRevenueStats[]),
        ]);
        if (cancelled) return;
        setSummary(s);
        setRevenue(r);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Không tải được dữ liệu hoa hồng.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxFee = revenue.reduce((m, r) => Math.max(m, r.fee ?? 0), 0);

  const cards = [
    {
      label: 'Tỷ lệ hoa hồng',
      value: summary ? `${summary.defaultFeePercent}%` : '—',
      icon: Percent,
      accent: 'text-pin-red',
      hint: 'Áp dụng cho booking mới',
    },
    {
      label: 'Ví nền tảng khả dụng',
      value: summary ? vnd(summary.platformWalletAvailable) : '—',
      icon: Wallet,
      accent: 'text-success-deep',
      hint: 'Tài khoản hệ thống (user #0)',
    },
    {
      label: 'Tổng hoa hồng đã thu',
      value: summary ? vnd(summary.totalCommission) : '—',
      icon: Coins,
      accent: 'text-accent-purple',
      hint: 'Toàn bộ thời gian',
    },
    {
      label: 'Số giao dịch phí',
      value: summary ? summary.commissionTransactions.toLocaleString('vi-VN') : '—',
      icon: Receipt,
      accent: 'text-accent-pressed-blue',
      hint: 'Mỗi đơn hoàn tất tạo 1 bản ghi phí',
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
          Theo dõi tỷ lệ hoa hồng, số dư ví nền tảng và phí thu được từ các đơn hoàn tất.
        </p>
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

      {/* Monthly fee breakdown */}
      <Card className="bg-surface-card border-hairline shadow-none rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-ink font-display text-base">Phí thu theo tháng</CardTitle>
            <CardDescription className="text-mute text-xs mt-0.5">
              Hoa hồng nền tảng ghi nhận trong 12 tháng gần nhất.
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
                <li key={r.month} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-mute shrink-0">{fmtMonth(r.month)}</span>
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
