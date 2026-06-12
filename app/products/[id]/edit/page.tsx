'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { ProductForm } from '@/components/product-form';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import type { ProductCreateRequest, ProductResponse } from '@/lib/api/types';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=/products/${id}/edit`);
    } else if (user && user.role !== 'BRAND') {
      router.replace(`/products/${id}`);
    }
  }, [authLoading, isAuthenticated, user, router, id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProduct(await productsApi.getById(id));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    void load();
  }, [id, load]);

  async function handleSubmit(payload: ProductCreateRequest) {
    setSubmitting(true);
    setError('');
    try {
      await productsApi.update(id, payload);
      router.push(`/products/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cập nhật thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  if (authLoading || loading || user?.role !== 'BRAND') {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <main className="max-w-[640px] mx-auto px-4 py-20 text-center">
          <XCircle className="w-12 h-12 text-pin-red mx-auto mb-4" />
          <h1 className="font-display font-extrabold text-2xl text-ink mb-3">Không tìm thấy sản phẩm</h1>
          <Link href="/products/manage" className="btn-pin-primary !rounded-full">Tin của tôi</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <Header />
      <main className="mx-auto max-w-[760px] px-4 sm:px-6 py-8">
        <Link href={`/products/${id}`} className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay lại tin đăng
        </Link>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">Chỉnh sửa tin đăng</h1>
        <p className="text-mute mb-6">Cập nhật thông tin chiến dịch. Chỉ những trường bạn thay đổi mới được lưu.</p>

        <div className="bg-canvas rounded-2xl border border-hairline p-6">
          <ProductForm
            initial={product}
            submitLabel="Lưu thay đổi"
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/products/${id}`)}
          />
        </div>
      </main>
    </div>
  );
}
