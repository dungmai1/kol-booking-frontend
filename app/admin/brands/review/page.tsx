'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  X,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
  AlertCircle,
  Building2,
  Globe,
  MapPin,
  Phone,
  User,
  Hash,
  Briefcase,
  Flag,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/pagination-bar';
import { adminApi } from '@/lib/api/admin';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import {
  isPendingReview,
  profileStatusBadgeVariant,
  profileStatusDisplayLabel,
} from '@/lib/profile-status';
import type { BrandProfileResponse, PageResponse } from '@/lib/api/types';

const PAGE_SIZE = 20;

// Bộ lọc trạng thái — admin có thể xem toàn bộ Brand ở mọi trạng thái.
const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'DRAFT', label: 'Bản nháp' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

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

export default function AdminBrandReviewPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING_REVIEW');
  const [data, setData] = useState<PageResponse<BrandProfileResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row pending state (approve or reject in flight) — keyed by Brand id.
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Detail drawer state
  const [detailTarget, setDetailTarget] = useState<BrandProfileResponse | null>(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<BrandProfileResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Retain the last target's name during the dialog's close animation so the
  // body content does not blank out mid-fade (QA reads that as a flicker).
  const [stableRejectName, setStableRejectName] = useState<string>('');
  useEffect(() => {
    if (rejectTarget) setStableRejectName(rejectTarget.companyName);
  }, [rejectTarget]);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPendingBrands({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
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
  }, [page, statusFilter]);

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

  async function handleApprove(brand: BrandProfileResponse) {
    setPendingId(brand.id);
    try {
      await adminApi.approveBrand(brand.id);
      toast.success(`Đã duyệt Brand "${brand.companyName}"`);
      await refreshAfterAction();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Không thể duyệt. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  }

  function openReject(brand: BrandProfileResponse) {
    setRejectTarget(brand);
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
      await adminApi.rejectBrand(rejectTarget.id, { reason });
      toast.success(`Đã từ chối Brand "${rejectTarget.companyName}"`);
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
          Hồ sơ Brand{' '}
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

      {/* Status filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                if (f.value === statusFilter) return;
                setPage(0);
                setStatusFilter(f.value);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                active
                  ? 'bg-ink text-on-dark'
                  : 'bg-surface-card text-ink hover:bg-secondary-bg'
              }`}
            >
              {f.label}
            </button>
          );
        })}
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
          <p className="text-ink text-lg font-bold mb-1">Không có hồ sơ Brand</p>
          <p className="text-mute text-sm">
            {statusFilter === 'ALL'
              ? 'Chưa có Brand nào trong hệ thống.'
              : 'Không có Brand nào ở trạng thái đã chọn.'}
          </p>
        </div>
      ) : (
        <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-card">
                <tr className="text-left text-ink">
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Tên doanh nghiệp
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Ngành
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    Mã số thuế
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Người liên hệ
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    SĐT
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((brand) => {
                  const isRowPending = pendingId === brand.id;
                  return (
                    <tr
                      key={brand.id}
                      onClick={() => setDetailTarget(brand)}
                      className="border-t border-hairline-soft hover:bg-surface-card/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          {brand.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(brand.logoUrl)}
                              alt={brand.companyName}
                              className="w-10 h-10 rounded-full object-cover shrink-0 bg-surface-card"
                            />
                          ) : (
                            <span className="grid place-items-center w-10 h-10 rounded-full bg-ink text-on-dark font-bold text-sm shrink-0">
                              {brand.companyName?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-ink truncate">
                              {brand.companyName}
                            </p>
                            <p className="text-xs text-mute mt-0.5">
                              ID #{brand.id} • user #{brand.userId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-ink">
                        {brand.industry || <span className="text-mute">—</span>}
                      </td>
                      <td className="px-4 py-3 align-top text-mute text-xs whitespace-nowrap font-mono">
                        {brand.taxCode || '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-ink">
                        {brand.contactName || <span className="text-mute">—</span>}
                      </td>
                      <td className="px-4 py-3 align-top text-mute text-xs whitespace-nowrap">
                        {brand.contactPhone || '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-mute text-xs whitespace-nowrap">
                        {formatDate(brand.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Badge variant={profileStatusBadgeVariant(brand.status)}>
                          {profileStatusDisplayLabel(brand.status)}
                        </Badge>
                      </td>
                      <td
                        className="px-4 py-3 align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPendingReview(brand.status) ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(brand)}
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
                              onClick={() => openReject(brand)}
                              disabled={isRowPending}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <span className="text-xs text-mute">Xem chi tiết</span>
                          </div>
                        )}
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

      {/* Detail Sheet */}
      <Sheet
        open={detailTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 bg-canvas overflow-y-auto"
        >
          {detailTarget && (
            <>
              <SheetHeader className="border-b border-hairline-soft p-6">
                <div className="flex items-start gap-4">
                  {detailTarget.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(detailTarget.logoUrl)}
                      alt={detailTarget.companyName}
                      className="w-14 h-14 rounded-full object-cover shrink-0 bg-surface-card"
                    />
                  ) : (
                    <span className="grid place-items-center w-14 h-14 rounded-full bg-ink text-on-dark font-bold text-lg shrink-0">
                      {detailTarget.companyName?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="font-display text-ink text-[20px] tracking-tight leading-tight break-words">
                      {detailTarget.companyName}
                    </SheetTitle>
                    <SheetDescription className="text-mute text-xs mt-1">
                      Brand ID #{detailTarget.id} • user #{detailTarget.userId}
                    </SheetDescription>
                    <div className="mt-2">
                      <Badge variant={profileStatusBadgeVariant(detailTarget.status)}>
                        {profileStatusDisplayLabel(detailTarget.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="p-6 space-y-5">
                <DetailRow
                  icon={Building2}
                  label="Tên doanh nghiệp"
                  value={detailTarget.companyName}
                />
                <DetailRow
                  icon={Hash}
                  label="Mã số thuế"
                  value={detailTarget.taxCode}
                  mono
                />
                <DetailRow
                  icon={Briefcase}
                  label="Ngành"
                  value={detailTarget.industry}
                />
                <DetailRow
                  icon={Globe}
                  label="Website"
                  value={detailTarget.website}
                  link
                />
                <DetailRow
                  icon={MapPin}
                  label="Địa chỉ"
                  value={detailTarget.address}
                />
                <DetailRow
                  icon={Flag}
                  label="Quốc gia"
                  value={detailTarget.country}
                />
                <DetailRow
                  icon={User}
                  label="Người liên hệ"
                  value={detailTarget.contactName}
                />
                <DetailRow
                  icon={Phone}
                  label="Số điện thoại"
                  value={detailTarget.contactPhone}
                />
                <DetailRow
                  icon={FileText}
                  label="Giới thiệu"
                  value={detailTarget.bio}
                />
                <DetailRow
                  icon={Clock}
                  label="Ngày tạo"
                  value={formatDate(detailTarget.createdAt)}
                />
                <DetailRow
                  icon={Clock}
                  label="Cập nhật gần nhất"
                  value={formatDate(detailTarget.updatedAt)}
                />
                {detailTarget.rejectReason && (
                  <DetailRow
                    icon={ShieldAlert}
                    label="Lý do từ chối"
                    value={detailTarget.rejectReason}
                  />
                )}
              </div>

              {isPendingReview(detailTarget.status) && (
                <div className="border-t border-hairline-soft p-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailTarget;
                      setDetailTarget(null);
                      if (target) handleApprove(target);
                    }}
                    disabled={pendingId === detailTarget.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {pendingId === detailTarget.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailTarget;
                      setDetailTarget(null);
                      if (target) openReject(target);
                    }}
                    disabled={pendingId === detailTarget.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Từ chối
                  </button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject reason modal */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeReject();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối Brand</DialogTitle>
            <DialogDescription>
              Hồ sơ <span className="font-bold text-ink">{stableRejectName}</span>{' '}
              sẽ được đánh dấu là từ chối. Brand sẽ nhận thông báo cùng lý do.
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
              placeholder="Vui lòng mô tả rõ lý do để Brand có thể chỉnh sửa và gửi lại…"
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

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  link = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  link?: boolean;
}) {
  const isEmpty = !value;
  return (
    <div className="flex items-start gap-3">
      <span className="grid place-items-center w-8 h-8 rounded-full bg-surface-card text-ink shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-mute">
          {label}
        </p>
        {isEmpty ? (
          <p className="text-sm text-mute mt-0.5 italic">Chưa cập nhật</p>
        ) : link ? (
          <a
            href={value!.startsWith('http') ? value! : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-ink font-semibold mt-0.5 hover:text-pin-red break-all"
          >
            {value}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : (
          <p
            className={`text-sm text-ink mt-0.5 break-words ${mono ? 'font-mono' : ''}`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
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
