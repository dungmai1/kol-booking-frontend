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

/** Today's date as yyyy-MM-dd (local time). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  // Per-field errors
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [slotsError, setSlotsError] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const [minFollowersError, setMinFollowersError] = useState('');

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => setCategories([]));
  }, []);

  const flatCategories: CategoryResponse[] = categories.flatMap((c) => [c, ...(c.children ?? [])]);

  // ─── Field validators ───────────────────────────────────────────

  function validateTitle(v: string): string {
    if (!v.trim()) return 'Vui lòng nhập tiêu đề.';
    if (v.trim().length < 5) return 'Tiêu đề phải có ít nhất 5 ký tự.';
    if (v.trim().length > 200) return 'Tiêu đề không được vượt quá 200 ký tự.';
    return '';
  }

  function validateDescription(v: string): string {
    if (!v.trim()) return '';
    if (v.trim().length < 20) return 'Mô tả phải có ít nhất 20 ký tự (nếu điền).';
    if (v.trim().length > 3000) return 'Mô tả không được vượt quá 3000 ký tự.';
    return '';
  }

  function validateBudget(v: string): string {
    if (!v) return '';
    const n = Number(v);
    if (isNaN(n)) return 'Ngân sách không phải là số hợp lệ.';
    if (n <= 0) return 'Ngân sách phải lớn hơn 0.';
    return '';
  }

  function validateSlots(v: string): string {
    const n = Number(v);
    if (!v) return 'Vui lòng nhập số suất.';
    if (isNaN(n) || !Number.isInteger(n)) return 'Số suất phải là số nguyên.';
    if (n < 1) return 'Số suất phải ít nhất là 1.';
    if (n > 1000) return 'Số suất không được vượt quá 1000.';
    return '';
  }

  function validateDeadline(v: string): string {
    if (!v) return '';
    if (v < todayISO()) return 'Hạn ứng tuyển không được là ngày trong quá khứ.';
    return '';
  }

  function validateMinFollowers(v: string): string {
    if (!v) return '';
    const n = Number(v);
    if (isNaN(n)) return 'Người theo dõi tối thiểu không phải là số hợp lệ.';
    if (n < 100) return 'Người theo dõi tối thiểu phải ít nhất là 100.';
    if (n > 100_000_000) return 'Người theo dõi tối thiểu không được vượt quá 100,000,000.';
    return '';
  }

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

    // Run all validators
    const tErr = validateTitle(title);
    const dErr = validateDescription(description);
    const bErr = validateBudget(budget);
    const sErr = validateSlots(slots);
    const dlErr = validateDeadline(deadline);
    const mfErr = validateMinFollowers(minFollowers);

    setTitleError(tErr);
    setDescriptionError(dErr);
    setBudgetError(bErr);
    setSlotsError(sErr);
    setDeadlineError(dlErr);
    setMinFollowersError(mfErr);

    if (tErr || dErr || bErr || sErr || dlErr || mfErr) return;

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
  const inputErrorClass =
    'w-full px-3 py-2.5 rounded-xl border border-red-500 bg-surface-soft focus:bg-canvas focus:border-red-500 focus:outline-none text-sm';
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

      {/* Title */}
      <div>
        <label className={labelClass}>Tiêu đề <span className="text-pin-red">*</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(''); }}
          onBlur={() => setTitleError(validateTitle(title))}
          maxLength={200}
          placeholder="VD: Tìm KOL review sản phẩm chăm sóc da"
          className={titleError ? inputErrorClass : inputClass}
        />
        <div className="flex items-center justify-between mt-1">
          {titleError
            ? <p className="text-xs text-red-600">{titleError}</p>
            : <span />
          }
          <p className="text-xs text-mute ml-auto">{title.length}/200</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Mô tả chi tiết</label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); if (descriptionError) setDescriptionError(''); }}
          onBlur={() => setDescriptionError(validateDescription(description))}
          rows={5}
          maxLength={3000}
          placeholder="Mô tả yêu cầu, nội dung giao, thông điệp thương hiệu…"
          className={`${descriptionError ? inputErrorClass : inputClass} resize-none`}
        />
        <div className="flex items-center justify-between mt-1">
          {descriptionError
            ? <p className="text-xs text-red-600">{descriptionError}</p>
            : <span />
          }
          <p className="text-xs text-mute ml-auto">{description.length}/3000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Budget */}
        <div>
          <label className={labelClass}>Ngân sách (VND)</label>
          <input
            type="number"
            min={0}
            step={1000}
            value={budget}
            onChange={(e) => { setBudget(e.target.value); if (budgetError) setBudgetError(''); }}
            onBlur={() => setBudgetError(validateBudget(budget))}
            placeholder="VD: 5000000"
            className={budgetError ? inputErrorClass : inputClass}
          />
          {budgetError && <p className="text-xs text-red-600 mt-1">{budgetError}</p>}
        </div>

        {/* Slots */}
        <div>
          <label className={labelClass}>Số suất tuyển</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={slots}
            onChange={(e) => { setSlots(e.target.value); if (slotsError) setSlotsError(''); }}
            onBlur={() => setSlotsError(validateSlots(slots))}
            className={slotsError ? inputErrorClass : inputClass}
          />
          {slotsError && <p className="text-xs text-red-600 mt-1">{slotsError}</p>}
        </div>

        {/* Category */}
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

        {/* Platform */}
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

        {/* Min followers */}
        <div>
          <label className={labelClass}>Người theo dõi tối thiểu</label>
          <input
            type="number"
            min={0}
            value={minFollowers}
            onChange={(e) => { setMinFollowers(e.target.value); if (minFollowersError) setMinFollowersError(''); }}
            onBlur={() => setMinFollowersError(validateMinFollowers(minFollowers))}
            placeholder="VD: 10000"
            className={minFollowersError ? inputErrorClass : inputClass}
          />
          {minFollowersError && <p className="text-xs text-red-600 mt-1">{minFollowersError}</p>}
        </div>

        {/* Deadline */}
        <div>
          <label className={labelClass}>Hạn ứng tuyển</label>
          <input
            type="date"
            value={deadline}
            min={todayISO()}
            onChange={(e) => { setDeadline(e.target.value); if (deadlineError) setDeadlineError(''); }}
            onBlur={() => setDeadlineError(validateDeadline(deadline))}
            className={deadlineError ? inputErrorClass : inputClass}
          />
          {deadlineError && <p className="text-xs text-red-600 mt-1">{deadlineError}</p>}
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
