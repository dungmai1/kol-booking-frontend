'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { reviewsApi } from '@/lib/api/reviews';
import { ApiError } from '@/lib/api/client';
import type { ReviewDirection, ReviewResponse } from '@/lib/api/types';

const MIN_COMMENT = 50;
const MAX_COMMENT = 1000;

interface ReviewFormDialogProps {
  bookingId: number;
  direction: ReviewDirection;
  targetName: string;
  existingReview?: ReviewResponse;
  onSuccess?: (review: ReviewResponse) => void;
  children: React.ReactNode;
}

export function ReviewFormDialog({
  bookingId,
  direction,
  targetName,
  existingReview,
  onSuccess,
  children,
}: ReviewFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(existingReview?.rating ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(existingReview?.rating ?? 0);
      setComment(existingReview?.comment ?? '');
      setHover(0);
    }
  }, [open, existingReview]);

  const trimmedLength = comment.trim().length;
  const tooShort = trimmedLength < MIN_COMMENT;
  const tooLong = trimmedLength > MAX_COMMENT;
  const noRating = rating < 1 || rating > 5;
  const invalid = tooShort || tooLong || noRating;

  function handleOpenChange(next: boolean) {
    if (submitting) return;
    setOpen(next);
  }

  async function handleSubmit() {
    if (invalid || submitting) return;
    setSubmitting(true);
    try {
      const payload = { rating, comment: comment.trim() };
      const result = existingReview
        ? await reviewsApi.update(existingReview.id, payload)
        : await reviewsApi.create(bookingId, payload);
      toast.success(existingReview ? 'Đã cập nhật đánh giá.' : 'Đã gửi đánh giá.');
      setOpen(false);
      onSuccess?.(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gửi đánh giá thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const displayed = hover || rating;
  const title =
    direction === 'BRAND_TO_KOL' || direction === 'TO_KOL'
      ? `Đánh giá KOL ${targetName}`
      : `Đánh giá Brand ${targetName}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-ink">{title}</DialogTitle>
          <DialogDescription className="text-mute">
            Chia sẻ trải nghiệm hợp tác để cộng đồng tham khảo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-mute mb-2">
              Điểm đánh giá
            </label>
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const active = n <= displayed;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    className="grid place-items-center w-10 h-10 rounded-full hover:bg-surface-card transition-colors"
                    aria-label={`${n} sao`}
                    aria-pressed={rating === n}
                    disabled={submitting}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        active ? 'fill-ink text-ink' : 'text-stone'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-3 text-sm font-bold text-mute">
                {displayed > 0 ? `${displayed}/5` : 'Chọn điểm'}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="block text-xs font-bold uppercase tracking-wider text-mute mb-2"
            >
              Nhận xét
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Mô tả trải nghiệm với ${targetName} — chất lượng nội dung, thái độ làm việc, đúng deadline...`}
              rows={6}
              maxLength={MAX_COMMENT}
              disabled={submitting}
              className="pin-input resize-none disabled:opacity-60"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span
                className={
                  tooShort && trimmedLength > 0
                    ? 'text-pin-red font-bold'
                    : tooLong
                      ? 'text-pin-red font-bold'
                      : 'text-mute'
                }
              >
                {tooShort
                  ? `Tối thiểu ${MIN_COMMENT} ký tự (còn thiếu ${MIN_COMMENT - trimmedLength})`
                  : tooLong
                    ? `Vượt quá ${trimmedLength - MAX_COMMENT} ký tự`
                    : 'Độ dài hợp lệ'}
              </span>
              <span className="text-mute tabular-nums">
                {trimmedLength}/{MAX_COMMENT}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="rounded-full px-4 py-2 text-sm font-bold bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={invalid || submitting}
            className="btn-pin-primary !rounded-full disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting
              ? 'Đang gửi...'
              : existingReview
                ? 'Cập nhật đánh giá'
                : 'Gửi đánh giá'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
