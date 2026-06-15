'use client';

import { Header } from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, brandApi, filesApi } from '@/lib/api';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import {
  canSubmitProfile,
  isPendingReview,
  isProfileApproved,
  normalizeProfileStatus,
  profileStatusBadgeVariant,
  profileStatusDisplayLabel,
} from '@/lib/profile-status';
import type { NormalizedProfileStatus } from '@/lib/profile-status';
import { AlertCircle, CheckCircle2, Loader2, Save, Send, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 255;
const MAX_BIO_LENGTH = 500;
const MAX_TAX_CODE_LENGTH = 20;
const MAX_WEBSITE_LENGTH = 500;

const PHONE_RE = /^0\d{9,10}$/;

const COUNTRIES = ['Việt Nam', 'Thái Lan', 'Indonesia', 'Philippines', 'Singapore', 'Malaysia'] as const;

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  bio: string;
  company: string;
  industry: string;
  taxCode: string;
  website: string;
  address: string;
  logoUrl: string;
};

function errMsg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : e instanceof Error ? e.message : fallback;
}

function validateForm(data: ProfileForm): string | null {
  const name = data.fullName.trim();
  if (name.length > MAX_NAME_LENGTH) {
    return `Họ và tên tối đa ${MAX_NAME_LENGTH} ký tự.`;
  }
  const phone = data.phone.trim();
  if (phone && !PHONE_RE.test(phone)) {
    return 'Số điện thoại phải bắt đầu bằng 0 và có 10–11 chữ số.';
  }
  if (data.address.trim().length > MAX_ADDRESS_LENGTH) {
    return `Địa chỉ tối đa ${MAX_ADDRESS_LENGTH} ký tự.`;
  }
  if (data.bio.length > MAX_BIO_LENGTH) {
    return `Giới thiệu tối đa ${MAX_BIO_LENGTH} ký tự.`;
  }
  if (data.taxCode.trim().length > MAX_TAX_CODE_LENGTH) {
    return `Mã số thuế tối đa ${MAX_TAX_CODE_LENGTH} ký tự.`;
  }
  if (data.website.trim().length > MAX_WEBSITE_LENGTH) {
    return `Website tối đa ${MAX_WEBSITE_LENGTH} ký tự.`;
  }
  return null;
}

function toForm(brand: Awaited<ReturnType<typeof brandApi.getMyProfile>>, email: string): ProfileForm {
  return {
    fullName: brand.contactName ?? '',
    email,
    phone: brand.contactPhone ?? '',
    country: brand.country ?? 'Việt Nam',
    bio: brand.bio ?? '',
    company: brand.companyName ?? '',
    industry: brand.industry ?? '',
    taxCode: brand.taxCode ?? '',
    website: brand.website ?? '',
    address: brand.address ?? '',
    logoUrl: brand.logoUrl ?? '',
  };
}

function toUpdatePayload(formData: ProfileForm) {
  return {
    contactName: formData.fullName.trim() || undefined,
    contactPhone: formData.phone.trim() || undefined,
    companyName: formData.company.trim() || undefined,
    industry: formData.industry || undefined,
    taxCode: formData.taxCode.trim() || undefined,
    website: formData.website.trim() || undefined,
    address: formData.address.trim() || undefined,
    bio: formData.bio.trim() || undefined,
    country: formData.country || undefined,
    logoUrl: formData.logoUrl || undefined,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isBrand = user?.role === 'BRAND';

  const [formData, setFormData] = useState<ProfileForm>({
    fullName: '',
    email: '',
    phone: '',
    country: 'Việt Nam',
    bio: '',
    company: '',
    industry: '',
    taxCode: '',
    website: '',
    address: '',
    logoUrl: '',
  });
  const [savedData, setSavedData] = useState<ProfileForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [brandStatus, setBrandStatus] = useState<NormalizedProfileStatus | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === 'KOL') {
      router.replace('/kol-dashboard/profile');
    } else if (user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === 'KOL' || user?.role === 'ADMIN') return;

    let mounted = true;

    async function loadProfile() {
      try {
        if (user?.role === 'BRAND') {
          const [me, brand] = await Promise.all([authApi.getMe(), brandApi.getMyProfile()]);
          if (!mounted) return;
          const loaded = toForm(brand, me.email);
          setFormData(loaded);
          setSavedData(loaded);
          setBrandStatus(normalizeProfileStatus(brand.status));
          setRejectReason(brand.rejectReason);
          return;
        }

        const me = await authApi.getMe();
        if (!mounted) return;
        const loaded: ProfileForm = {
          fullName: '',
          email: me.email,
          phone: '',
          country: 'Việt Nam',
          bio: '',
          company: '',
          industry: '',
          taxCode: '',
          website: '',
          address: '',
          logoUrl: '',
        };
        setFormData(loaded);
        setSavedData(loaded);
      } catch {
        // Ignore — người dùng sẽ thấy form trống
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAvatarUpload(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Ảnh không được vượt quá 5MB.');
      return;
    }
    if (file.size === 0) {
      toast.error('File ảnh không hợp lệ.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await filesApi.upload(file);
      setFormData((prev) => ({ ...prev, logoUrl: res.url }));
      toast.success('Đã tải lên ảnh. Nhấn "Lưu thay đổi" để lưu hồ sơ.');
    } catch (e) {
      toast.error(errMsg(e, 'Tải ảnh lên thất bại.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleCancel() {
    if (savedData) setFormData(savedData);
    else toast.info('Không có dữ liệu để khôi phục.');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isBrand) {
      toast.info('Chỉ tài khoản Brand mới có thể cập nhật hồ sơ doanh nghiệp tại đây.');
      return;
    }

    const error = validateForm(formData);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await brandApi.updateMyProfile(toUpdatePayload(formData));
      const next = toForm(updated, formData.email);
      setFormData(next);
      setSavedData(next);
      setBrandStatus(normalizeProfileStatus(updated.status));
      setRejectReason(updated.rejectReason);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (e) {
      toast.error(errMsg(e, 'Cập nhật thất bại. Vui lòng thử lại.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitForReview() {
    const error = validateForm(formData);
    if (error) {
      toast.error(error);
      return;
    }
    if (!formData.company.trim()) {
      toast.error('Vui lòng nhập tên công ty trước khi gửi duyệt.');
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên liên hệ trước khi gửi duyệt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await brandApi.updateMyProfile({
        ...toUpdatePayload(formData),
        contactName: formData.fullName.trim(),
        companyName: formData.company.trim(),
      });
      const next = toForm(updated, formData.email);
      setFormData(next);
      setSavedData(next);

      const submitted = await brandApi.submitProfile();
      setBrandStatus(normalizeProfileStatus(submitted.status));
      setRejectReason(submitted.rejectReason);
      toast.success('Đã gửi hồ sơ chờ admin duyệt.');
    } catch (e) {
      toast.error(errMsg(e, 'Gửi duyệt thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const avatarSrc = resolveMediaUrl(formData.logoUrl);
  const avatarInitial = formData.fullName
    ? formData.fullName.charAt(0).toUpperCase()
    : formData.email.charAt(0).toUpperCase();

  const showSubmitBrand = isBrand && brandStatus !== null && canSubmitProfile(brandStatus);
  const canSubmitBrand =
    showSubmitBrand &&
    formData.company.trim().length > 0 &&
    formData.fullName.trim().length > 0;

  if (authLoading || isLoading || user?.role === 'KOL' || user?.role === 'ADMIN') {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pin-red" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">
              {isBrand ? 'Hồ sơ Brand' : 'Hồ sơ của tôi'}
            </h1>
            {isBrand && brandStatus && (
              <Badge variant={profileStatusBadgeVariant(brandStatus)} className="text-sm">
                {profileStatusDisplayLabel(brandStatus)}
              </Badge>
            )}
          </div>
          <p className="text-mute mt-2">
            {isBrand
              ? 'Quản lý thông tin doanh nghiệp, lưu thay đổi và gửi hồ sơ để admin duyệt trước khi đặt KOL.'
              : 'Quản lý thông tin tài khoản của bạn.'}
          </p>

          {isBrand && brandStatus === 'REJECTED' && rejectReason && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-red-700">Hồ sơ bị từ chối</p>
                <p className="text-red-600 mt-1">{rejectReason}</p>
              </div>
            </div>
          )}

          {isBrand && showSubmitBrand && !canSubmitBrand && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-amber-700">Hồ sơ chưa đủ điều kiện gửi duyệt</p>
                <p className="text-amber-700 mt-1">
                  Cần nhập <strong>Tên công ty</strong> và <strong>Họ và tên</strong> liên hệ trước khi gửi.
                </p>
              </div>
            </div>
          )}

          {isBrand && isPendingReview(brandStatus) && (
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-blue-700">Đang chờ admin duyệt</p>
                <p className="text-blue-600 mt-1">
                  Hồ sơ đã được gửi. Sau khi admin duyệt, bạn có thể đặt KOL và đăng tin tuyển.
                </p>
              </div>
            </div>
          )}

          {isBrand && isProfileApproved(brandStatus) && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-emerald-700">Hồ sơ đã được duyệt</p>
                <p className="text-emerald-600 mt-1">Bạn có thể đặt KOL và đăng tin tuyển trên nền tảng.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
          {!isBrand ? (
            <div className="bg-canvas rounded-md border border-hairline p-8 text-center">
              <p className="text-mute mb-4">Trang này dành cho tài khoản Brand.</p>
              <p className="text-sm text-mute">Email: {formData.email || '—'}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="bg-canvas rounded-md border border-hairline p-8">
                <h2 className="font-display font-bold text-ink text-[18px] mb-6">Logo công ty</h2>
                <div className="flex items-center gap-6">
                  <div className="grid place-items-center w-24 h-24 rounded-full bg-ink text-on-dark font-display font-extrabold text-4xl overflow-hidden shrink-0">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc} alt="Logo công ty" className="w-full h-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleAvatarUpload(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-pin-primary !rounded-full inline-flex items-center gap-2"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isUploading ? 'Đang tải…' : 'Tải logo lên'}
                    </button>
                    <p className="text-xs text-mute mt-2">JPG, PNG, GIF hoặc WEBP (tối đa 5MB)</p>
                  </div>
                </div>
              </section>

              <section className="bg-canvas rounded-md border border-hairline p-8">
                <h2 className="font-display font-bold text-ink text-[18px] mb-6">Người liên hệ</h2>
                <div className="space-y-5">
                  <Field label="Họ và tên" required={showSubmitBrand}>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      maxLength={MAX_NAME_LENGTH}
                      className="pin-input"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="pin-input opacity-60 cursor-not-allowed"
                    />
                  </Field>
                  <Field label="Số điện thoại">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0xxxxxxxxx"
                      className="pin-input"
                    />
                  </Field>
                </div>
              </section>

              <section className="bg-canvas rounded-md border border-hairline p-8">
                <h2 className="font-display font-bold text-ink text-[18px] mb-6">Thông tin doanh nghiệp</h2>
                <div className="space-y-5">
                  <Field label="Tên công ty" required={showSubmitBrand}>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="pin-input"
                    />
                  </Field>
                  <Field label="Mã số thuế">
                    <input
                      type="text"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleChange}
                      maxLength={MAX_TAX_CODE_LENGTH}
                      placeholder="0123456789"
                      className="pin-input font-mono"
                    />
                  </Field>
                  <Field label="Ngành nghề">
                    <select name="industry" value={formData.industry} onChange={handleChange} className="pin-input">
                      <option value="">-- Chọn ngành nghề --</option>
                      <option>Thương mại điện tử</option>
                      <option>Thời trang</option>
                      <option>Làm đẹp</option>
                      <option>Thực phẩm & Đồ uống</option>
                      <option>Công nghệ</option>
                      <option>Khác</option>
                    </select>
                  </Field>
                  <Field label="Website">
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      maxLength={MAX_WEBSITE_LENGTH}
                      placeholder="https://congty.com"
                      className="pin-input"
                    />
                  </Field>
                  <Field label="Quốc gia">
                    <select name="country" value={formData.country} onChange={handleChange} className="pin-input">
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Địa chỉ">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      maxLength={MAX_ADDRESS_LENGTH}
                      className="pin-input"
                    />
                  </Field>
                  <Field label="Giới thiệu công ty">
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      maxLength={MAX_BIO_LENGTH}
                      rows={4}
                      className="pin-input"
                    />
                  </Field>
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving || isUploading || isSubmitting}
                  className="btn-pin-primary !rounded-full flex-1 min-w-[140px] !py-3 inline-flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
                {showSubmitBrand && (
                  <button
                    type="button"
                    onClick={() => void handleSubmitForReview()}
                    disabled={isSubmitting || isSaving || isUploading || !canSubmitBrand}
                    title={!canSubmitBrand ? 'Cần tên công ty và họ tên liên hệ' : undefined}
                    className="btn-pin-secondary !rounded-full flex-1 min-w-[140px] !py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Đang gửi…' : 'Gửi duyệt'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving || isSubmitting}
                  className="btn-pin-tertiary !rounded-full flex-1 min-w-[140px] !py-3"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-2">
        {label}
        {required && <span className="text-pin-red"> *</span>}
      </label>
      {children}
    </div>
  );
}
