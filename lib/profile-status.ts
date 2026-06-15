import type { ProfileStatus } from '@/lib/api/types';

/** Includes legacy backend alias `SUBMITTED`. */
export type NormalizedProfileStatus = ProfileStatus | 'SUBMITTED';

export function normalizeProfileStatus(status: string): NormalizedProfileStatus {
  if (status === 'SUBMITTED' || status === 'PENDING_REVIEW') return 'PENDING_REVIEW';
  return status as ProfileStatus;
}

export function isPendingReview(status: string | null | undefined): boolean {
  if (!status) return false;
  return normalizeProfileStatus(status) === 'PENDING_REVIEW';
}

export function isProfileApproved(status: string | null | undefined): boolean {
  return normalizeProfileStatus(status ?? '') === 'APPROVED';
}

export function canSubmitProfile(status: string | null | undefined): boolean {
  const s = normalizeProfileStatus(status ?? '');
  return s === 'DRAFT' || s === 'REJECTED';
}

export const profileStatusLabel: Record<NormalizedProfileStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  SUBMITTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

export const profileStatusVariant: Record<
  NormalizedProfileStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'outline',
  PENDING_REVIEW: 'secondary',
  SUBMITTED: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

export function profileStatusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  return profileStatusVariant[normalizeProfileStatus(status)];
}

export function profileStatusDisplayLabel(status: string): string {
  return profileStatusLabel[normalizeProfileStatus(status)];
}
