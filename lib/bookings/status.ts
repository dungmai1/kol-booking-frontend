import type { BookingStatus } from '@/lib/api/types';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ duyệt',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  IN_PROGRESS: 'Đang thực hiện',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn thành',
  DISPUTED: 'Tranh chấp',
  CANCELLED_BY_ADMIN: 'Admin hủy',
  DELIVERY_REJECTED: 'Từ chối nội dung',
};

export const BOOKING_STATUS_DESCRIPTION: Record<BookingStatus, string> = {
  PENDING: 'Yêu cầu đặt lịch đang chờ KOL phản hồi.',
  ACCEPTED: 'KOL đã chấp nhận. Vui lòng thanh toán để bắt đầu chiến dịch.',
  REJECTED: 'KOL đã từ chối yêu cầu này.',
  CANCELLED: 'Đơn đã bị hủy.',
  IN_PROGRESS: 'Đã thanh toán. KOL đang triển khai chiến dịch.',
  DELIVERED: 'KOL đã giao nội dung. Chấp nhận để giải ngân cho KOL, hoặc từ chối để hoàn tiền về ví. Nếu không phản hồi trong 3 ngày, hệ thống tự thanh toán cho KOL.',
  COMPLETED: 'Đơn đã hoàn tất. KOL nhận tiền vào ví tự động; nền tảng trích phí.',
  DISPUTED: 'Đơn đang được khiếu nại, admin sẽ liên hệ.',
  CANCELLED_BY_ADMIN: 'Đơn đã bị quản trị viên hủy.',
  DELIVERY_REJECTED: 'Brand đã từ chối nội dung. Ngân sách đã hoàn về ví Brand.',
};

/** Vivid color coding per booking status. Uses raw hex so it is consistent across themes. */
export interface BookingStatusColors {
  /** Pill background. */
  bg: string;
  /** Pill text + icon. */
  text: string;
  /** Soft tinted background for callouts. */
  soft: string;
  /** Border tint to pair with soft background. */
  border: string;
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, BookingStatusColors> = {
  PENDING: {
    bg: '#f59e0b', // amber-500
    text: '#ffffff',
    soft: '#fef3c7',
    border: '#fcd34d',
  },
  ACCEPTED: {
    bg: '#2563eb', // blue-600
    text: '#ffffff',
    soft: '#dbeafe',
    border: '#93c5fd',
  },
  IN_PROGRESS: {
    bg: '#16a34a', // green-600
    text: '#ffffff',
    soft: '#dcfce7',
    border: '#86efac',
  },
  DELIVERED: {
    bg: '#0d9488', // teal-600
    text: '#ffffff',
    soft: '#ccfbf1',
    border: '#5eead4',
  },
  COMPLETED: {
    bg: '#15803d', // green-700
    text: '#ffffff',
    soft: '#bbf7d0',
    border: '#4ade80',
  },
  REJECTED: {
    bg: '#dc2626', // red-600
    text: '#ffffff',
    soft: '#fee2e2',
    border: '#fca5a5',
  },
  CANCELLED: {
    bg: '#dc2626',
    text: '#ffffff',
    soft: '#fee2e2',
    border: '#fca5a5',
  },
  CANCELLED_BY_ADMIN: {
    bg: '#991b1b', // red-800
    text: '#ffffff',
    soft: '#fee2e2',
    border: '#fca5a5',
  },
  DISPUTED: {
    bg: '#ea580c', // orange-600
    text: '#ffffff',
    soft: '#ffedd5',
    border: '#fdba74',
  },
  DELIVERY_REJECTED: {
    bg: '#b45309', // amber-700
    text: '#ffffff',
    soft: '#fef3c7',
    border: '#fcd34d',
  },
};

/** Linear happy-path steps. Branch states (REJECTED/CANCELLED/DISPUTED) are not in here. */
export const BOOKING_MAIN_STEPS = [
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'DELIVERED',
  'COMPLETED',
] as const satisfies readonly BookingStatus[];

export type MainStep = (typeof BOOKING_MAIN_STEPS)[number];

export const BOOKING_BRANCH_STATES: BookingStatus[] = [
  'REJECTED',
  'CANCELLED',
  'DISPUTED',
  'CANCELLED_BY_ADMIN',
  'DELIVERY_REJECTED',
];

export function isBranchState(status: BookingStatus): boolean {
  return BOOKING_BRANCH_STATES.includes(status);
}

export function isTerminalState(status: BookingStatus): boolean {
  return status === 'COMPLETED' || isBranchState(status);
}

/**
 * For the main timeline: returns the index of the current step in BOOKING_MAIN_STEPS.
 * Branch states return the index of the last step the booking reached before branching:
 *  - REJECTED/CANCELLED (from PENDING)        → -1 (none completed)
 *  - DISPUTED (typically after DELIVERED)     → DELIVERED index
 *  - CANCELLED_BY_ADMIN                       → -1
 */
export function currentStepIndex(status: BookingStatus): number {
  if (status === 'DISPUTED' || status === 'DELIVERY_REJECTED') {
    return BOOKING_MAIN_STEPS.indexOf('DELIVERED');
  }
  if (isBranchState(status)) return -1;
  return BOOKING_MAIN_STEPS.indexOf(status as MainStep);
}

export const BOOKING_STEP_LABEL: Record<MainStep, string> = {
  PENDING: 'Tạo đơn',
  ACCEPTED: 'KOL chấp nhận',
  IN_PROGRESS: 'Thanh toán',
  DELIVERED: 'Giao nội dung',
  COMPLETED: 'Hoàn tất',
};

/** Fallback platform fee (10%) used only when a booking predates the snapshot columns. */
export const PLATFORM_FEE_RATE = 0.1;

export function kolPayout(budget: number): number {
  return Math.round(budget * (1 - PLATFORM_FEE_RATE));
}

export function platformFee(budget: number): number {
  return budget - kolPayout(budget);
}

/** Minimal shape carrying the commission snapshot a booking exposes. */
interface BookingFeeSnapshot {
  budget: number;
  platformFeePercent: number | null;
  platformFeeAmount: number | null;
  kolNetAmount: number | null;
}

/**
 * Commission breakdown for a booking. Prefers the values the backend snapshotted
 * onto the booking at creation (`platformFeePercent`/`platformFeeAmount`/`kolNetAmount`);
 * falls back to the flat 10% rate for legacy bookings created before V26.
 */
export function bookingCommission(booking: BookingFeeSnapshot): {
  feePercent: number;
  feeAmount: number;
  netAmount: number;
} {
  const feePercent =
    booking.platformFeePercent != null
      ? booking.platformFeePercent
      : PLATFORM_FEE_RATE * 100;
  const feeAmount =
    booking.platformFeeAmount != null
      ? booking.platformFeeAmount
      : platformFee(booking.budget);
  const netAmount =
    booking.kolNetAmount != null ? booking.kolNetAmount : booking.budget - feeAmount;
  return { feePercent, feeAmount, netAmount };
}
