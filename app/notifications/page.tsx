'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Inbox, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { PaginationBar } from '@/components/pagination-bar';
import { notificationsApi } from '@/lib/api/notifications';
import {
  formatRelative,
  notificationAccent,
  notificationIcon,
  notificationTypeLabel,
} from '@/lib/notifications-meta';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationResponse, PageResponse } from '@/lib/api/types';

const PAGE_SIZE = 15;

type FilterMode = 'all' | 'unread';

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<NotificationResponse> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isAuthLoading, isAuthenticated, router]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const [list, count] = await Promise.all([
        notificationsApi.getAll(page, PAGE_SIZE, filter === 'unread'),
        notificationsApi.getUnreadCount(),
      ]);
      setData(list);
      setUnreadCount(count.count);
    } catch {
      setError('Không tải được thông báo. Vui lòng thử lại.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  function changeFilter(next: FilterMode) {
    if (next === filter) return;
    setFilter(next);
    setPage(0);
  }

  async function handleMarkRead(n: NotificationResponse) {
    if (n.readAt) return;
    try {
      await notificationsApi.markRead(n.id);
      const now = new Date().toISOString();
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((it) =>
                it.id === n.id ? { ...it, readAt: now } : it,
              ),
            }
          : prev,
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      const now = new Date().toISOString();
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((it) => (it.readAt ? it : { ...it, readAt: now })),
            }
          : prev,
      );
      setUnreadCount(0);
      if (filter === 'unread') load();
    } catch {
      // ignore
    }
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-10">
          <div className="flex items-center justify-center py-20 text-mute">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </main>
      </>
    );
  }

  const items = data?.content ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-8 sm:py-10">
        {/* Page header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-full bg-pin-red text-on-dark">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
                  Thông báo
                </h1>
                <p className="text-sm text-mute mt-0.5">
                  {unreadCount > 0
                    ? `Bạn có ${unreadCount} thông báo chưa đọc`
                    : 'Bạn đã đọc tất cả thông báo'}
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-full bg-ink text-on-dark hover:bg-charcoal font-bold text-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </header>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'unread'] as FilterMode[]).map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                onClick={() => changeFilter(f)}
                className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-bold transition-colors ${
                  active
                    ? 'bg-ink text-on-dark'
                    : 'bg-surface-card text-ink hover:bg-secondary-bg'
                }`}
              >
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
                {f === 'unread' && unreadCount > 0 && (
                  <span
                    className={`grid place-items-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold ${
                      active ? 'bg-on-dark text-ink' : 'bg-pin-red text-on-dark'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <section className="bg-canvas rounded-[20px] border border-hairline overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-mute">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-semibold text-pin-red">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-4 inline-flex items-center justify-center px-4 h-9 rounded-full bg-surface-card text-ink hover:bg-secondary-bg text-sm font-bold"
              >
                Thử lại
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="grid place-items-center w-14 h-14 rounded-full bg-surface-card mb-4">
                <Inbox className="w-7 h-7 text-mute" />
              </div>
              <p className="text-base font-bold text-ink">
                {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </p>
              <p className="text-sm text-mute mt-1 max-w-xs">
                Mọi hoạt động liên quan đến đơn đặt, đánh giá và thanh toán sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {items.map((n) => {
                const Icon = notificationIcon(n.type);
                const accent = notificationAccent(n.type);
                const unread = !n.readAt;
                const Row = (
                  <div
                    className={`flex gap-4 px-5 py-4 sm:px-6 sm:py-5 transition-colors ${
                      unread ? 'bg-surface-soft hover:bg-surface-card' : 'hover:bg-surface-card'
                    }`}
                  >
                    <div
                      className={`shrink-0 grid place-items-center w-11 h-11 rounded-full ${accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`text-[15px] leading-snug ${
                            unread ? 'text-ink font-bold' : 'text-body-text font-semibold'
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-mute bg-surface-card px-2 py-0.5 rounded-full">
                          {notificationTypeLabel(n.type)}
                        </span>
                      </div>
                      <p className="text-sm text-body-text mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-ash mt-1.5">{formatRelative(n.createdAt)}</p>
                    </div>
                    {unread && (
                      <span
                        className="shrink-0 mt-2 w-2.5 h-2.5 rounded-full bg-pin-red"
                        aria-label="Chưa đọc"
                      />
                    )}
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => handleMarkRead(n)}
                        className="block"
                      >
                        {Row}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n)}
                        className="block w-full text-left"
                      >
                        {Row}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {data && data.totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={data.totalPages}
            onPage={(p) => setPage(p)}
          />
        )}
      </main>
    </>
  );
}
