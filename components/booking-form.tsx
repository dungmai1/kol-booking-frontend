'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, FileText, Info, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { bookingsApi } from '@/lib/api/bookings';
import { brandApi } from '@/lib/api/brand';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import { filesApi } from '@/lib/api/files';
import { isPendingReview, isProfileApproved } from '@/lib/profile-status';
import { useAuth } from '@/contexts/AuthContext';
import { PLATFORM_FEE_RATE, kolPayout, platformFee } from '@/lib/bookings/status';
import { ACCEPTED_DOCUMENT_ACCEPT, validateUploadFile } from '@/lib/uploads/validate';
import {
  formatPriceDigits,
  handlePriceInputChange,
  priceToDigits,
  PRICE_INPUT_PLACEHOLDER,
} from '@/lib/currency-input';

interface BookingFormDialogProps {
  kolProfileId: number;
  kolName: string;
  defaultBudget?: number;
  triggerLabel?: string;
  onSuccess?: (bookingId: number) => void;
  /** Override the default gradient trigger button (e.g. for compact layouts). */
  triggerClassName?: string;
}

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().split('T')[0];
}

function labelFromAttachmentUrl(url: string): string {
  const part = url.split('/').pop() ?? '';
  try {
    return decodeURIComponent(part) || 'Tệp đính kèm';
  } catch {
    return part || 'Tệp đính kèm';
  }
}

export function BookingFormDialog({
  kolProfileId,
  kolName,
  defaultBudget,
  triggerLabel = 'Đặt KOL này',
  onSuccess,
  triggerClassName,
}: BookingFormDialogProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [budgetDigits, setBudgetDigits] = useState(priceToDigits(defaultBudget));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUploadError, setAttachmentUploadError] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const minDate = todayISO();
  const budget = Number(budgetDigits || '0');
  const isFormValid = validate() === null;

  function resetForm() {
    setCampaignTitle('');
    setCampaignBrief('');
    setDeliverables('');
    setAttachmentUrl('');
    setAttachmentLabel('');
    setAttachmentUploadError('');
    setBudgetDigits(priceToDigits(defaultBudget));
    setStartDate('');
    setEndDate('');
    setError('');
    setTouched(false);
  }

  async function handleTriggerClick() {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.role !== 'BRAND') {
      toast.error('Chỉ tài khoản Brand mới có thể đặt KOL');
      return;
    }
    setChecking(true);
    try {
      const profile = await brandApi.getMyProfile();
      if (!isProfileApproved(profile.status)) {
        if (isPendingReview(profile.status)) {
          toast.error('Hồ sơ Brand đang chờ admin duyệt');
        } else {
          toast.error('Vui lòng hoàn thiện và gửi hồ sơ Brand trước');
        }
        return;
      }
      resetForm();
      setOpen(true);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Không thể kiểm tra hồ sơ Brand';
      toast.error(msg);
    } finally {
      setChecking(false);
    }
  }

  function validate(): string | null {
    if (!campaignTitle.trim()) return 'Vui lòng nhập tên chiến dịch';
    if (campaignTitle.length > 200) return 'Tên chiến dịch tối đa 200 ký tự';
    if (campaignBrief.trim().length < 50)
      return 'Mô tả chiến dịch tối thiểu 50 ký tự';
    if (campaignBrief.length > 2000)
      return 'Mô tả chiến dịch tối đa 2000 ký tự';
    if (!deliverables.trim()) return 'Vui lòng nhập yêu cầu sản phẩm';
    if (!budget || budget <= 0) return 'Vui lòng nhập ngân sách hợp lệ';
    if (defaultBudget && budget < defaultBudget)
      return `Ngân sách tối thiểu ${vnd.format(defaultBudget)}`;
    if (!startDate) return 'Vui lòng chọn ngày bắt đầu';
    if (!endDate) return 'Vui lòng chọn ngày kết thúc';
    if (startDate < minDate) return 'Ngày bắt đầu không thể trong quá khứ';
    if (endDate <= startDate) return 'Ngày kết thúc phải sau ngày bắt đầu';
    return null;
  }

  async function handleAttachmentFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateUploadFile(file, 'document');
    if (validationError) {
      setAttachmentUploadError(validationError);
      e.target.value = '';
      return;
    }
    setUploadingAttachment(true);
    setAttachmentUploadError('');
    try {
      const res = await filesApi.upload(file);
      setAttachmentUrl(res.url);
      setAttachmentLabel(file.name || labelFromAttachmentUrl(res.url));
    } catch (err) {
      setAttachmentUploadError(
        err instanceof ApiError ? err.message : 'Tải tệp thất bại. Vui lòng thử lại.',
      );
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        kolProfileId,
        campaignTitle: campaignTitle.trim(),
        campaignBrief: campaignBrief.trim(),
        deliverables: deliverables.trim(),
        budget,
        startDate,
        endDate,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      toast.success('Đã gửi yêu cầu đặt KOL');
      setOpen(false);
      onSuccess?.(booking.id);
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Không thể gửi yêu cầu, vui lòng thử lại',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleTriggerClick}
        disabled={checking}
        className={
          triggerClassName ??
          'w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 shadow-md'
        }
      >
        {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !submitting && !uploadingAttachment && setOpen(v)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đặt lịch với {kolName}</DialogTitle>
            <DialogDescription>
              Điền thông tin chiến dịch để gửi yêu cầu hợp tác đến KOL.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="bf-title">
                Tên chiến dịch <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bf-title"
                value={campaignTitle}
                onChange={(e) =>
                  setCampaignTitle(e.target.value.slice(0, 200))
                }
                maxLength={200}
                placeholder="VD: Ra mắt bộ sưu tập mùa hè 2026"
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {campaignTitle.length}/200
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bf-brief">
                Mô tả chiến dịch <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bf-brief"
                value={campaignBrief}
                onChange={(e) =>
                  setCampaignBrief(e.target.value.slice(0, 2000))
                }
                maxLength={2000}
                placeholder="Mô tả chi tiết: mục tiêu chiến dịch, tệp khách hàng, thông điệp chính, kỳ vọng… (tối thiểu 50 ký tự)"
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {campaignBrief.length}/2000 (tối thiểu 50)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bf-deliverables">
                Yêu cầu sản phẩm <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bf-deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="VD: 2 video TikTok 30s + 3 stories Instagram, đăng trong tuần đầu tháng 7"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bf-attachment">Tệp đính kèm (tùy chọn)</Label>
              {attachmentUrl ? (
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {attachmentLabel || labelFromAttachmentUrl(attachmentUrl)}
                    </p>
                    <a
                      href={resolveMediaUrl(attachmentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
                    >
                      Xem trước
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAttachmentUrl('');
                      setAttachmentLabel('');
                      setAttachmentUploadError('');
                    }}
                    aria-label="Xóa tệp đính kèm"
                    disabled={uploadingAttachment || submitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="bf-attachment"
                  className="flex items-center gap-3 rounded-md border-2 border-dashed bg-muted/30 px-3 py-3 cursor-pointer hover:border-foreground transition-colors"
                >
                  {uploadingAttachment ? (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
                  ) : (
                    <Paperclip className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      Tải brief, hợp đồng hoặc điều khoản
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      PDF, DOC, DOCX — tối đa 10MB
                    </span>
                  </span>
                  <input
                    id="bf-attachment"
                    type="file"
                    accept={ACCEPTED_DOCUMENT_ACCEPT}
                    onChange={handleAttachmentFile}
                    className="hidden"
                    disabled={uploadingAttachment || submitting}
                  />
                </label>
              )}
              {attachmentUploadError && (
                <p className="text-xs text-destructive">{attachmentUploadError}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="bf-budget">
                  Ngân sách (VND) <span className="text-destructive">*</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Thông tin phí dịch vụ"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>Phí dịch vụ 10% sẽ được trừ vào số tiền KOL nhận.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="bf-budget"
                type="text"
                inputMode="numeric"
                value={formatPriceDigits(budgetDigits)}
                onChange={(e) =>
                  setBudgetDigits(handlePriceInputChange(e.target.value))
                }
                placeholder={PRICE_INPUT_PLACEHOLDER}
                required
              />
              {budget > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ {vnd.format(budget)}
                </p>
              )}
              {touched && (!budget || budget <= 0) && (
                <p className="text-xs text-destructive">Vui lòng nhập ngân sách hợp lệ</p>
              )}
              {defaultBudget ? (
                <p className="text-xs text-muted-foreground">
                  Tối thiểu: {vnd.format(defaultBudget)}
                </p>
              ) : null}

              {budget > 0 && (
                <div className="mt-2 rounded-md border bg-muted/40 p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      KOL nhận ({Math.round((1 - PLATFORM_FEE_RATE) * 100)}%)
                    </span>
                    <span className="font-semibold">
                      {vnd.format(kolPayout(budget))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Phí nền tảng ({Math.round(PLATFORM_FEE_RATE * 100)}%)
                    </span>
                    <span className="font-semibold">
                      {vnd.format(platformFee(budget))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t">
                    <span className="font-semibold">Brand thanh toán</span>
                    <span className="font-bold">{vnd.format(budget)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bf-start">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bf-start"
                  type="date"
                  value={startDate}
                  min={minDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bf-end">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bf-end"
                  type="date"
                  value={endDate}
                  min={startDate || minDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Hủy
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={submitting || uploadingAttachment || !isFormValid}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Backwards-compat alias for existing imports
export { BookingFormDialog as BookingForm };
