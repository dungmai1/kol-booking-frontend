import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { isPendingReview, isProfileApproved } from '@/lib/profile-status';
import type { NormalizedProfileStatus } from '@/lib/profile-status';

type BrandProfileGateBannerProps = {
  status: NormalizedProfileStatus | null;
  profileHref?: string;
};

export function BrandProfileGateBanner({
  status,
  profileHref = '/profile',
}: BrandProfileGateBannerProps) {
  if (!status || isProfileApproved(status)) return null;

  if (isPendingReview(status)) {
    return (
      <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-blue-700">Hồ sơ Brand đang chờ admin duyệt</p>
          <p className="text-blue-600 mt-1">
            Bạn chưa thể đăng tin tuyển KOL cho đến khi hồ sơ được phê duyệt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 flex gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-bold text-amber-700">Cần hoàn thiện và gửi hồ sơ Brand</p>
        <p className="text-amber-700 mt-1">
          Vui lòng{' '}
          <Link href={profileHref} className="font-bold underline hover:text-amber-900">
            cập nhật hồ sơ
          </Link>{' '}
          và gửi duyệt trước khi đăng tin tuyển KOL.
        </p>
      </div>
    </div>
  );
}
