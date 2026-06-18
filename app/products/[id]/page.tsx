'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  CalendarClock,
  Layers,
  Tag,
  Briefcase,
  Loader2,
  XCircle,
  CheckCircle2,
  Send,
  Pencil,
  Lock,
  Unlock,
  Trash2,
  ClipboardList,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/header';
import { ProductStatusPill } from '@/components/product-status-pill';
import { productsApi } from '@/lib/api/products';
import { brandApi } from '@/lib/api/brand';
import { kolApi } from '@/lib/api/kol';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import { CurrencyInput } from '@/components/currency-input';
import { parsePriceDigits, validatePriceDigits } from '@/lib/currency-input';
import type { ProductResponse } from '@/lib/api/types';
import { brandProfilePath } from '@/lib/brands/display';
import { PLATFORM_LABEL, vnd, formatFollowers, formatDate, daysUntil } from '@/lib/products/meta';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Ownership / eligibility, resolved from the viewer's own profile.
  const [isOwner, setIsOwner] = useState(false);
  const [kolApproved, setKolApproved] = useState<boolean | null>(null);

  // Apply form state (KOL)
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedPriceError, setProposedPriceError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applied, setApplied] = useState(false);

  // Owner action state
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const p = await productsApi.getById(id);
      setProduct(p);
      setApplied(p.hasApplied);
    } catch (err) {
      setLoadError(err instanceof ApiError && err.status === 404 ? 'not-found' : 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setLoadError('not-found');
      setLoading(false);
      return;
    }
    void load();
  }, [id, load]);

  // Resolve viewer role context once product + auth are known.
  useEffect(() => {
    if (authLoading || !product || !user) return;
    let cancelled = false;
    if (user.role === 'BRAND') {
      brandApi
        .getMyProfile()
        .then((b) => !cancelled && setIsOwner(b.id === product.brandProfileId))
        .catch(() => !cancelled && setIsOwner(false));
    } else if (user.role === 'KOL') {
      kolApi
        .getMyProfile()
        .then((k) => !cancelled && setKolApproved(k.status === 'APPROVED'))
        .catch(() => !cancelled && setKolApproved(false));
    }
    return () => {
      cancelled = true;
    };
  }, [authLoading, product, user]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    const priceErr = validatePriceDigits(proposedPrice, { fieldLabel: 'Giá đề xuất' });
    setProposedPriceError(priceErr);
    if (priceErr) return;

    setApplying(true);
    setApplyError('');
    try {
      await productsApi.apply(product.id, {
        message: message.trim() || undefined,
        proposedPrice: proposedPrice ? parsePriceDigits(proposedPrice) ?? undefined : undefined,
      });
      setApplied(true);
      setProduct((p) => (p ? { ...p, hasApplied: true, applicationCount: p.applicationCount + 1 } : p));
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Ứng tuyển thất bại. Vui lòng thử lại.');
    } finally {
      setApplying(false);
    }
  }

  async function runOwnerAction(fn: () => Promise<ProductResponse | void>, after?: () => void) {
    setActionBusy(true);
    setActionError('');
    try {
      const res = await fn();
      if (res) setProduct(res);
      after?.();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Thao tác thất bại.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!window.confirm('Xoá tin đăng này? Hành động không thể hoàn tác.')) return;
    await runOwnerAction(
      () => productsApi.remove(product.id),
      () => router.push('/products/manage'),
    );
  }

  // ─── Render guards ───────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  if (loadError === 'not-found' || !product) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-[640px] mx-auto px-4 py-20 text-center">
          <XCircle className="w-12 h-12 text-pin-red mx-auto mb-4" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">Không tìm thấy sản phẩm</h1>
          <p className="text-mute mb-6">Tin đăng có thể đã bị gỡ hoặc không tồn tại.</p>
          <Link href="/products" className="btn-pin-primary !rounded-full">Về danh sách</Link>
        </main>
      </div>
    );
  }

  if (loadError === 'error') {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <main className="max-w-[640px] mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-pin-red mx-auto mb-4" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">Không thể tải tin đăng</h1>
          <button onClick={() => load()} className="btn-pin-primary !rounded-full">Thử lại</button>
        </main>
      </div>
    );
  }

  const left = daysUntil(product.deadline);
  const isOpen = product.status === 'OPEN';
  const isKol = user?.role === 'KOL';
  const isBrand = user?.role === 'BRAND';
  const budgetText = product.budget != null && product.budget > 0 ? vnd.format(product.budget) : 'Thỏa thuận';

  return (
    <div className="min-h-screen bg-surface-soft">
      <Header />
      <main className="mx-auto max-w-[1080px] px-4 sm:px-6 py-8">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink mb-4">
          <ArrowLeft className="w-4 h-4" />
          Tất cả chiến dịch
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: details ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-canvas rounded-2xl border border-hairline overflow-hidden">
              <div className="relative aspect-[16/9] bg-surface-card">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(product.imageUrl)} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-mute">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <ProductStatusPill status={product.status} />
                </div>
              </div>
              <div className="p-6">
                {product.brandCompanyName && (
                  <Link
                    href={brandProfilePath(product.brandProfileId)}
                    className="text-sm font-semibold text-mute mb-2 inline-flex items-center gap-1.5 hover:text-pin-red transition-colors w-fit"
                  >
                    <Briefcase className="w-4 h-4" />
                    {product.brandCompanyName}
                  </Link>
                )}
                <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink leading-tight mb-4">
                  {product.title}
                </h1>
                {product.description ? (
                  <p className="text-body text-[15px] leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-mute italic text-sm">Thương hiệu chưa thêm mô tả chi tiết.</p>
                )}
              </div>
            </div>

            {/* Requirements grid */}
            <div className="bg-canvas rounded-2xl border border-hairline p-6">
              <h2 className="font-display font-bold text-lg text-ink mb-4">Yêu cầu chiến dịch</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Fact icon={<Tag className="w-4 h-4" />} label="Danh mục" value={product.categoryName ?? '—'} />
                <Fact
                  icon={<Layers className="w-4 h-4" />}
                  label="Nền tảng"
                  value={product.requiredPlatform ? PLATFORM_LABEL[product.requiredPlatform] : 'Mọi nền tảng'}
                />
                <Fact
                  icon={<Users className="w-4 h-4" />}
                  label="Người theo dõi tối thiểu"
                  value={product.minFollowers != null && product.minFollowers > 0 ? `${formatFollowers(product.minFollowers)}+` : 'Không yêu cầu'}
                />
                <Fact icon={<ClipboardList className="w-4 h-4" />} label="Số suất" value={String(product.slots ?? 1)} />
                <Fact
                  icon={<CalendarClock className="w-4 h-4" />}
                  label="Hạn ứng tuyển"
                  value={product.deadline ? formatDate(product.deadline) : 'Không giới hạn'}
                />
                <Fact icon={<Users className="w-4 h-4" />} label="Đã ứng tuyển" value={`${product.applicationCount}`} />
              </dl>
            </div>
          </div>

          {/* ─── Right: action card (sticky) ────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-canvas rounded-2xl border border-hairline p-6 lg:sticky lg:top-24">
              <p className="text-xs text-mute mb-1">Ngân sách</p>
              <p className="font-display font-extrabold text-2xl text-ink mb-1">{budgetText}</p>
              {left != null && (
                <p className={`text-xs font-semibold mb-4 ${left < 0 ? 'text-mute' : left <= 3 ? 'text-pin-red' : 'text-mute'}`}>
                  {left < 0 ? 'Đã quá hạn ứng tuyển' : left === 0 ? 'Hết hạn hôm nay' : `Còn ${left} ngày ứng tuyển`}
                </p>
              )}

              {/* Owner panel */}
              {isOwner ? (
                <OwnerPanel
                  isOpen={isOpen}
                  busy={actionBusy}
                  error={actionError}
                  productId={product.id}
                  onClose={() => runOwnerAction(() => productsApi.close(product.id))}
                  onReopen={() => runOwnerAction(() => productsApi.reopen(product.id))}
                  onDelete={handleDelete}
                />
              ) : isKol ? (
                <KolApplyPanel
                  isOpen={isOpen}
                  applied={applied}
                  kolApproved={kolApproved}
                  message={message}
                  proposedPrice={proposedPrice}
                  proposedPriceError={proposedPriceError}
                  applying={applying}
                  error={applyError}
                  onMessage={setMessage}
                  onPrice={(v) => { setProposedPrice(v); if (proposedPriceError) setProposedPriceError(''); }}
                  onPriceValidate={setProposedPriceError}
                  onSubmit={handleApply}
                />
              ) : isBrand ? (
                <p className="text-sm text-mute">
                  Đây là tin đăng của thương hiệu khác. Chỉ KOL mới có thể ứng tuyển.
                </p>
              ) : (
                <div>
                  <p className="text-sm text-mute mb-4">
                    Đăng nhập với tư cách KOL để ứng tuyển chiến dịch này.
                  </p>
                  <Link href="/auth/login" className="btn-pin-primary !rounded-full w-full justify-center">
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-mute inline-flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </dt>
      <dd className="font-bold text-ink text-sm">{value}</dd>
    </div>
  );
}

function OwnerPanel({
  isOpen,
  busy,
  error,
  productId,
  onClose,
  onReopen,
  onDelete,
}: {
  isOpen: boolean;
  busy: boolean;
  error: string;
  productId: number;
  onClose: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-mute mb-1">Quản lý tin đăng</p>
      <Link
        href={`/products/${productId}/applications`}
        className="btn-pin-primary !rounded-xl w-full justify-center"
      >
        <ClipboardList className="w-4 h-4" />
        Xem ứng viên
      </Link>
      <Link
        href={`/products/${productId}/edit`}
        className="btn-pin-secondary !rounded-xl w-full justify-center"
      >
        <Pencil className="w-4 h-4" />
        Chỉnh sửa
      </Link>
      {isOpen ? (
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="btn-pin-secondary !rounded-xl w-full justify-center disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          Đóng tin
        </button>
      ) : (
        <button
          type="button"
          onClick={onReopen}
          disabled={busy}
          className="btn-pin-secondary !rounded-xl w-full justify-center disabled:opacity-50"
        >
          <Unlock className="w-4 h-4" />
          Mở lại tin
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-pin-red hover:bg-pin-red/10 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        Xoá tin
      </button>
      {error && <p className="text-sm text-pin-red font-medium">{error}</p>}
    </div>
  );
}

function KolApplyPanel({
  isOpen,
  applied,
  kolApproved,
  message,
  proposedPrice,
  proposedPriceError,
  applying,
  error,
  onMessage,
  onPrice,
  onPriceValidate,
  onSubmit,
}: {
  isOpen: boolean;
  applied: boolean;
  kolApproved: boolean | null;
  message: string;
  proposedPrice: string;
  proposedPriceError: string;
  applying: boolean;
  error: string;
  onMessage: (v: string) => void;
  onPrice: (v: string) => void;
  onPriceValidate: (error: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (applied) {
    return (
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-[var(--success-pale)] grid place-items-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-[var(--success-deep)]" />
        </div>
        <p className="font-bold text-ink mb-1">Đã ứng tuyển</p>
        <p className="text-sm text-mute mb-4">Theo dõi trạng thái trong mục ứng tuyển của bạn.</p>
        <Link href="/applications/mine" className="btn-pin-secondary !rounded-full w-full justify-center">
          Ứng tuyển của tôi
        </Link>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="text-center py-2">
        <Lock className="w-8 h-8 text-mute mx-auto mb-2" />
        <p className="font-bold text-ink mb-1">Đã đóng nhận ứng tuyển</p>
        <p className="text-sm text-mute">Chiến dịch này không còn nhận hồ sơ mới.</p>
      </div>
    );
  }

  if (kolApproved === false) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <p className="font-bold mb-1">Hồ sơ chưa được duyệt</p>
        <p className="mb-3">Bạn cần hoàn thiện và được duyệt hồ sơ KOL trước khi ứng tuyển.</p>
        <Link href="/kol-dashboard/profile" className="font-bold underline">
          Tới hồ sơ KOL
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-mute">Ứng tuyển chiến dịch</p>
      <div>
        <label className="block text-xs font-semibold text-ink mb-1.5">Lời nhắn tới thương hiệu</label>
        <textarea
          value={message}
          onChange={(e) => onMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Giới thiệu ngắn gọn vì sao bạn phù hợp với chiến dịch…"
          className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-ink mb-1.5">Giá đề xuất (tuỳ chọn)</label>
        <CurrencyInput
          value={proposedPrice}
          onValueChange={onPrice}
          onValidate={onPriceValidate}
          validateOptions={{ fieldLabel: 'Giá đề xuất' }}
          placeholder="Để trống nếu theo ngân sách"
          className={`w-full px-3 py-2.5 rounded-xl border bg-surface-soft focus:bg-canvas focus:outline-none text-sm ${
            proposedPriceError ? 'border-pin-red focus:border-pin-red' : 'border-hairline focus:border-ink'
          }`}
        />
        {proposedPriceError && <p className="text-xs text-pin-red mt-1">{proposedPriceError}</p>}
        <p className="text-[11px] text-mute mt-1">Nếu được duyệt, giá này sẽ là ngân sách của booking.</p>
      </div>
      {error && <p className="text-sm text-pin-red font-medium">{error}</p>}
      <button type="submit" disabled={applying} className="btn-pin-primary !rounded-xl w-full justify-center disabled:opacity-50">
        {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Gửi ứng tuyển
      </button>
    </form>
  );
}
