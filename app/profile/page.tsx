'use client';

import { Header } from '@/components/header';
import { authApi, brandApi, filesApi } from '@/lib/api';
import { ApiError, resolveMediaUrl } from '@/lib/api/client';
import { Loader2, Save, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 255;
const MAX_BIO_LENGTH = 500;

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
    address: brand.address ?? '',
    logoUrl: brand.logoUrl ?? '',
  };
}

export default function ProfilePage() {
  const [formData, setFormData] = useState<ProfileForm>({
    fullName: '',
    email: '',
    phone: '',
    country: 'Việt Nam',
    bio: '',
    company: '',
    industry: '',
    address: '',
    logoUrl: '',
  });
  const [savedData, setSavedData] = useState<ProfileForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const [me, brand] = await Promise.all([
          authApi.getMe(),
          brandApi.getMyProfile(),
        ]);
        if (!mounted) return;
        const loaded = toForm(brand, me.email);
        setFormData(loaded);
        setSavedData(loaded);
      } catch {
        try {
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
            address: '',
            logoUrl: '',
          };
          setFormData(loaded);
          setSavedData(loaded);
        } catch {
          // Ignore — người dùng sẽ thấy form trống
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { mounted = false; };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      setFormData(prev => ({ ...prev, logoUrl: res.url }));
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
    const error = validateForm(formData);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await brandApi.updateMyProfile({
        contactName: formData.fullName.trim() || undefined,
        contactPhone: formData.phone.trim() || undefined,
        companyName: formData.company.trim() || undefined,
        industry: formData.industry || undefined,
        address: formData.address.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        country: formData.country || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
      const next = toForm(updated, formData.email);
      setFormData(next);
      setSavedData(next);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (e) {
      toast.error(errMsg(e, 'Cập nhật thất bại. Vui lòng thử lại.'));
    } finally {
      setIsSaving(false);
    }
  }

  const avatarSrc = resolveMediaUrl(formData.logoUrl);
  const avatarInitial = formData.fullName
    ? formData.fullName.charAt(0).toUpperCase()
    : formData.email.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft flex items-center justify-center">
          <p className="text-mute">Đang tải hồ sơ…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-6">
          <h1 className="font-display font-bold text-ink text-[28px] lg:text-[44px] tracking-[-0.8px]">Hồ sơ của tôi</h1>
          <p className="text-mute mt-2">Quản lý thông tin tài khoản của bạn.</p>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-canvas rounded-md border border-hairline p-8">
              <h2 className="font-display font-bold text-ink text-[18px] mb-6">Ảnh đại diện</h2>
              <div className="flex items-center gap-6">
                <div className="grid place-items-center w-24 h-24 rounded-full bg-ink text-on-dark font-display font-extrabold text-4xl overflow-hidden shrink-0">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="Ảnh đại diện" className="w-full h-full object-cover" />
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
                    {isUploading ? 'Đang tải…' : 'Tải ảnh lên'}
                  </button>
                  <p className="text-xs text-mute mt-2">JPG, PNG, GIF hoặc WEBP (tối đa 5MB)</p>
                </div>
              </div>
            </section>

            <section className="bg-canvas rounded-md border border-hairline p-8">
              <h2 className="font-display font-bold text-ink text-[18px] mb-6">Thông tin cá nhân</h2>
              <div className="space-y-5">
                <Field label="Họ và tên">
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
                <Field label="Quốc gia">
                  <select name="country" value={formData.country} onChange={handleChange} className="pin-input">
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
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
                <Field label="Giới thiệu">
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

            <section className="bg-canvas rounded-md border border-hairline p-8">
              <h2 className="font-display font-bold text-ink text-[18px] mb-6">Thông tin công ty</h2>
              <div className="space-y-5">
                <Field label="Tên công ty">
                  <input type="text" name="company" value={formData.company} onChange={handleChange} className="pin-input" />
                </Field>
                <Field label="Ngành nghề">
                  <select name="industry" value={formData.industry} onChange={handleChange} className="pin-input">
                    <option value="">-- Chọn ngành nghề --</option>
                    <option>Thương mại điện tử</option><option>Thời trang</option><option>Làm đẹp</option>
                    <option>Thực phẩm & Đồ uống</option><option>Công nghệ</option><option>Khác</option>
                  </select>
                </Field>
              </div>
            </section>

            <div className="flex gap-3">
              <button type="submit" disabled={isSaving || isUploading} className="btn-pin-primary !rounded-full flex-1 !py-3">
                <Save className="w-4 h-4" />
                {isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-pin-secondary !rounded-full flex-1 !py-3">
                Hủy
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-ink mb-2">{label}</label>
      {children}
    </div>
  );
}
