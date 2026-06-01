'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Ban,
  ShieldCheck,
  Inbox,
  Loader2,
  RefreshCw,
  AlertCircle,
  X as XIcon,
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
import { PaginationBar } from '@/components/pagination-bar';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AdminUserResponse,
  PageResponse,
  Role,
  UserStatus,
} from '@/lib/api/types';

const PAGE_SIZE = 20;

type RoleFilter = 'ALL' | Role;
type StatusFilter = 'ALL' | UserStatus;

const ROLE_OPTIONS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'BRAND', label: 'Brand' },
  { value: 'KOL', label: 'KOL' },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'BANNED', label: 'Đã bị cấm' },
  { value: 'PENDING_VERIFICATION', label: 'Chờ xác minh' },
];

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'bg-pin-red text-on-dark',
  BRAND: 'bg-sky-100 text-sky-700 border border-sky-200',
  KOL: 'bg-violet-100 text-violet-700 border border-violet-200',
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  BRAND: 'Brand',
  KOL: 'KOL',
};

const STATUS_PILL: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  BANNED: 'bg-rose-100 text-rose-700 border border-rose-200',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-700 border border-amber-200',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Hoạt động',
  BANNED: 'Bị cấm',
  PENDING_VERIFICATION: 'Chờ xác minh',
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

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type ConfirmAction = 'ban' | 'unban';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounced(search.trim(), 350);

  const [data, setData] = useState<PageResponse<AdminUserResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    user: AdminUserResponse;
    action: ConfirmAction;
  } | null>(null);

  // Reset to first page whenever a filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({
        search: debouncedSearch || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        size: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : 'Không thể tải danh sách người dùng. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function runAction(target: AdminUserResponse, action: ConfirmAction) {
    setPendingId(target.id);
    try {
      if (action === 'ban') {
        await adminApi.banUser(target.id);
        toast.success(`Đã cấm người dùng ${target.email}`);
      } else {
        await adminApi.unbanUser(target.id);
        toast.success(`Đã mở khóa người dùng ${target.email}`);
      }
      setConfirmTarget(null);
      await fetchList();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : action === 'ban'
            ? 'Không thể cấm người dùng. Vui lòng thử lại.'
            : 'Không thể mở khóa người dùng. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  }

  const items = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const activeFilterCount = useMemo(
    () =>
      (debouncedSearch ? 1 : 0) +
      (roleFilter !== 'ALL' ? 1 : 0) +
      (statusFilter !== 'ALL' ? 1 : 0),
    [debouncedSearch, roleFilter, statusFilter],
  );

  function resetFilters() {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  }

  return (
    <>
      {/* Heading */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-display font-bold text-ink text-[20px] tracking-tight">
          Quản lý người dùng{' '}
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

      {/* Filter bar */}
      <div className="bg-canvas rounded-md border border-hairline p-3 sm:p-4 mb-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo email…"
              className="w-full rounded-full border border-hairline bg-surface-card pl-9 pr-9 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-focus-outer"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded-full text-mute hover:bg-secondary-bg hover:text-ink transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="rounded-full border border-hairline bg-surface-card px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-focus-outer"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-full border border-hairline bg-surface-card px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-focus-outer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-ink hover:bg-secondary-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <XIcon className="w-4 h-4" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Content */}
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
          <p className="text-ink text-lg font-bold mb-1">
            Không tìm thấy người dùng
          </p>
          <p className="text-mute text-sm">
            {activeFilterCount > 0
              ? 'Hãy thử nới rộng bộ lọc hoặc đổi từ khóa tìm kiếm.'
              : 'Chưa có người dùng nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-card">
                <tr className="text-left text-ink">
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide w-16">
                    ID
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide">
                    Trạng thái
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
                {items.map((u) => {
                  const isRowPending = pendingId === u.id;
                  const isSelf = currentUser?.userId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-hairline-soft hover:bg-surface-card/40 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle font-mono text-xs text-mute">
                        #{u.id}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-ink truncate">
                            {u.email}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-mute bg-surface-card border border-hairline rounded-full px-2 py-0.5">
                              bạn
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_BADGE[u.role]}`}
                        >
                          {ROLE_LABEL[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[u.status]}`}
                        >
                          {STATUS_LABEL[u.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-mute text-xs whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmTarget({ user: u, action: 'ban' })
                              }
                              disabled={isRowPending || isSelf}
                              title={
                                isSelf
                                  ? 'Bạn không thể tự cấm tài khoản của mình'
                                  : undefined
                              }
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isRowPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                              Cấm
                            </button>
                          )}
                          {u.status === 'BANNED' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmTarget({ user: u, action: 'unban' })
                              }
                              disabled={isRowPending}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isRowPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              )}
                              Mở khóa
                            </button>
                          )}
                          {u.status === 'PENDING_VERIFICATION' && (
                            <span className="text-xs text-mute italic">
                              Chờ người dùng xác minh
                            </span>
                          )}
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

      {/* Confirm dialog */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open && pendingId === null) setConfirmTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.action === 'ban'
                ? 'Cấm người dùng'
                : 'Mở khóa người dùng'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.action === 'ban' ? (
                <>
                  Tài khoản{' '}
                  <span className="font-bold text-ink">
                    {confirmTarget?.user.email}
                  </span>{' '}
                  sẽ bị chặn đăng nhập và sử dụng dịch vụ. Bạn có thể mở khóa lại
                  sau.
                </>
              ) : (
                <>
                  Tài khoản{' '}
                  <span className="font-bold text-ink">
                    {confirmTarget?.user.email}
                  </span>{' '}
                  sẽ được phục hồi quyền truy cập bình thường.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmTarget(null)}
              disabled={pendingId !== null}
              className="rounded-full px-4 py-2 text-sm font-bold bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() =>
                confirmTarget &&
                runAction(confirmTarget.user, confirmTarget.action)
              }
              disabled={pendingId !== null}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 transition-colors ${
                confirmTarget?.action === 'ban'
                  ? 'bg-pin-red text-on-dark hover:opacity-90'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {pendingId !== null && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {confirmTarget?.action === 'ban' ? 'Xác nhận cấm' : 'Xác nhận mở khóa'}
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
          <div className="w-10 h-4 bg-surface-card rounded animate-pulse" />
          <div className="flex-1 h-4 bg-surface-card rounded animate-pulse" />
          <div className="w-16 h-5 rounded-full bg-surface-card animate-pulse" />
          <div className="w-20 h-5 rounded-full bg-surface-card animate-pulse" />
          <div className="w-28 h-4 bg-surface-card rounded animate-pulse" />
          <div className="w-20 h-7 rounded-full bg-surface-card animate-pulse" />
        </div>
      ))}
    </div>
  );
}
