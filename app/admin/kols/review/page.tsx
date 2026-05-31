'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X, ExternalLink, Inbox, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaginationBar } from '@/components/pagination-bar';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type { KolProfileResponse, PageResponse } from '@/lib/api/types';

const PAGE_SIZE = 20;
const PENDING_STATUS = 'PENDING_REVIEW';

function formatDate(iso: string): string {
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

export default function AdminKolReviewPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<KolProfileResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row pending state (approve or reject in flight) — keyed by KOL id.
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<KolProfileResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPendingKols({
        status: PENDING_STATUS,
        page,
        size: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : 'Không thể tải danh sách. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function refreshAfterAction() {
    // After approve/reject we may end up on an empty page; clamp page index
    // before refetching so the user lands on something useful.
    if (data && data.content.length === 1 && page > 0) {
      setPage((p) => p - 1);
      return;
    }
    await fetchList();
  }

  async function handleApprove(kol: KolProfileResponse) {
    setPendingId(kol.id);
    try {
      await adminApi.approveKol(kol.id);
      toast.success(`Đã duyệt KOL "${kol.displayName}"`);
      await refreshAfterAction();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Không thể duyệt. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  }

  function openReject(kol: KolProfileResponse) {
    setRejectTarget(kol);
    setRejectReason('');
    setReasonError(null);
  }

  function closeReject() {
    if (pendingId === rejectTarget?.id) return; // prevent close while submitting
    setRejectTarget(null);
    setRejectReason('');
    setReasonError(null);
  }

  async function submitReject() {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setReasonError('Vui lòng nhập lý do từ chối.');
      return;
    }
    if (reason.length < 5) {
      setReasonError('Lý do phải có ít nhất 5 ký tự.');
      return;
    }
    setReasonError(null);
    setPendingId(rejectTarget.id);
    try {
      await adminApi.rejectKol(rejectTarget.id, { reason });
      toast.success(`Đã từ chối KOL "${rejectTarget.displayName}"`);
      setRejectTarget(null);
      setRejectReason('');
      await refreshAfterAction();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Không thể từ chối. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  }

  const items = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-display font-bold text-ink text-[20px] tracking-tight">
          Hồ sơ KOL chờ duyệt{' '}
          {!isLoading && (
            <span className="text-pin-red">({totalElements})</span>
          )}
        </h2>
        <button
          type="button"
          onClick={fetchList}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold hover:bg-secondary-bg disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Content region */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
          <AlertCircle className="w-10 h-10 text-pin-red mx-auto mb-3" />
          <p className="text-pin-red text-base font-bold mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchList}
            className="btn-pin-secondary !rounded-full"
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
          <Inbox className="w-12 h-12 text-mute mx-auto mb-4" />
          <p className="text-ink text-lg font-bold mb-1">Không có KOL chờ duyệt</p>
          <p className="text-mute text-sm">
            Tất cả hồ sơ đã được xử lý. Quay lại sau khi có hồ sơ mới.
          </p>
        </div>
      ) : (
        <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-card">
                <tr className="text-left text-ink">
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Tên hiển thị
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Slug
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((kol) => {
                  const isRowPending = pendingId === kol.id;
                  return (
                    <tr
                      key={kol.id}
                      className="border-t border-hairline-soft hover:bg-surface-card/40 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          {kol.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={kol.avatarUrl}
                              alt={kol.displayName}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="grid place-items-center w-10 h-10 rounded-full bg-ink text-on-dark font-bold text-sm shrink-0">
                              {kol.displayName?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-ink truncate">
                              {kol.displayName}
                            </p>
                            <p className="text-xs text-mute mt-0.5">
                              ID #{kol.id} • user #{kol.userId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/kol/${kol.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-ink hover:text-pin-red font-mono text-xs"
                        >
                          {kol.slug}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-top text-mute text-xs whitespace-nowrap">
                        {formatDate(kol.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(kol)}
                            disabled={isRowPending}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isRowPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => openReject(kol)}
                            disabled={isRowPending}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPage={(p) => {
          setPage(p);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Reject reason modal */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeReject();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối KOL</DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>
                  Hồ sơ <span className="font-bold text-ink">{rejectTarget.displayName}</span>{' '}
                  sẽ được đánh dấu là từ chối. KOL sẽ nhận thông báo cùng lý do.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              htmlFor="reject-reason"
              className="block text-sm font-bold text-ink"
            >
              Lý do từ chối <span className="text-pin-red">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  submitReject();
                }
              }}
              rows={4}
              maxLength={500}
              placeholder="Vui lòng mô tả rõ lý do để KOL có thể chỉnh sửa và gửi lại…"
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-focus-outer"
              autoFocus
              disabled={pendingId === rejectTarget?.id}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={reasonError ? 'text-pin-red font-semibold' : 'text-mute'}>
                {reasonError ?? 'Tối thiểu 5 ký tự'}
              </span>
              <span className="text-mute">{rejectReason.length}/500</span>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={closeReject}
              disabled={pendingId === rejectTarget?.id}
              className="rounded-full px-4 py-2 text-sm font-bold bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submitReject}
              disabled={pendingId === rejectTarget?.id}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {pendingId === rejectTarget?.id && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Xác nhận từ chối
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
      <div className="bg-surface-card h-11" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-t border-hairline-soft"
        >
          <div className="w-10 h-10 rounded-full bg-surface-card animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-surface-card rounded animate-pulse w-1/3" />
            <div className="h-3 bg-surface-card rounded animate-pulse w-1/4" />
          </div>
          <div className="w-24 h-7 rounded-full bg-surface-card animate-pulse" />
          <div className="w-24 h-7 rounded-full bg-surface-card animate-pulse" />
        </div>
      ))}
    </div>
  );
}
