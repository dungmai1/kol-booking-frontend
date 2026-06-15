import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/api/client';
import type { ReviewResponse } from '@/lib/api/types';
import { reviewAuthorHref, reviewAuthorLabel } from '@/lib/users/profile-link';

export function ReviewAuthorLink({
  review,
  className = 'font-bold text-ink hover:text-pin-red transition-colors',
}: {
  review: ReviewResponse;
  className?: string;
}) {
  const href = reviewAuthorHref(review);
  const label = reviewAuthorLabel(review);
  const avatarSrc = resolveMediaUrl(review.authorAvatarUrl);

  const content = (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="grid place-items-center w-10 h-10 rounded-full bg-surface-card text-ink font-bold shrink-0 overflow-hidden">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt={label} className="w-full h-full object-cover" />
        ) : (
          label.charAt(0).toUpperCase()
        )}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <span className="inline-flex items-center gap-2 min-w-0 text-ink font-bold">{content}</span>;
}
