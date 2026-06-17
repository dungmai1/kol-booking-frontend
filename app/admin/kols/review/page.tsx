'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  X,
  ExternalLink,
  Eye,
  Inbox,
  Loader2,
  RefreshCw,
  AlertCircle,
  User,
} from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PaginationBar } from '@/components/pagination-bar';
import { adminApi } from '@/lib/api/admin';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import type {
  KolProfileResponse,
  KolSocialChannelResponse,
  KolPricingPackageResponse,
  KolPortfolioItemResponse,
  PageResponse,
} from '@/lib/api/types';

const PAGE_SIZE = 20;
const PENDING_STATUS = 'PENDING_REVIEW';

const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

const PACKAGE_TYPE_LABEL: Record<string, string> = {
  VIDEO: 'Video',
  POST: 'Bài viết',
  STORY: 'Story',
  REEL: 'Reel',
  REVIEW: 'Review',
  LIVESTREAM: 'Livestream',
};

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

function vnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── KOL Detail Sheet ─────────────────────────────────────────────────────────

interface KolDetailSheetProps {
  kol: KolProfileResponse | null;
  onClose: () => void;
  onApprove: (kol: KolProfileResponse) => void;
  onReject: (kol: KolProfileResponse) => void;
  pendingId: number | null;
}

function KolDetailSheet({ kol, onClose, onApprove, onReject, pendingId }: KolDetailSheetProps) {
  const isLoading = kol !== null && pendingId === kol.id;

  return (
    <Sheet open={kol !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] overflow-y-auto">
        {kol && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>Hồ sơ KOL chờ duyệt</SheetTitle>
            </SheetHeader>

            {/* Avatar + name */}
            <div className="flex items-start gap-4 mb-5">
              {kol.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(kol.avatarUrl)}
                  alt={kol.displayName}
                  className="w-16 h-16 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="grid place-items-center w-16 h-16 rounded-full bg-ink text-on-dark font-bold text-xl shrink-0">
                  {kol.displayName?.[0]?.toUpperCase() ?? <User className="w-6 h-6" />}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-bold text-ink text-lg leading-tight">{kol.displayName}</p>
                <p className="text-xs text-mute mt-0.5">@{kol.slug}</p>
                <p className="text-xs text-mute mt-0.5">ID #{kol.id} · User #{kol.userId}</p>
                <p className="text-xs text-mute mt-0.5">Đăng ký: {formatDate(kol.createdAt)}</p>
                {(kol.city || kol.country) && (
                  <p className="text-xs text-mute mt-0.5">
                    {[kol.city, kol.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {kol.bio && (
              <section className="mb-5">
                <h3 className="text-xs font-bold text-mute uppercase tracking-wide mb-1.5">Giới thiệu</h3>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{kol.bio}</p>
              </section>
            )}

            {/* Social channels */}
            {kol.channels && kol.channels.length > 0 && (
              <section className="mb-5">
                <h3 className="text-xs font-bold text-mute uppercase tracking-wide mb-2">
                  Kênh mạng xã hội ({kol.channels.length})
                </h3>
                <div className="space-y-2">
                  {kol.channels.map((ch: KolSocialChannelResponse) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink">
                          {PLATFORM_LABEL[ch.platform] ?? ch.platform}
                          {ch.verified && (
                            <span className="ml-1.5 text-emerald-600">(đã xác minh)</span>
                          )}
                        </p>
                        {ch.username && (
                          <p className="text-xs text-mute truncate">@{ch.username}</p>
                        )}
                        {ch.url && (
                          <a
                            href={ch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-pin-red hover:underline truncate block"
                          >
                            {ch.url}
                          </a>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-ink">
                          {formatFollowers(ch.followerCount)}
                        </p>
                        <p className="text-xs text-mute">followers</p>
                        {ch.engagementRate > 0 && (
                          <p className="text-xs text-mute">{ch.engagementRate.toFixed(1)}% ER</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pricing packages */}
            {kol.pricingPackages && kol.pricingPackages.length > 0 && (
              <section className="mb-5">
                <h3 className="text-xs font-bold text-mute uppercase tracking-wide mb-2">
                  Bảng giá ({kol.pricingPackages.length} gói)
                </h3>
                <div className="space-y-1.5">
                  {kol.pricingPackages.map((pkg: KolPricingPackageResponse) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface-card px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-ink">
                          {PACKAGE_TYPE_LABEL[pkg.type] ?? pkg.type} ·{' '}
                          {PLATFORM_LABEL[pkg.platform] ?? pkg.platform}
                        </p>
                        {pkg.description && (
                          <p className="text-xs text-mute mt-0.5">{pkg.description}</p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-ink shrink-0">{vnd(pkg.price)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio */}
            {kol.portfolio && kol.portfolio.length > 0 && (
              <section className="mb-5">
                <h3 className="text-xs font-bold text-mute uppercase tracking-wide mb-2">
                  Portfolio ({kol.portfolio.length} mục)
                </h3>
                <div className="space-y-1.5">
                  {kol.portfolio.map((item: KolPortfolioItemResponse) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate">{item.title}</p>
                        {item.campaignName && (
                          <p className="text-xs text-mute truncate">{item.campaignName}</p>
                        )}
                      </div>
                      {item.mediaUrl && (
                        <a
                          href={item.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-pin-red hover:underline shrink-0"
                        >
                          Xem <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No channels/packages warning */}
            {(!kol.channels || kol.channels.length === 0) &&
              (!kol.pricingPackages || kol.pricingPackages.length === 0) && (
                <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  KOL chưa thêm kênh mạng xã hội hoặc bảng giá.
                </div>
              )}

            {/* Reject reason (if previously rejected) */}
            {kol.rejectReason && (
              <section className="mb-5">
                <h3 className="text-xs font-bold text-mute uppercase tracking-wide mb-1.5">
                  Lý do từ chối trước
                </h3>
                <p className="text-sm text-pin-red">{kol.rejectReason}</p>
              </section>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-hairline-soft">
              <button
                type="button"
                onClick={() => onApprove(kol)}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Duyệt KOL
              </button>
              <button
                type="button"
                onClick={() => onReject(kol)}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4" />
                Từ chối
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminKolReviewPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<KolProfileResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingId, setPendingId] = useState<number | null>(null);

  // Detail sheet
  const [detailKol, setDetailKol] = useState<KolProfileResponse | null>(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<KolProfileResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const [stableRejectName, setStableRejectName] = useState<string>('');
  useEffect(() => {
    if (rejectTarget) setStableRejectName(rejectTarget.displayName);
  }, [rejectTarget]);

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
    setDetailKol(null);
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
    if (pendingId === rejectTarget?.id) return;
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
                    Kênh / Followers
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
                  const topChannel = kol.channels?.[0];
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
                              src={resolveMediaUrl(kol.avatarUrl)}
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
                              ID #{kol.id} · user #{kol.userId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {topChannel ? (
                          <div>
                            <p className="text-xs font-bold text-ink">
                              {PLATFORM_LABEL[topChannel.platform] ?? topChannel.platform}
                            </p>
                            <p className="text-xs text-mute">
                              {formatFollowers(topChannel.followerCount)} followers
                            </p>
                            {kol.channels.length > 1 && (
                              <p className="text-xs text-mute">+{kol.channels.length - 1} kênh khác</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-mute">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-mute text-xs whitespace-nowrap">
                        {formatDate(kol.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setDetailKol(kol)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-surface-card text-ink border border-hairline hover:bg-secondary-bg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem
                          </button>
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
                          <Link
                            href={`/kol/${kol.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-mute hover:text-ink"
                            title="Xem trang công khai"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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

      {/* KOL Detail Sheet */}
      <KolDetailSheet
        kol={detailKol}
        onClose={() => setDetailKol(null)}
        onApprove={(kol) => {
          setDetailKol(null);
          handleApprove(kol);
        }}
        onReject={(kol) => {
          setDetailKol(null);
          openReject(kol);
        }}
        pendingId={pendingId}
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
              Hồ sơ <span className="font-bold text-ink">{stableRejectName}</span>{' '}
              sẽ được đánh dấu là từ chối. KOL sẽ nhận thông báo cùng lý do.
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
          <div className="w-20 h-7 rounded-full bg-surface-card animate-pulse" />
          <div className="w-20 h-7 rounded-full bg-surface-card animate-pulse" />
          <div className="w-20 h-7 rounded-full bg-surface-card animate-pulse" />
        </div>
      ))}
    </div>
  );
}
