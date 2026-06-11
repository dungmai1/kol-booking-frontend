'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Inbox, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import {
  notificationIcon,
  notificationAccent,
  formatRelative,
} from '@/lib/notifications-meta';
import type { NotificationResponse } from '@/lib/api/types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const {
    unreadCount,
    recent,
    isLoadingRecent,
    refreshRecent,
    markRead,
    markAllRead,
  } = useNotifications();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) refreshRecent();
  }

  async function handleItemClick(n: NotificationResponse) {
    setOpen(false);
    if (!n.readAt) await markRead(n.id);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Thông báo"
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-pin-red text-on-dark text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[360px] sm:w-[400px] bg-canvas rounded-[20px] z-50 border border-hairline shadow-[0_20px_50px_-12px_rgba(0,0,0,0.22)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-hairline-soft">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-ink">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-pin-red text-on-dark text-[11px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-mute hover:text-ink transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {isLoadingRecent ? (
              <div className="flex items-center justify-center py-12 text-mute">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="grid place-items-center w-12 h-12 rounded-full bg-surface-card mb-3">
                  <Inbox className="w-6 h-6 text-mute" />
                </div>
                <p className="text-sm font-semibold text-ink">Chưa có thông báo</p>
                <p className="text-xs text-mute mt-1">
                  Khi có hoạt động mới, bạn sẽ thấy ở đây.
                </p>
              </div>
            ) : (
              <ul className="py-1">
                {recent.map((n) => {
                  const Icon = notificationIcon(n.type);
                  const accent = notificationAccent(n.type);
                  const unread = !n.readAt;
                  const Inner = (
                    <div
                      className={`flex gap-3 px-5 py-3 transition-colors ${
                        unread ? 'bg-surface-soft hover:bg-surface-card' : 'hover:bg-surface-card'
                      }`}
                    >
                      <div
                        className={`shrink-0 grid place-items-center w-9 h-9 rounded-full ${accent}`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug line-clamp-2 ${
                            unread ? 'text-ink font-bold' : 'text-body-text font-semibold'
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-mute mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-ash mt-1">{formatRelative(n.createdAt)}</p>
                      </div>
                      {unread && (
                        <span
                          className="shrink-0 mt-2 w-2 h-2 rounded-full bg-pin-red"
                          aria-label="Chưa đọc"
                        />
                      )}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link href={n.link} onClick={() => handleItemClick(n)} className="block">
                          {Inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className="block w-full text-left"
                        >
                          {Inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-hairline-soft px-5 py-3 bg-surface-soft">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-[13px] font-bold text-ink hover:text-pin-red transition-colors"
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
