'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import type { NotificationResponse, PageResponse } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';

const POLL_INTERVAL_MS = 30_000;

interface UseNotificationsResult {
  unreadCount: number;
  recent: NotificationResponse[];
  isLoadingRecent: boolean;
  refreshUnread: () => Promise<void>;
  refreshRecent: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Lightweight client-side notification state.
 * - Polls unread count every 30s while the tab is visible.
 * - `refreshRecent` is called on demand (e.g. when the dropdown opens).
 */
export function useNotifications(): UseNotificationsResult {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<NotificationResponse[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // silent — header poll shouldn't surface errors
    }
  }, [isAuthenticated]);

  const refreshRecent = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingRecent(true);
    try {
      const page: PageResponse<NotificationResponse> = await notificationsApi.getAll(0, 8, false);
      setRecent(page.content);
    } catch {
      setRecent([]);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [isAuthenticated]);

  const markRead = useCallback(
    async (id: number) => {
      try {
        await notificationsApi.markRead(id);
      } catch {
        return;
      }
      setRecent((prev) =>
        prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
    } catch {
      return;
    }
    const now = new Date().toISOString();
    setRecent((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecent([]);
      return;
    }
    refreshUnread();
    pollRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      refreshUnread();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [isAuthenticated, refreshUnread]);

  return {
    unreadCount,
    recent,
    isLoadingRecent,
    refreshUnread,
    refreshRecent,
    markRead,
    markAllRead,
  };
}
