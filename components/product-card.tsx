import Link from 'next/link';
import { Users, CalendarClock, Briefcase, ImageIcon } from 'lucide-react';
import type { ProductResponse } from '@/lib/api/types';
import { ProductStatusPill } from '@/components/product-status-pill';
import {
  PLATFORM_LABEL,
  vnd,
  formatFollowers,
  formatDate,
  daysUntil,
} from '@/lib/products/meta';

/**
 * Browse card for a brand product posting. Used on the public/KOL `/products`
 * grid. Self-contained (no client state) so it can render in a server context.
 */
export function ProductCard({ product }: { product: ProductResponse }) {
  const left = daysUntil(product.deadline);
  const deadlineSoon = left != null && left >= 0 && left <= 3;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col bg-canvas rounded-2xl border border-hairline overflow-hidden hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.22)] transition-shadow"
    >
      <div className="relative aspect-[16/10] bg-surface-card overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-mute">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <ProductStatusPill status={product.status} />
        </div>
        {deadlineSoon && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-pin-red text-on-dark">
            <CalendarClock className="w-3 h-3" />
            {left === 0 ? 'Hết hạn hôm nay' : `Còn ${left} ngày`}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        {product.brandCompanyName && (
          <p className="text-xs font-semibold text-mute mb-1 truncate inline-flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {product.brandCompanyName}
          </p>
        )}
        <h3 className="font-display font-bold text-ink text-[16px] leading-snug line-clamp-2 mb-2">
          {product.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {product.requiredPlatform && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-card text-ink">
              {PLATFORM_LABEL[product.requiredPlatform]}
            </span>
          )}
          {product.categoryName && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-card text-ink">
              {product.categoryName}
            </span>
          )}
          {product.minFollowers != null && product.minFollowers > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-card text-ink inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatFollowers(product.minFollowers)}+
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2 border-t border-hairline-soft">
          <div>
            <p className="text-[11px] text-mute">Ngân sách</p>
            <p className="font-display font-extrabold text-ink text-[17px]">
              {product.budget != null && product.budget > 0 ? vnd.format(product.budget) : 'Thỏa thuận'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-mute">Ứng tuyển</p>
            <p className="font-bold text-ink text-sm">{product.applicationCount}</p>
          </div>
        </div>

        {product.deadline && !deadlineSoon && (
          <p className="text-[11px] text-mute mt-2 inline-flex items-center gap-1">
            <CalendarClock className="w-3 h-3" />
            Hạn: {formatDate(product.deadline)}
          </p>
        )}
      </div>
    </Link>
  );
}
