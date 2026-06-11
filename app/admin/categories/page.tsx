'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Loader2,
  AlertCircle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApi } from '@/lib/api/categories';
import { adminApi } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import type { CategoryResponse, CreateCategoryRequest } from '@/lib/api/types';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type DialogMode =
  | { kind: 'create'; parent: CategoryResponse | null }
  | { kind: 'edit'; target: CategoryResponse };

type DeleteState = { target: CategoryResponse } | null;

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.getAll();
      setTree(res);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : 'Không thể tải danh mục. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const totalCount = useMemo(() => {
    const count = (nodes: CategoryResponse[]): number =>
      nodes.reduce((sum, n) => sum + 1 + count(n.children ?? []), 0);
    return count(tree);
  }, [tree]);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateRoot() {
    setDialog({ kind: 'create', parent: null });
    setFormName('');
    setFormSlug('');
    setSlugTouched(false);
    setFormError(null);
  }

  function openCreateChild(parent: CategoryResponse) {
    setDialog({ kind: 'create', parent });
    setFormName('');
    setFormSlug('');
    setSlugTouched(false);
    setFormError(null);
    setExpanded((prev) => new Set(prev).add(parent.id));
  }

  function openEdit(target: CategoryResponse) {
    setDialog({ kind: 'edit', target });
    setFormName(target.name);
    setFormSlug(target.slug);
    setSlugTouched(true);
    setFormError(null);
  }

  function closeDialog() {
    if (isSubmitting) return;
    setDialog(null);
    setFormName('');
    setFormSlug('');
    setSlugTouched(false);
    setFormError(null);
  }

  function onNameChange(value: string) {
    setFormName(value);
    if (!slugTouched) {
      setFormSlug(slugify(value));
    }
    if (formError) setFormError(null);
  }

  function onSlugChange(value: string) {
    setSlugTouched(true);
    setFormSlug(value);
    if (formError) setFormError(null);
  }

  async function submitForm() {
    if (!dialog) return;
    const name = formName.trim();
    const slug = formSlug.trim();
    if (!name) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }
    if (!slug) {
      setFormError('Slug không được để trống.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setFormError('Slug chỉ chứa chữ thường, số và dấu gạch nối.');
      return;
    }

    const payload: CreateCategoryRequest = {
      name,
      slug,
      parentId:
        dialog.kind === 'create'
          ? dialog.parent?.id ?? null
          : dialog.target.parentId,
    };

    setIsSubmitting(true);
    try {
      if (dialog.kind === 'create') {
        await adminApi.createCategory(payload);
        toast.success(`Đã tạo danh mục "${name}"`);
      } else {
        await adminApi.updateCategory(dialog.target.id, payload);
        toast.success(`Đã cập nhật danh mục "${name}"`);
      }
      setDialog(null);
      await fetchTree();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDelete(target: CategoryResponse) {
    setDeleteState({ target });
  }

  function closeDelete() {
    if (isDeleting) return;
    setDeleteState(null);
  }

  async function confirmDelete() {
    if (!deleteState) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteCategory(deleteState.target.id);
      toast.success(`Đã xóa danh mục "${deleteState.target.name}"`);
      setDeleteState(null);
      await fetchTree();
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Không thể xóa. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  // Stable title/kind that retain their last value during the dialog's close
  // animation. Why: when `dialog` flips to null, deriving the title inline
  // falls through to "Thêm danh mục gốc", which read as "auto-opening the
  // root-create dialog" in QA right after an edit.
  const [stableDialogTitle, setStableDialogTitle] = useState('Thêm danh mục gốc');
  const [stableDialogKind, setStableDialogKind] = useState<'create' | 'edit'>(
    'create',
  );
  useEffect(() => {
    if (!dialog) return;
    setStableDialogKind(dialog.kind);
    if (dialog.kind === 'edit') {
      setStableDialogTitle('Sửa danh mục');
    } else if (dialog.parent) {
      setStableDialogTitle(`Thêm danh mục con của "${dialog.parent.name}"`);
    } else {
      setStableDialogTitle('Thêm danh mục gốc');
    }
  }, [dialog]);
  const dialogTitle = stableDialogTitle;

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-display font-bold text-ink text-[20px] tracking-tight">
          Danh mục{' '}
          {!isLoading && !error && (
            <span className="text-pin-red">({totalCount})</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTree}
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold hover:bg-secondary-bg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreateRoot}
            className="inline-flex items-center gap-2 bg-pin-red text-on-dark rounded-full px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Thêm danh mục gốc
          </button>
        </div>
      </div>

      {isLoading ? (
        <TreeSkeleton />
      ) : error ? (
        <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
          <AlertCircle className="w-10 h-10 text-pin-red mx-auto mb-3" />
          <p className="text-pin-red text-base font-bold mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchTree}
            className="inline-flex items-center gap-2 bg-surface-card text-ink rounded-full px-4 py-2 text-sm font-bold hover:bg-secondary-bg transition-colors"
          >
            Thử lại
          </button>
        </div>
      ) : tree.length === 0 ? (
        <div className="bg-canvas rounded-md border border-hairline p-12 text-center">
          <Inbox className="w-12 h-12 text-mute mx-auto mb-4" />
          <p className="text-ink text-lg font-bold mb-1">Chưa có danh mục</p>
          <p className="text-mute text-sm mb-4">
            Bắt đầu bằng cách tạo danh mục gốc đầu tiên.
          </p>
          <button
            type="button"
            onClick={openCreateRoot}
            className="inline-flex items-center gap-2 bg-pin-red text-on-dark rounded-full px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Thêm danh mục gốc
          </button>
        </div>
      ) : (
        <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
          <ul className="divide-y divide-hairline-soft">
            {tree.map((node) => (
              <CategoryNode
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggleExpand}
                onAddChild={openCreateChild}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {stableDialogKind === 'edit'
                ? 'Cập nhật tên hiển thị và slug. Slug được dùng trong URL công khai.'
                : 'Slug được tự động tạo từ tên — bạn vẫn có thể chỉnh sửa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="cat-name" className="block text-sm font-bold text-ink">
                Tên danh mục <span className="text-pin-red">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                value={formName}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    submitForm();
                  }
                }}
                placeholder="Ví dụ: Thời trang & Làm đẹp"
                maxLength={100}
                autoFocus
                disabled={isSubmitting}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-focus-outer"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cat-slug" className="block text-sm font-bold text-ink">
                Slug <span className="text-pin-red">*</span>
              </label>
              <input
                id="cat-slug"
                type="text"
                value={formSlug}
                onChange={(e) => onSlugChange(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    submitForm();
                  }
                }}
                placeholder="thoi-trang-lam-dep"
                maxLength={120}
                disabled={isSubmitting}
                className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm font-mono text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-focus-outer"
              />
              <p className="text-xs text-mute">
                Chỉ chữ thường, số và dấu gạch nối. Tự động sinh từ tên khi bạn gõ.
              </p>
            </div>

            {formError && (
              <p className="text-sm text-pin-red font-semibold">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={closeDialog}
              disabled={isSubmitting}
              className="rounded-full px-4 py-2 text-sm font-bold bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {stableDialogKind === 'edit' ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteState !== null}
        onOpenChange={(open) => {
          if (!open) closeDelete();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa danh mục</DialogTitle>
            <DialogDescription>
              {deleteState && (
                <>
                  Bạn sắp xóa danh mục{' '}
                  <span className="font-bold text-ink">{deleteState.target.name}</span>.
                  Xóa danh mục sẽ ảnh hưởng đến KOL đang gắn category này.
                  {(deleteState.target.children?.length ?? 0) > 0 && (
                    <>
                      {' '}Danh mục con bên trong cũng sẽ bị ảnh hưởng.
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <button
              type="button"
              onClick={closeDelete}
              disabled={isDeleting}
              className="rounded-full px-4 py-2 text-sm font-bold bg-surface-card text-ink hover:bg-secondary-bg disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold bg-pin-red text-on-dark hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận xóa
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryNode({
  node,
  depth,
  expanded,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: CategoryResponse;
  depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onAddChild: (n: CategoryResponse) => void;
  onEdit: (n: CategoryResponse) => void;
  onDelete: (n: CategoryResponse) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOpen = expanded.has(node.id);

  return (
    <li>
      <div
        className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-card/40 transition-colors"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="grid place-items-center w-6 h-6 rounded text-ink hover:bg-secondary-bg cursor-pointer"
            aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-6 h-6 shrink-0" aria-hidden />
        )}

        <FolderTree className="w-4 h-4 text-mute shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink text-sm truncate">{node.name}</p>
          <p className="text-xs text-mute font-mono truncate">
            {node.slug} · ID #{node.id}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAddChild(node)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
            title="Thêm danh mục con"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm con
          </button>
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-surface-card text-ink hover:bg-secondary-bg transition-colors"
            title="Sửa danh mục"
          >
            <Pencil className="w-3.5 h-3.5" />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-pin-red text-on-dark hover:opacity-90 transition-opacity"
            title="Xóa danh mục"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <ul className="border-t border-hairline-soft divide-y divide-hairline-soft">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function TreeSkeleton() {
  return (
    <div className="bg-canvas rounded-md border border-hairline overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-t border-hairline-soft first:border-t-0"
        >
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-4 h-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="w-20 h-7 rounded-full" />
          <Skeleton className="w-16 h-7 rounded-full" />
          <Skeleton className="w-16 h-7 rounded-full" />
        </div>
      ))}
    </div>
  );
}
