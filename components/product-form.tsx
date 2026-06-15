'use client';

import { useEffect, useState } from 'react';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { categoriesApi } from '@/lib/api/categories';
import { resolveMediaUrl } from '@/lib/api/client';
import { filesApi } from '@/lib/api/files';
import type { CategoryResponse, Platform, ProductResponse, ProductCreateRequest } from '@/lib/api/types';
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from '@/lib/products/meta';

interface ProductFormProps {
  initial?: ProductResponse | null;
  submitLabel: string;
  submitting: boolean;
  error?: string;
  disabled?: boolean;
  /** Emits a clean payload with only the fields the user set. */
  onSubmit: (payload: ProductCreateRequest) => void;
  onCancel?: () => void;
}

/** Convert an ISO date/datetime to a yyyy-MM-dd value for <input type="date">. */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function ProductForm({ initial, submitLabel, submitting, error, disabled = false, onSubmit, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId != null ? String(initial.categoryId) : '');
  const [platform, setPlatform] = useState<string>(initial?.requiredPlatform ?? '');
  const [minFollowers, setMinFollowers] = useState(initial?.minFollowers != null ? String(initial.minFollowers) : '');
  const [slots, setSlots] = useState(initial?.slots != null ? String(initial.slots) : '1');
  const [deadline, setDeadline] = useState(toDateInput(initial?.deadline));

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const flatCategories: CategoryResponse[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const res = await filesApi.upload(file);
      setImageUrl(res.url);
    } catch {
      setUploadError('Tải ảnh thất bại. Thử lại hoặc dán URL ảnh.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề.');
      return;
    }
    if (slots && Number(slots) < 1) {
      setFormError('Số suất phải lớn hơn 0.');
      return;
    }
    if (budget && Number(budget) < 0) {
      setFormError('Ngân sách không hợp lệ.');
      return;
    }
    const payload: ProductCreateRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      budget: budget ? Number(budget) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      requiredPlatform: (platform as Platform) || undefined,
      minFollowers: minFollowers ? Number(minFollowers) : undefined,
      slots: slots ? Number(slots) : undefined,
      deadline: deadline || undefined,
    };
    onSubmit(payload);
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface-soft focus:bg-canvas focus:border-ink focus:outline-none text-sm';
  const labelClass = 'block text-sm font-bold text-ink mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image */}
      <div>
        <label className={labelClass}>Ảnh chiến dịch</label>
        {imageUrl ? (
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveMediaUrl(imageUrl)} alt="Xem trước" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 grid place-items-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Xoá ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-hairline bg-surface-soft cursor-pointer hover:border-ink transition-colors">
            {uploading ? (
              <Loader2 className="w-7 h-7 text-mute animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-7 h-7 text-mute" />
                <span className="text-sm text-mute">Nhấn để tải ảnh lên</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
        )}
        {uploadError && <p className="text-sm text-pin-red mt-1.5">{uploadError}</p>}
      </div>

      <div>
        <label className={labelClass}>Tiêu đề <span className="text-pin-red">*</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="VD: Tìm KOL review sản phẩm chăm sóc da"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Mô tả chi tiết</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Mô tả yêu cầu, nội dung giao, thông điệp thương hiệu…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Ngân sách (VND)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="VD: 5000000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Số suất tuyển</label>
          <input
            type="number"
            min={1}
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Danh mục</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">Chọn danh mục</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Nền tảng yêu cầu</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputClass}>
            <option value="">Mọi nền tảng</option>
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Người theo dõi tối thiểu</label>
          <input
            type="number"
            min={0}
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value)}
            placeholder="VD: 10000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Hạn ứng tuyển</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {(formError || error) && (
        <p className="text-sm text-pin-red font-medium bg-pin-red/10 rounded-xl px-3 py-2.5">
          {formError || error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="btn-pin-secondary !rounded-full disabled:opacity-50"
          >
            Huỷ
          </button>
        )}
        <button type="submit" disabled={disabled || submitting || uploading} className="btn-pin-primary !rounded-full disabled:opacity-50">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
