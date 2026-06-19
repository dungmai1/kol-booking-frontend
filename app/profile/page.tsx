'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { BrandPublicHero, type BrandPublicHeroData } from '@/components/brand-public-hero';
import { useAuth } from '@/contexts/AuthContext';
import { brandApi, filesApi } from '@/lib/api';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import { brandProfilePath } from '@/lib/brands/display';
import {
  canSubmitProfile,
  isPendingReview,
  isProfileApproved,
  normalizeProfileStatus,
  profileStatusBadgeVariant,
  profileStatusDisplayLabel,
} from '@/lib/profile-status';
import type { NormalizedProfileStatus } from '@/lib/profile-status';
import { AlertCircle, CheckCircle2, ExternalLink, Eye, Loader2, Save, Send, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ACCEPTED_IMAGE_ACCEPT, validateUploadFile } from '@/lib/uploads/validate';

const MAX_ADDRESS_LENGTH = 255;
const MAX_BIO_LENGTH = 500;
const MAX_TAX_CODE_LENGTH = 20;
const MAX_WEBSITE_LENGTH = 500;

const COUNTRIES = ['Việt Nam', 'Thái Lan', 'Indonesia', 'Philippines', 'Singapore', 'Malaysia'] as const;

type ProfileForm = {
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

function isValidWebsite(website: string): boolean {
  const trimmed = website.trim();
  if (!trimmed) return true;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return Boolean(url.hostname.includes('.'));
  } catch {
    return false;
  }
}

function validateForm(data: ProfileForm): string | null {
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
  if (!isValidWebsite(data.website)) {
    return 'Website không hợp lệ. Ví dụ: thecoffeehouse.com hoặc https://congty.com';
  }
  return null;
}

function toForm(brand: Awaited<ReturnType<typeof brandApi.getMyProfile>>): ProfileForm {
  return {
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

type BrandSubmitField = {
  id: string;
  label: string;
  met: boolean;
};

function getBrandSubmitFields(data: ProfileForm): BrandSubmitField[] {
  return [
    { id: 'logo', label: 'Logo thương hiệu', met: data.logoUrl.trim().length > 0 },
    { id: 'company', label: 'Tên thương hiệu', met: data.company.trim().length > 0 },
    { id: 'industry', label: 'Ngành nghề', met: data.industry.trim().length > 0 },
    { id: 'address', label: 'Địa chỉ', met: data.address.trim().length > 0 },
    { id: 'country', label: 'Quốc gia', met: data.country.trim().length > 0 },
    { id: 'bio', label: 'Giới thiệu', met: data.bio.trim().length > 0 },
    { id: 'website', label: 'Website', met: data.website.trim().length > 0 },
  ];
}

function isBrandProfileComplete(data: ProfileForm): boolean {
  return getBrandSubmitFields(data).every((field) => field.met);
}

function validateBrandSubmit(data: ProfileForm): string | null {
  const formError = validateForm(data);
  if (formError) return formError;

  const missing = getBrandSubmitFields(data).filter((field) => !field.met);
  if (missing.length === 0) return null;

  return `Vui lòng điền đầy đủ các trường bắt buộc (*): ${missing.map((field) => field.label).join(', ')}.`;
}

type PublicStats = {
  avgRating: number;
  reviewCount: number;
  campaignCount: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isBrand = user?.role === 'BRAND';

  const [formData, setFormData] = useState<ProfileForm>({
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
  const [brandProfileId, setBrandProfileId] = useState<number | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStats>({
    avgRating: 0,
    reviewCount: 0,
    campaignCount: 0,
  });
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
          const brand = await brandApi.getMyProfile();
          if (!mounted) return;
          const loaded = toForm(brand);
          setFormData(loaded);
          setSavedData(loaded);
          setBrandStatus(normalizeProfileStatus(brand.status));
          setRejectReason(brand.rejectReason);
          setBrandProfileId(brand.id);

          const [publicRes, productsRes] = await Promise.allSettled([
            brandApi.getPublicProfile(brand.id),
            brandApi.getPublicProducts(brand.id, 0, 1),
          ]);
          if (!mounted) return;
          if (publicRes.status === 'fulfilled') {
            setPublicStats({
              avgRating: publicRes.value.avgRating,
              reviewCount: publicRes.value.reviewCount,
              campaignCount:
                productsRes.status === 'fulfilled' ? productsRes.value.totalElements : 0,
            });
          }
          return;
        }

        if (!mounted) return;
        const loaded: ProfileForm = {
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
    const validationError = validateUploadFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
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
      const next = toForm(updated);
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
    const error = validateBrandSubmit(formData);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await brandApi.updateMyProfile({
        companyName: formData.company.trim(),
        industry: formData.industry,
        logoUrl: formData.logoUrl,
        address: formData.address.trim(),
        country: formData.country,
        bio: formData.bio.trim(),
        website: formData.website.trim(),
      });
      const next = toForm(updated);
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

  const previewBrand = useMemo<BrandPublicHeroData>(
    () => ({
      companyName: formData.company,
      industry: formData.industry || null,
      logoUrl: formData.logoUrl || null,
      address: formData.address || null,
      country: formData.country || null,
      bio: formData.bio || null,
      website: formData.website || null,
      status: isProfileApproved(brandStatus) ? 'APPROVED' : undefined,
      avgRating: publicStats.avgRating,
      reviewCount: publicStats.reviewCount,
      campaignCount: publicStats.campaignCount,
    }),
    [formData, brandStatus, publicStats],
  );

  const avatarSrc = resolveMediaUrl(formData.logoUrl);

  const showSubmitBrand = isBrand && brandStatus !== null && canSubmitProfile(brandStatus);
  const brandSubmitFields = useMemo(() => getBrandSubmitFields(formData), [formData]);
  const canSubmitBrand = showSubmitBrand && isBrandProfileComplete(formData);
  const missingSubmitFields = brandSubmitFields.filter((field) => !field.met);

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
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 pb-6">
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
          <p className="text-mute mt-2 max-w-2xl">
            {isBrand
              ? 'Chỉnh sửa thông tin hiển thị công khai trên trang thương hiệu. Cần điền đầy đủ các trường có dấu * trước khi gửi duyệt.'
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
                  Điền đầy đủ các trường có dấu <span className="text-pin-red font-bold">*</span> bên dưới, lưu
                  thay đổi rồi nhấn &quot;Gửi duyệt&quot;.
                </p>
                <ul className="mt-2 space-y-0.5 text-amber-700">
                  {brandSubmitFields.map((field) => (
                    <SubmitRequirementItem key={field.id} met={field.met} label={field.label} />
                  ))}
                </ul>
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

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-16">
          {!isBrand ? (
            <div className="bg-canvas rounded-md border border-hairline p-8 text-center max-w-3xl">
              <p className="text-mute mb-4">Trang này dành cho tài khoản Brand.</p>
              <p className="text-sm text-mute">Email: {user?.email || '—'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <section className="xl:col-span-5 xl:sticky xl:top-24 xl:self-start space-y-4">
                <div className="bg-canvas rounded-md border border-hairline p-6 lg:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="font-display font-bold text-ink text-[18px]">Xem trước hồ sơ công khai</h2>
                      <p className="text-xs text-mute mt-1">
                        Cập nhật theo thời gian thực khi bạn chỉnh sửa bên phải
                      </p>
                    </div>
                    {brandProfileId != null && (
                      <Link
                        href={brandProfilePath(brandProfileId)}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-pin-red transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Xem trang công khai
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                  <BrandPublicHero brand={previewBrand} />
                </div>
                <p className="text-xs text-mute px-1">
                  Đánh giá, nhận xét và số chiến dịch lấy từ dữ liệu thực tế trên{' '}
                  {brandProfileId != null ? (
                    <Link href={brandProfilePath(brandProfileId)} className="font-bold underline hover:text-pin-red">
                      /brand/{brandProfileId}
                    </Link>
                  ) : (
                    'trang công khai'
                  )}
                  .
                </p>
              </section>

              <form onSubmit={handleSubmit} className="xl:col-span-7 space-y-6">
                <section className="bg-canvas rounded-md border border-hairline p-8">
                  <SectionHeader
                    title="Thông tin hiển thị công khai"
                    description="Nội dung hiển thị trên trang /brand/{id}. Tất cả trường có dấu * phải được điền đầy đủ trước khi gửi duyệt."
                  />
                  <div className="space-y-5">
                    <Field
                      label="Logo thương hiệu"
                      required={showSubmitBrand}
                      hint={
                        showSubmitBrand
                          ? 'Bắt buộc (*) — tải logo và lưu thay đổi trước khi gửi duyệt.'
                          : 'Ảnh vuông hiển thị ở đầu hồ sơ công khai.'
                      }
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-secondary-bg border border-hairline shrink-0">
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarSrc} alt="Logo thương hiệu" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-mute text-xs font-bold">
                              Chưa có logo
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_IMAGE_ACCEPT}
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
                    </Field>

                    <Field
                      label="Tên thương hiệu"
                      required={showSubmitBrand}
                      hint={
                        showSubmitBrand
                          ? 'Bắt buộc (*) — tiêu đề chính trên hồ sơ công khai.'
                          : 'Tiêu đề chính trên hồ sơ công khai.'
                      }
                    >
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="pin-input"
                      />
                    </Field>

                    <Field
                      label="Ngành nghề"
                      required={showSubmitBrand}
                      hint={
                        showSubmitBrand
                          ? 'Bắt buộc (*) — hiển thị dạng nhãn bên cạnh tên thương hiệu.'
                          : 'Hiển thị dạng nhãn bên cạnh tên thương hiệu.'
                      }
                    >
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field
                        label="Địa chỉ"
                        required={showSubmitBrand}
                        hint={showSubmitBrand ? 'Bắt buộc (*) — hiển thị cùng quốc gia trên hồ sơ công khai.' : 'Hiển thị cùng quốc gia trên hồ sơ công khai.'}
                      >
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          maxLength={MAX_ADDRESS_LENGTH}
                          className="pin-input"
                        />
                      </Field>
                      <Field
                        label="Quốc gia"
                        required={showSubmitBrand}
                        hint={showSubmitBrand ? 'Bắt buộc (*) — bổ sung vị trí trên hồ sơ công khai.' : 'Bổ sung vị trí trên hồ sơ công khai.'}
                      >
                        <select name="country" value={formData.country} onChange={handleChange} className="pin-input">
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field
                      label="Giới thiệu"
                      required={showSubmitBrand}
                      hint={
                        showSubmitBrand
                          ? 'Bắt buộc (*) — mô tả ngắn về thương hiệu hiển thị dưới tên.'
                          : 'Đoạn mô tả ngắn dưới tên thương hiệu.'
                      }
                    >
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        maxLength={MAX_BIO_LENGTH}
                        rows={4}
                        className="pin-input"
                      />
                    </Field>

                    <Field
                      label="Website"
                      required={showSubmitBrand}
                      hint={
                        showSubmitBrand
                          ? 'Bắt buộc (*) — liên kết website hiển thị trên hồ sơ công khai. Có thể nhập thecoffeehouse.com hoặc https://...'
                          : 'Liên kết website hiển thị trên hồ sơ công khai. Có thể nhập thecoffeehouse.com hoặc https://...'
                      }
                    >
                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        maxLength={MAX_WEBSITE_LENGTH}
                        placeholder="thecoffeehouse.com"
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
                      title={
                        !canSubmitBrand
                          ? `Cần điền đầy đủ: ${missingSubmitFields.map((field) => field.label).join(', ')}`
                          : undefined
                      }
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
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function SubmitRequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <span className="w-4 h-4 rounded-full border-2 border-amber-400" />
      )}
      {label} <span className="text-pin-red">*</span>
    </li>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display font-bold text-ink text-[18px]">{title}</h2>
      <p className="text-sm text-mute mt-1">{description}</p>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-1">
        {label}
        {required && <span className="text-pin-red"> *</span>}
      </label>
      {hint && <p className="text-xs text-mute mb-2">{hint}</p>}
      {children}
    </div>
  );
}
