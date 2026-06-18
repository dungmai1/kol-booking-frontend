'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Plus, Trash2, CalendarIcon, Save, Send, AlertCircle, CheckCircle2,
  Loader2, Image as ImageIcon, Video, ExternalLink, Upload,
} from 'lucide-react';

import { Header } from '@/components/header';
import { PortfolioItemCard, PortfolioMediaPreview } from '@/components/portfolio-item-card';
import { useAuth } from '@/contexts/AuthContext';
import { kolApi, normalizePlatform } from '@/lib/api/kol';
import { categoriesApi } from '@/lib/api/categories';
import { filesApi } from '@/lib/api/files';
import { resolveMediaUrl } from '@/lib/api/client';
import {
  ACCEPTED_IMAGE_ACCEPT,
  ACCEPTED_VIDEO_ACCEPT,
  validateUploadFile,
} from '@/lib/uploads/validate';
import type {
  KolProfileResponse,
  CategoryResponse,
  UpdateKolProfileRequest,
  CreateChannelRequest,
  CreatePackageRequest,
  CreatePortfolioItemRequest,
  Platform,
  PricingPackageType,
  MediaType,
  Gender,
} from '@/lib/api/types';
import {
  canSubmitProfile,
  isPendingReview,
  profileStatusBadgeVariant,
  profileStatusDisplayLabel,
} from '@/lib/profile-status';

import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/currency-input';
import { parsePriceDigits, validatePriceDigits } from '@/lib/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

// ───────────────────────────── Constants ─────────────────────────────

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
});

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const platformLabel: Record<Platform, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
};

const packageTypeLabel: Record<PricingPackageType, string> = {
  POST: 'Bài đăng',
  STORY: 'Story',
  VIDEO: 'Video',
  SHOUTOUT: 'Nhắc tên',
  LONG_FORM: 'Nội dung dài',
  CUSTOM: 'Tuỳ chỉnh',
};

const genderLabel: Record<Gender, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function flattenCategories(list: CategoryResponse[]): CategoryResponse[] {
  const out: CategoryResponse[] = [];
  for (const c of list) {
    out.push(c);
    if (c.children?.length) out.push(...flattenCategories(c.children));
  }
  return out;
}

function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

// ───────────────────────────── Page ─────────────────────────────

export default function KolProfileEditPage() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<KolProfileResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic-info form state
  const [form, setForm] = useState<UpdateKolProfileRequest>({});
  const [dob, setDob] = useState<Date | undefined>();
  const [slugError, setSlugError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Dialog visibility
  const [channelOpen, setChannelOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  // ─── Load profile + categories ───
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    Promise.allSettled([
      kolApi.getMyProfile(),
      categoriesApi.getAll(),
    ]).then(([pRes, cRes]) => {
      if (!mounted) return;
      if (pRes.status === 'fulfilled') {
        const p = pRes.value;
        setProfile(p);
        setForm({
          displayName: p.displayName,
          slug: p.slug,
          bio: p.bio ?? '',
          gender: p.gender ?? undefined,
          dateOfBirth: p.dateOfBirth ?? undefined,
          city: p.city ?? '',
          country: p.country ?? '',
          avatarUrl: p.avatarUrl ?? '',
          coverUrl: p.coverUrl ?? '',
          categoryIds: p.categoryIds ?? [],
        });
        if (p.dateOfBirth) {
          const d = new Date(p.dateOfBirth);
          if (!isNaN(d.getTime())) setDob(d);
        }
      } else {
        toast.error('Không tải được hồ sơ KOL.');
      }
      if (cRes.status === 'fulfilled') setCategories(cRes.value);
    }).finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [authLoading, isAuthenticated]);

  // ─── Helpers ───
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const selectedCategoryIds = form.categoryIds ?? [];

  function setField<K extends keyof UpdateKolProfileRequest>(key: K, value: UpdateKolProfileRequest[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleBio(v: string) {
    if (v.length > 2000) return;
    setField('bio', v);
    if (v.length > 0 && v.length < 20) {
      setBioError('Giới thiệu phải có ít nhất 20 ký tự (hoặc để trống).');
    } else {
      setBioError(null);
    }
  }

  function handleSlug(v: string) {
    setField('slug', v);
    if (!v) { setSlugError('Slug không được trống'); return; }
    if (!SLUG_RE.test(v)) {
      setSlugError('Slug phải dạng chữ-thường-có-gạch-ngang (vd: tran-thi-mai)');
    } else {
      setSlugError(null);
    }
  }

  function toggleCategory(id: number) {
    const cur = selectedCategoryIds;
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    setField('categoryIds', next);
  }

  async function uploadImage(file: File, kind: 'avatar' | 'cover') {
    const validationError = validateUploadFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const setBusy = kind === 'avatar' ? setAvatarUploading : setCoverUploading;
    setBusy(true);
    try {
      const res = await filesApi.upload(file);
      setField(kind === 'avatar' ? 'avatarUrl' : 'coverUrl', res.url);
      toast.success(kind === 'avatar' ? 'Đã tải lên ảnh đại diện.' : 'Đã tải lên ảnh bìa.');
    } catch (e) {
      toast.error(errMsg(e, 'Tải lên thất bại'));
    } finally {
      setBusy(false);
    }
  }

  // ─── Save basic info ───
  async function handleSave() {
    if (slugError) {
      toast.error(slugError);
      return;
    }
    if (bioError) {
      toast.error(bioError);
      return;
    }
    setIsSaving(true);
    try {
      const payload: UpdateKolProfileRequest = {
        displayName: form.displayName?.trim() || undefined,
        slug: form.slug?.trim() || undefined,
        avatarUrl: form.avatarUrl || undefined,
        coverUrl: form.coverUrl || undefined,
        bio: form.bio ?? undefined,
        gender: form.gender,
        dateOfBirth: dob ? isoDate(dob) : undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        categoryIds: form.categoryIds ?? [],
      };
      const updated = await kolApi.updateMyProfile(payload);
      setProfile(updated);
      toast.success('Đã lưu thay đổi.');
    } catch (e) {
      toast.error(errMsg(e, 'Lưu thất bại'));
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Submit profile for review ───
  async function handleSubmitProfile() {
    setIsSubmitting(true);
    try {
      const updated = await kolApi.submitProfile();
      setProfile(updated);
      toast.success('Đã gửi hồ sơ chờ duyệt.');
    } catch (e) {
      toast.error(errMsg(e, 'Gửi duyệt thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Channel ops ───
  async function handleAddChannel(payload: CreateChannelRequest) {
    try {
      const c = await kolApi.addChannel(payload);
      setProfile(p => p ? { ...p, channels: [...p.channels, c] } : p);
      toast.success('Đã thêm kênh.');
      setChannelOpen(false);
    } catch (e) {
      toast.error(errMsg(e, 'Thêm kênh thất bại'));
    }
  }
  async function handleDeleteChannel(id: number) {
    try {
      await kolApi.deleteChannel(id);
      setProfile(p => p ? { ...p, channels: p.channels.filter(c => c.id !== id) } : p);
      toast.success('Đã xoá kênh.');
    } catch (e) {
      toast.error(errMsg(e, 'Xoá kênh thất bại'));
    }
  }

  // ─── Package ops ───
  async function handleAddPackage(payload: CreatePackageRequest) {
    try {
      const x = await kolApi.addPackage(payload);
      setProfile(p => p ? { ...p, pricingPackages: [...p.pricingPackages, x] } : p);
      toast.success('Đã thêm gói.');
      setPackageOpen(false);
    } catch (e) {
      toast.error(errMsg(e, 'Thêm gói thất bại'));
    }
  }
  async function handleDeletePackage(id: number) {
    try {
      await kolApi.deletePackage(id);
      setProfile(p => p ? { ...p, pricingPackages: p.pricingPackages.filter(x => x.id !== id) } : p);
      toast.success('Đã xoá gói.');
    } catch (e) {
      toast.error(errMsg(e, 'Xoá gói thất bại'));
    }
  }

  // ─── Portfolio ops ───
  async function handleAddPortfolio(payload: CreatePortfolioItemRequest) {
    try {
      const x = await kolApi.addPortfolioItem(payload);
      setProfile(p => p ? { ...p, portfolio: [...p.portfolio, x] } : p);
      toast.success('Đã thêm mục portfolio.');
      setPortfolioOpen(false);
    } catch (e) {
      toast.error(errMsg(e, 'Thêm portfolio thất bại'));
    }
  }
  async function handleDeletePortfolio(id: number) {
    try {
      await kolApi.deletePortfolioItem(id);
      setProfile(p => p ? { ...p, portfolio: p.portfolio.filter(x => x.id !== id) } : p);
      toast.success('Đã xoá mục portfolio.');
    } catch (e) {
      toast.error(errMsg(e, 'Xoá portfolio thất bại'));
    }
  }

  // ─── Loading / error states ───
  if (authLoading || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-6">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-96" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft flex items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Cần đăng nhập</CardTitle>
              <CardDescription>Bạn cần đăng nhập để chỉnh sửa hồ sơ KOL.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/auth/login"><Button>Đăng nhập</Button></Link>
            </CardFooter>
          </Card>
        </main>
      </>
    );
  }

  if (user.role !== 'KOL') {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft flex items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Chỉ dành cho KOL</CardTitle>
              <CardDescription>
                Trang này chỉ dành cho người dùng có vai trò KOL. Tài khoản hiện tại của bạn là {user.role}.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/"><Button>Về trang chủ</Button></Link>
            </CardFooter>
          </Card>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface-soft flex items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Chưa có hồ sơ KOL</CardTitle>
              <CardDescription>Bạn chưa khởi tạo hồ sơ KOL. Vui lòng liên hệ quản trị viên hoặc đăng ký lại với vai trò KOL.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  // ─── Completeness checks ───
  const hasChannel = profile.channels.length > 0;
  const hasPackage = profile.pricingPackages.length > 0;
  const hasPortfolio = profile.portfolio.length > 0;
  const isComplete = hasChannel && hasPackage && hasPortfolio;
  const canSubmit = canSubmitProfile(profile.status) && isComplete;
  const showSubmit = canSubmitProfile(profile.status);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-bold text-ink text-[28px] lg:text-[36px] tracking-[-0.6px]">
              Hồ sơ KOL của tôi
            </h1>
            <Badge variant={profileStatusBadgeVariant(profile.status)} className="text-sm">
              {profileStatusDisplayLabel(profile.status)}
            </Badge>
          </div>
          <p className="text-mute mt-2">Quản lý thông tin hiển thị, kênh mạng xã hội, gói giá và portfolio.</p>

          {profile.status === 'REJECTED' && profile.rejectReason && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-red-700">Hồ sơ bị từ chối</p>
                <p className="text-red-600 mt-1">{profile.rejectReason}</p>
              </div>
            </div>
          )}

          {!isComplete && canSubmitProfile(profile.status) && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-amber-700">Hồ sơ chưa hoàn chỉnh</p>
                <p className="text-amber-700 mt-1">Cần ít nhất 1 kênh, 1 gói giá và 1 mục portfolio trước khi gửi duyệt.</p>
                <ul className="mt-2 space-y-0.5 text-amber-700">
                  <li className="flex items-center gap-2">
                    {hasChannel ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border-2 border-amber-400" />}
                    Kênh mạng xã hội ({profile.channels.length})
                  </li>
                  <li className="flex items-center gap-2">
                    {hasPackage ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border-2 border-amber-400" />}
                    Gói giá ({profile.pricingPackages.length})
                  </li>
                  <li className="flex items-center gap-2">
                    {hasPortfolio ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4 rounded-full border-2 border-amber-400" />}
                    Portfolio ({profile.portfolio.length})
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="channels">Kênh ({profile.channels.length})</TabsTrigger>
              <TabsTrigger value="packages">Gói giá ({profile.pricingPackages.length})</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio ({profile.portfolio.length})</TabsTrigger>
            </TabsList>

            {/* ─── Tab 1: Basic info ─── */}
            <TabsContent value="basic" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin hiển thị</CardTitle>
                  <CardDescription>Hồ sơ này sẽ hiển thị công khai khi được duyệt.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  {/* Avatar */}
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Ảnh đại diện</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-card grid place-items-center border border-hairline">
                        {form.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(form.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-mute">{(form.displayName ?? '?').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-hairline bg-canvas hover:bg-surface-card cursor-pointer text-sm font-semibold">
                          {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          Tải ảnh lên
                          <input type="file" accept={ACCEPTED_IMAGE_ACCEPT} className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadImage(file, 'avatar');
                              e.target.value = '';
                            }} />
                        </label>
                        <Input
                          placeholder="hoặc dán URL ảnh"
                          maxLength={500}
                          value={form.avatarUrl ?? ''}
                          onChange={(e) => setField('avatarUrl', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cover */}
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Ảnh bìa</Label>
                    <div className="space-y-2">
                      <div className="relative w-full h-32 rounded-md overflow-hidden bg-surface-card border border-hairline">
                        {form.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveMediaUrl(form.coverUrl)} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-mute text-sm">Chưa có ảnh bìa</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-hairline bg-canvas hover:bg-surface-card cursor-pointer text-sm font-semibold whitespace-nowrap">
                          {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          Tải ảnh lên
                          <input type="file" accept={ACCEPTED_IMAGE_ACCEPT} className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadImage(file, 'cover');
                              e.target.value = '';
                            }} />
                        </label>
                        <Input
                          placeholder="hoặc dán URL ảnh"
                          maxLength={500}
                          value={form.coverUrl ?? ''}
                          onChange={(e) => setField('coverUrl', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="displayName" className="mb-2 block">Tên hiển thị</Label>
                    <Input
                      id="displayName"
                      value={form.displayName ?? ''}
                      onChange={(e) => setField('displayName', e.target.value)}
                      placeholder="Trần Thị Mai"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug" className="mb-2 block">Slug (URL công khai)</Label>
                    <Input
                      id="slug"
                      value={form.slug ?? ''}
                      onChange={(e) => handleSlug(e.target.value)}
                      placeholder="tran-thi-mai"
                      aria-invalid={!!slugError}
                    />
                    {slugError ? (
                      <p className="text-xs text-red-600 mt-1">{slugError}</p>
                    ) : (
                      <p className="text-xs text-mute mt-1">Chỉ chứa chữ thường, số và dấu gạch ngang.</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="bio" className="mb-2 block">Giới thiệu</Label>
                    <Textarea
                      id="bio"
                      value={form.bio ?? ''}
                      onChange={(e) => handleBio(e.target.value)}
                      rows={5}
                      maxLength={2000}
                      placeholder="Mô tả ngắn về bản thân, phong cách, lĩnh vực sở trường…"
                      aria-invalid={!!bioError}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {bioError
                        ? <p className="text-xs text-red-600">{bioError}</p>
                        : <span />
                      }
                      <p className="text-xs text-mute ml-auto">{(form.bio ?? '').length}/2000 ký tự</p>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Giới tính</Label>
                    <Select
                      value={form.gender ?? ''}
                      onValueChange={(v) => setField('gender', v as Gender)}
                    >
                      <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">{genderLabel.MALE}</SelectItem>
                        <SelectItem value="FEMALE">{genderLabel.FEMALE}</SelectItem>
                        <SelectItem value="OTHER">{genderLabel.OTHER}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Ngày sinh</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dob ? dob.toLocaleDateString('vi-VN') : <span className="text-mute">Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dob}
                          onSelect={setDob}
                          captionLayout="dropdown"
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="city" className="mb-2 block">Thành phố</Label>
                    <Input
                      id="city"
                      value={form.city ?? ''}
                      onChange={(e) => setField('city', e.target.value)}
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country" className="mb-2 block">Quốc gia</Label>
                    <Input
                      id="country"
                      value={form.country ?? ''}
                      onChange={(e) => setField('country', e.target.value)}
                      placeholder="Việt Nam"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-2 block">Danh mục</Label>
                    {flatCategories.length === 0 ? (
                      <p className="text-sm text-mute">Chưa có danh mục.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {flatCategories.map(c => {
                          const checked = selectedCategoryIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCategory(c.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                checked
                                  ? 'bg-ink text-on-dark border-ink'
                                  : 'bg-canvas text-ink border-hairline hover:bg-surface-card'
                              }`}
                            >
                              <Checkbox checked={checked} className="pointer-events-none" />
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-mute mt-2">Đã chọn {selectedCategoryIds.length} danh mục.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab 2: Channels ─── */}
            <TabsContent value="channels" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle>Kênh mạng xã hội</CardTitle>
                    <CardDescription>Liên kết và số liệu các kênh bạn đang vận hành.</CardDescription>
                  </div>
                  <Dialog open={channelOpen} onOpenChange={setChannelOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="w-4 h-4" /> Thêm kênh</Button>
                    </DialogTrigger>
                    <ChannelDialog onSubmit={handleAddChannel} />
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {profile.channels.length === 0 ? (
                    <div className="text-center py-12 text-mute">
                      <p>Chưa có kênh nào. Nhấn "Thêm kênh" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-hairline text-left text-mute">
                            <th className="py-3 pr-4 font-semibold">Nền tảng</th>
                            <th className="py-3 pr-4 font-semibold">Tên đăng nhập</th>
                            <th className="py-3 pr-4 font-semibold">Người theo dõi</th>
                            <th className="py-3 pr-4 font-semibold">Tương tác</th>
                            <th className="py-3 pr-4 font-semibold">URL</th>
                            <th className="py-3 pr-4 font-semibold w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.channels.map(c => (
                            <tr key={c.id} className="border-b border-hairline-soft last:border-0">
                              <td className="py-3 pr-4">
                                <Badge variant="secondary">{platformLabel[c.platform]}</Badge>
                              </td>
                              <td className="py-3 pr-4 font-medium">{c.username}</td>
                              <td className="py-3 pr-4">{c.followerCount.toLocaleString('vi-VN')}</td>
                              <td className="py-3 pr-4">{c.engagementRate.toFixed(2)}%</td>
                              <td className="py-3 pr-4">
                                <a href={c.url} target="_blank" rel="noreferrer"
                                   className="inline-flex items-center gap-1 text-pin-red hover:underline">
                                  Mở <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                              <td className="py-3 pr-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteChannel(c.id)}
                                  aria-label="Xoá kênh"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab 3: Packages ─── */}
            <TabsContent value="packages" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle>Gói giá</CardTitle>
                    <CardDescription>Cấu hình các gói dịch vụ bạn cung cấp cho thương hiệu.</CardDescription>
                  </div>
                  <Dialog open={packageOpen} onOpenChange={setPackageOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="w-4 h-4" /> Thêm gói</Button>
                    </DialogTrigger>
                    <PackageDialog onSubmit={handleAddPackage} />
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {profile.pricingPackages.length === 0 ? (
                    <div className="text-center py-12 text-mute">
                      <p>Chưa có gói nào. Nhấn "Thêm gói" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {profile.pricingPackages.map(p => (
                        <Card key={p.id} className="border-hairline">
                          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge>{packageTypeLabel[p.type]}</Badge>
                                <Badge variant="secondary">{platformLabel[p.platform]}</Badge>
                              </div>
                              <p className="font-display font-bold text-ink text-xl mt-2">
                                {vnd.format(p.price)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePackage(p.id)}
                              aria-label="Xoá gói"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-mute whitespace-pre-line">{p.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab 4: Portfolio ─── */}
            <TabsContent value="portfolio" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle>Portfolio</CardTitle>
                    <CardDescription>Các chiến dịch hoặc nội dung tiêu biểu của bạn.</CardDescription>
                  </div>
                  <Dialog open={portfolioOpen} onOpenChange={setPortfolioOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="w-4 h-4" /> Thêm portfolio</Button>
                    </DialogTrigger>
                    <PortfolioDialog onSubmit={handleAddPortfolio} />
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {profile.portfolio.length === 0 ? (
                    <div className="text-center py-12 text-mute">
                      <p>Chưa có mục portfolio. Nhấn "Thêm portfolio" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {profile.portfolio.map((item) => (
                        <div key={item.id} className="relative">
                          <PortfolioItemCard item={item} variant="editor" />
                          <Badge className="absolute top-3 right-3" variant="secondary">
                            {item.mediaType === 'VIDEO' ? <><Video className="w-3 h-3 mr-1" /> Video</> : <><ImageIcon className="w-3 h-3 mr-1" /> Ảnh</>}
                          </Badge>
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeletePortfolio(item.id)}
                              aria-label="Xoá mục"
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Xoá
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-mute">Trạng thái:</span>
            <Badge variant={profileStatusBadgeVariant(profile.status)}>{profileStatusDisplayLabel(profile.status)}</Badge>
            {isPendingReview(profile.status) && (
              <span className="text-mute hidden sm:inline">Hồ sơ đang chờ quản trị viên duyệt.</span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={handleSave}
              disabled={isSaving || avatarUploading || coverUploading}
              variant="outline"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu thay đổi
            </Button>
            {showSubmit && (
              <Button
                onClick={handleSubmitProfile}
                disabled={isSubmitting || !canSubmit}
                title={!canSubmit ? 'Cần đủ kênh, gói và portfolio' : undefined}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi duyệt
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────── Channel Dialog ─────────────────────────

function ChannelDialog({ onSubmit }: { onSubmit: (data: CreateChannelRequest) => Promise<void> }) {
  const [platform, setPlatform] = useState<Platform>('TIKTOK');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [followerCount, setFollowerCount] = useState<string>('0');
  const [engagementRate, setEngagementRate] = useState<string>('0');
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !username.trim()) {
      toast.error('URL và username không được trống');
      return;
    }
    const fc = Number(followerCount);
    const er = Number(engagementRate);
    if (!Number.isFinite(fc) || fc < 0) { toast.error('Số người theo dõi không hợp lệ'); return; }
    if (!Number.isFinite(er) || er < 0 || er > 100) { toast.error('Tỉ lệ tương tác phải trong [0, 100]'); return; }
    setBusy(true);
    try {
      await onSubmit({
        platform: normalizePlatform(platform),
        url: url.trim(),
        username: username.trim(),
        followerCount: Math.floor(fc),
        engagementRate: er,
        verified,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Thêm kênh mạng xã hội</DialogTitle>
        <DialogDescription>Nhập thông tin kênh để hiển thị trong hồ sơ.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label className="mb-2 block">Nền tảng</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(platformLabel) as Platform[]).map(k => (
                <SelectItem key={k} value={k}>{platformLabel[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ch-url" className="mb-2 block">URL kênh</Label>
          <Input id="ch-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tiktok.com/@username" />
        </div>
        <div>
          <Label htmlFor="ch-username" className="mb-2 block">Tên đăng nhập</Label>
          <Input id="ch-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ch-followers" className="mb-2 block">Người theo dõi</Label>
            <Input id="ch-followers" type="number" min={0} value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ch-er" className="mb-2 block">Tương tác (%)</Label>
            <Input id="ch-er" type="number" min={0} max={100} step="0.01" value={engagementRate} onChange={(e) => setEngagementRate(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={verified} onCheckedChange={(v) => setVerified(v === true)} />
          Tài khoản đã xác minh (verified)
        </label>
        <DialogFooter>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Thêm kênh
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ───────────────────────── Package Dialog ─────────────────────────

function PackageDialog({ onSubmit }: { onSubmit: (data: CreatePackageRequest) => Promise<void> }) {
  const [type, setType] = useState<PricingPackageType>('POST');
  const [platform, setPlatform] = useState<Platform>('TIKTOK');
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const priceNum = parsePriceDigits(price);
  const pricePreview = priceNum != null && priceNum > 0 ? vnd.format(priceNum) : '—';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { toast.error('Mô tả không được trống'); return; }
    const err = validatePriceDigits(price, { required: true, fieldLabel: 'Giá' });
    setPriceError(err);
    if (err) return;
    if (priceNum == null || priceNum <= 0) { toast.error('Giá phải lớn hơn 0'); return; }
    setBusy(true);
    try {
      await onSubmit({
        type,
        platform: normalizePlatform(platform),
        price: Math.floor(priceNum),
        description: description.trim(),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Thêm gói giá</DialogTitle>
        <DialogDescription>Cấu hình loại dịch vụ, nền tảng và mức giá.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-2 block">Loại</Label>
            <Select value={type} onValueChange={(v) => setType(v as PricingPackageType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(packageTypeLabel) as PricingPackageType[]).map(k => (
                  <SelectItem key={k} value={k}>{packageTypeLabel[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Nền tảng</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(platformLabel) as Platform[]).map(k => (
                  <SelectItem key={k} value={k}>{platformLabel[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="pk-price" className="mb-2 block">Giá (VND)</Label>
          <CurrencyInput
            id="pk-price"
            value={price}
            onValueChange={(digits) => { setPrice(digits); if (priceError) setPriceError(''); }}
            onValidate={setPriceError}
            validateOptions={{ required: true, fieldLabel: 'Giá' }}
            className={priceError ? 'border-red-500' : undefined}
          />
          {priceError && <p className="text-xs text-red-600 mt-1">{priceError}</p>}
          <p className="text-xs text-mute mt-1">Hiển thị: {pricePreview}</p>
        </div>
        <div>
          <Label htmlFor="pk-desc" className="mb-2 block">Mô tả</Label>
          <Textarea id="pk-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả nội dung gói: số bài, thời lượng, yêu cầu giao nội dung…" />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Thêm gói
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ───────────────────────── Portfolio Dialog ─────────────────────────

function PortfolioDialog({ onSubmit }: { onSubmit: (data: CreatePortfolioItemRequest) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [mediaUrl, setMediaUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    const kind = mediaType === 'VIDEO' ? 'video' : 'image';
    const validationError = validateUploadFile(file, kind);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    try {
      const res = await filesApi.upload(file);
      setMediaUrl(res.url);
      toast.success('Đã tải lên.');
    } catch (e) {
      toast.error(errMsg(e, 'Tải lên thất bại'));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !campaignName.trim() || !mediaUrl.trim()) {
      toast.error('Vui lòng điền đầy đủ tiêu đề, chiến dịch và media URL');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        mediaUrl: mediaUrl.trim(),
        mediaType,
        campaignName: campaignName.trim(),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Thêm mục portfolio</DialogTitle>
        <DialogDescription>Đính kèm ảnh hoặc video cùng thông tin chiến dịch.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="po-title" className="mb-2 block">Tiêu đề</Label>
          <Input id="po-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chiến dịch Tết 2026" />
        </div>
        <div>
          <Label htmlFor="po-campaign" className="mb-2 block">Tên chiến dịch / Thương hiệu</Label>
          <Input id="po-campaign" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Brand X" />
        </div>
        <div>
          <Label className="mb-2 block">Loại media</Label>
          <Select value={mediaType} onValueChange={(v) => setMediaType(v as MediaType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="IMAGE">Ảnh</SelectItem>
              <SelectItem value="VIDEO">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="po-url" className="mb-2 block">Liên kết media</Label>
          <div className="flex items-center gap-2">
            <Input id="po-url" value={mediaUrl} maxLength={500} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://www.tiktok.com/@user/video/… hoặc link ảnh/mp4" />
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-hairline bg-canvas hover:bg-surface-card cursor-pointer text-sm font-semibold whitespace-nowrap">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Tải lên
              <input
                type="file"
                accept={mediaType === 'VIDEO' ? ACCEPTED_VIDEO_ACCEPT : ACCEPTED_IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {mediaUrl && (
            <div className="mt-3 overflow-hidden rounded-md border border-hairline bg-surface-card">
              <PortfolioMediaPreview mediaType={mediaType} mediaUrl={mediaUrl} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Thêm
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
