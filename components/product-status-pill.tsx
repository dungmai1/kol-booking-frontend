import type { ProductStatus, ApplicationStatus } from '@/lib/api/types';
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_CLASS,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_CLASS,
} from '@/lib/products/meta';

export function ProductStatusPill({ status, className = '' }: { status: ProductStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${PRODUCT_STATUS_CLASS[status]} ${className}`}
    >
      {PRODUCT_STATUS_LABEL[status]}
    </span>
  );
}

export function ApplicationStatusPill({
  status,
  className = '',
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${APPLICATION_STATUS_CLASS[status]} ${className}`}
    >
      {APPLICATION_STATUS_LABEL[status]}
    </span>
  );
}
