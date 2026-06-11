import {
  Bell,
  CalendarPlus,
  CalendarCheck2,
  CalendarX,
  CalendarClock,
  PlayCircle,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Star,
  BadgeCheck,
  BadgeX,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@/lib/api/types';

/** Lucide icon for each notification type. */
export function notificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case 'BOOKING_CREATED': return CalendarPlus;
    case 'BOOKING_ACCEPTED': return CalendarCheck2;
    case 'BOOKING_REJECTED': return CalendarX;
    case 'BOOKING_CANCELLED': return CalendarX;
    case 'BOOKING_IN_PROGRESS': return PlayCircle;
    case 'DELIVERABLE_SUBMITTED': return FileUp;
    case 'BOOKING_COMPLETED': return CheckCircle2;
    case 'BOOKING_DISPUTED': return AlertTriangle;
    case 'PAYMENT_SUCCESS': return Wallet;
    case 'REVIEW_RECEIVED': return Star;
    case 'WITHDRAW_APPROVED': return Wallet;
    case 'WITHDRAW_REJECTED': return CalendarClock;
    case 'PROFILE_APPROVED': return BadgeCheck;
    case 'PROFILE_REJECTED': return BadgeX;
    case 'NEW_MESSAGE': return MessageSquare;
    default: return Bell;
  }
}

/** Tailwind background + text class pair for the icon bubble. */
export function notificationAccent(type: NotificationType): string {
  switch (type) {
    case 'BOOKING_CREATED':
    case 'BOOKING_IN_PROGRESS':
    case 'DELIVERABLE_SUBMITTED':
      return 'bg-surface-card text-ink';
    case 'BOOKING_ACCEPTED':
    case 'BOOKING_COMPLETED':
    case 'PROFILE_APPROVED':
    case 'WITHDRAW_APPROVED':
      return 'bg-[color:var(--success-pale)] text-[color:var(--success-deep)]';
    case 'BOOKING_REJECTED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_DISPUTED':
    case 'PROFILE_REJECTED':
    case 'WITHDRAW_REJECTED':
      return 'bg-pin-red/10 text-pin-red';
    case 'PAYMENT_SUCCESS':
      return 'bg-[color:var(--success-pale)] text-[color:var(--success-deep)]';
    case 'REVIEW_RECEIVED':
      return 'bg-[color:var(--accent-purple)]/10 text-[color:var(--accent-purple)]';
    case 'NEW_MESSAGE':
      return 'bg-[color:var(--accent-pressed-blue)]/10 text-[color:var(--accent-pressed-blue)]';
    default:
      return 'bg-surface-card text-ink';
  }
}

/** Vietnamese human-readable label per type. */
export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'BOOKING_CREATED': return 'Đơn đặt mới';
    case 'BOOKING_ACCEPTED': return 'Đơn đã chấp nhận';
    case 'BOOKING_REJECTED': return 'Đơn bị từ chối';
    case 'BOOKING_CANCELLED': return 'Đơn bị hủy';
    case 'BOOKING_IN_PROGRESS': return 'Đang thực hiện';
    case 'DELIVERABLE_SUBMITTED': return 'Đã giao kết quả';
    case 'BOOKING_COMPLETED': return 'Đơn hoàn thành';
    case 'BOOKING_DISPUTED': return 'Tranh chấp';
    case 'PAYMENT_SUCCESS': return 'Thanh toán thành công';
    case 'REVIEW_RECEIVED': return 'Nhận đánh giá';
    case 'WITHDRAW_APPROVED': return 'Rút tiền chấp nhận';
    case 'WITHDRAW_REJECTED': return 'Rút tiền bị từ chối';
    case 'PROFILE_APPROVED': return 'Hồ sơ duyệt';
    case 'PROFILE_REJECTED': return 'Hồ sơ bị từ chối';
    case 'NEW_MESSAGE': return 'Tin nhắn mới';
    default: return 'Thông báo';
  }
}

/** Compact "x phút trước" formatter that falls back to date when older than 7d. */
export function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
