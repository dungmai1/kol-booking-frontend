'use client';

import {
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Hourglass,
  Package,
  Trophy,
  AlertTriangle,
  ShieldX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BookingStatus } from '@/lib/api/types';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABEL } from '@/lib/bookings/status';

const ICON: Record<BookingStatus, LucideIcon> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
  CANCELLED: Ban,
  IN_PROGRESS: Hourglass,
  DELIVERED: Package,
  COMPLETED: Trophy,
  DISPUTED: AlertTriangle,
  CANCELLED_BY_ADMIN: ShieldX,
  DELIVERY_REJECTED: XCircle,
};

interface BookingStatusPillProps {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BookingStatusPill({
  status,
  size = 'md',
  className = '',
}: BookingStatusPillProps) {
  const Icon = ICON[status];
  const colors = BOOKING_STATUS_COLORS[status];

  const sizeClass =
    size === 'sm'
      ? 'h-6 px-2.5 text-[11px] gap-1'
      : size === 'lg'
        ? 'h-9 px-4 text-sm gap-2'
        : 'h-7 px-3 text-xs gap-1.5';

  const iconSize =
    size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full whitespace-nowrap ${sizeClass} ${className}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      <Icon className={iconSize} aria-hidden />
      {BOOKING_STATUS_LABEL[status]}
    </span>
  );
}
