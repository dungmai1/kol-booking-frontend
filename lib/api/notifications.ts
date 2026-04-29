import { api } from './client';
import type {
  NotificationResponse,
  UnreadCountResponse,
  ReadAllResponse,
  PageResponse,
} from './types';

export const notificationsApi = {
  getAll(page = 0, size = 20, unreadOnly = false): Promise<PageResponse<NotificationResponse>> {
    const q = api.buildQuery({ page, size, unreadOnly: unreadOnly || undefined });
    return api.get(`/notifications/me${q}`);
  },

  getUnreadCount(): Promise<UnreadCountResponse> {
    return api.get('/notifications/me/unread-count');
  },

  markRead(id: number): Promise<NotificationResponse> {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllRead(): Promise<ReadAllResponse> {
    return api.post('/notifications/me/read-all');
  },
};
