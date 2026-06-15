'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  Banknote,
  CircleDollarSign,
  Inbox,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { PaginationBar } from '@/components/pagination-bar';
import { withdrawalsApi } from '@/lib/api/withdrawals';
import { ApiError } from '@/lib/api/client';
import type { WithdrawResponse, WithdrawStatus } from '@/lib/api/types';

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
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
}

const TABS: { value: WithdrawStatus; label: string }[] = [
  { value: 'PENDING', label: 'Chờ chuyển khoản' },
  { value: 'PAID', label: 'Đã chi trả' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const STATUS_CLASS: Record<WithdrawStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABEL: Record<WithdrawStatus, string> = {
  PENDING: 'Chờ chuyển khoản',
  APPROVED: 'Chờ chuyển khoản',
  PAID: 'Đã chi trả',
  REJECTED: 'Từ chối',
};

const ROLE_LABEL: Record<string, string> = {
  KOL: 'KOL',
  BRAND: 'Brand',
  ADMIN: 'Admin',
};

function requesterLabel(w: WithdrawResponse): string {
  const role = w.requesterRole ? ROLE_LABEL[w.requesterRole] ?? w.requesterRole : 'User';
  return `${role} #${w.userId}`;
}

const PAGE_SIZE = 15;

export default function AdminWithdrawalsPage() {
  const [tab, setTab] = useState<WithdrawStatus>('PENDING');
  const [items, setItems] = useState<WithdrawResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectFor, setRejectFor] = useState<WithdrawResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await withdrawalsApi.adminList(tab, page, PAGE_SIZE);
      setItems(res.content);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được danh sách rút tiền.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  function removeFromList(id: number) {
    setItems((list) => list.filter((x) => x.id !== id));
  }

  async function doPaid(w: WithdrawResponse) {
    if (!window.confirm(`Xác nhận đã chuyển khoản ${vnd(w.amount)} cho ${w.accountName}?`)) return;
    setBusyId(w.id);
    setError(null);
    try {
      await withdrawalsApi.adminPaid(w.id);
      removeFromList(w.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cập nhật thất bại.');
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject() {
    if (!rejectFor) return;
    setRejecting(true);
    setError(null);
    try {
      await withdrawalsApi.adminReject(rejectFor.id, { reason: rejectReason.trim() });
      removeFromList(rejectFor.id);
      setRejectFor(null);
      setRejectReason('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Từ chối thất bại.');
    } finally {
      setRejecting(false);
    }
  }

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
            <BreadcrumbPage className="text-ink font-semibold">Rút tiền ngân hàng</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h2 className="font-display font-bold text-ink text-[26px] tracking-tight leading-tight">
          Rút tiền ra ngân hàng (KOL & Brand)
        </h2>
        <p className="text-sm text-mute mt-1">
          Theo dõi yêu cầu KOL và Brand chuyển số dư ví ra tài khoản ngân hàng. Bước riêng, không liên quan giải ngân booking.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5 flex gap-3">
        <Info className="w-5 h-5 text-pin-red shrink-0 mt-0.5" />
        <div className="text-sm text-ink space-y-1.5">
          <p className="font-semibold">Luồng tiền booking (tự động — không cần admin duyệt)</p>
          <ol className="text-mute list-decimal list-inside space-y-0.5 leading-relaxed">
            <li>Brand thanh toán → tiền giữ trong escrow</li>
            <li>KOL giao nội dung → Brand nghiệm thu</li>
            <li>Hệ thống tự giải ngân: KOL nhận net vào ví, nền tảng trích 10% phí</li>
          </ol>
          <p className="text-mute pt-1">
            Trang này dùng khi KOL hoặc Brand muốn rút số dư ví ra ngân hàng — xác nhận sau khi đã chuyển khoản thủ công.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t.value ? 'bg-ink text-on-dark' : 'bg-surface-card text-ink hover:bg-secondary-bg'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void fetchList()}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-mute hover:text-pin-red disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface-card border border-hairline animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-surface-card rounded-2xl border border-hairline">
          <Inbox className="w-12 h-12 text-mute mx-auto mb-3" />
          <p className="font-bold text-ink mb-1">Không có yêu cầu</p>
          <p className="text-mute text-sm">Không có yêu cầu ở trạng thái “{STATUS_LABEL[tab]}”.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((w) => (
              <li
                key={w.id}
                className="bg-surface-card rounded-2xl border border-hairline p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="grid place-items-center w-11 h-11 rounded-full bg-surface-soft text-ink flex-shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-ink text-lg">{vnd(w.amount)}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${STATUS_CLASS[w.status]}`}>
                      {STATUS_LABEL[w.status]}
                    </span>
                  </div>
                  <p className="text-sm text-ink">
                    <span className="font-semibold">{w.bankName}</span> • {w.bankAccount} • {w.accountName}
                  </p>
                  <p className="text-xs text-mute mt-0.5">
                    {requesterLabel(w)} • Tạo {fmtDateTime(w.createdAt)}
                    {w.processedAt ? ` • Xử lý ${fmtDateTime(w.processedAt)}` : ''}
                  </p>
                  {w.rejectReason && <p className="text-xs text-pin-red mt-1">Lý do từ chối: {w.rejectReason}</p>}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {(w.status === 'PENDING' || w.status === 'APPROVED') && (
                    <>
                      <button
                        type="button"
                        onClick={() => doPaid(w)}
                        disabled={busyId === w.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-on-dark bg-ink hover:bg-charcoal transition-colors disabled:opacity-50"
                      >
                        {busyId === w.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CircleDollarSign className="w-4 h-4" />
                        )}
                        Đã chuyển khoản
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectReason('');
                          setRejectFor(w);
                        }}
                        disabled={busyId === w.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-pin-red bg-pin-red/10 hover:bg-pin-red/20 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {rejectFor && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !rejecting && setRejectFor(null)}
        >
          <div className="bg-canvas rounded-2xl shadow-xl w-full max-w-[440px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-ink mb-1">Từ chối yêu cầu rút tiền</h3>
            <p className="text-sm text-mute mb-4">
              Số tiền {vnd(rejectFor.amount)} sẽ được hoàn lại vào số dư khả dụng của{' '}
              {rejectFor.requesterRole === 'BRAND' ? 'Brand' : 'KOL'}.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Lý do từ chối…"
              className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectFor(null)}
                disabled={rejecting}
                className="btn-pin-secondary !rounded-full disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={rejecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pin-red text-on-dark text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
