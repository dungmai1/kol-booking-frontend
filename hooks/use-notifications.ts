'use client';

import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import type { NotificationResponse, PageResponse } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSse } from '@/hooks/use-sse';

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
 * - Streams real-time notifications via SSE while authenticated.
 * - Fetches the initial unread count on mount.
 * - `refreshRecent` is called on demand (e.g. when the dropdown opens).
 */
export function useNotifications(): UseNotificationsResult {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<NotificationResponse[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

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
  }, [isAuthenticated, refreshUnread]);

  const handleSseEvent = useCallback(
    (eventName: string, data: string) => {
      if (eventName === 'heartbeat' || eventName === 'connected') return;
      if (eventName === 'notification') {
        try {
          const notification: NotificationResponse = JSON.parse(data);
          setRecent((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev].slice(0, 8);
          });
          setUnreadCount((c) => c + 1);
        } catch {
          // malformed JSON — ignore
        }
      }
    },
    [],
  );

  useSse({
    path: '/notifications/stream',
    enabled: isAuthenticated,
    onEvent: handleSseEvent,
  });

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
