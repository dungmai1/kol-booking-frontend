'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { ProductForm } from '@/components/product-form';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import type { ProductCreateRequest } from '@/lib/api/types';

export default function NewProductPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/products/new');
    } else if (user && user.role !== 'BRAND') {
      router.replace('/products');
    }
  }, [isLoading, isAuthenticated, user, router]);

  async function handleSubmit(payload: ProductCreateRequest) {
    setSubmitting(true);
    setError('');
    try {
      const created = await productsApi.create(payload);
      router.push(`/products/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Đăng sản phẩm thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  if (isLoading || !isAuthenticated || user?.role !== 'BRAND') {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-ink" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <Header />
      <main className="mx-auto max-w-[760px] px-4 sm:px-6 py-8">
        <Link href="/products/manage" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink mb-4">
          <ArrowLeft className="w-4 h-4" />
          Tin của tôi
        </Link>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">Đăng sản phẩm</h1>
        <p className="text-mute mb-6">Tạo tin tuyển KOL để các nhà sáng tạo có thể ứng tuyển.</p>

        <div className="bg-canvas rounded-2xl border border-hairline p-6">
          <ProductForm
            submitLabel="Đăng tin"
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/products/manage')}
          />
        </div>
      </main>
    </div>
  );
}
