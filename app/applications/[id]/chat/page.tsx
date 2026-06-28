'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { ApplicationNegotiationChat } from '@/components/application-negotiation-chat';
import { applicationsApi } from '@/lib/api/applications';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import type { ProductApplicationResponse, ApplicationStatus } from '@/lib/api/types';

const TERMINAL_STATUSES: ApplicationStatus[] = ['WITHDRAWN', 'REJECTED', 'BOOKING_CANCELLED'];

export default function ApplicationChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [application, setApplication] = useState<ProductApplicationResponse | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applicationId = Number(params.id);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=/applications/${applicationId}/chat`);
    }
  }, [authLoading, isAuthenticated, applicationId, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !applicationId) return;
    setLoading(true);
    applicationsApi
      .getById(applicationId)
      .then(async (app) => {
        setApplication(app);
        try {
          const product = await productsApi.getById(app.productId);
          setProductTitle(product.title);
        } catch {
          setProductTitle(`Sản phẩm #${app.productId}`);
        }
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Không thể tải thông tin ứng tuyển.');
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, applicationId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !application || !user) {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-mute mb-4">{error || 'Không tìm thấy ứng tuyển.'}</p>
          <Link href={user?.role === 'KOL' ? '/applications/mine' : '/products'} className="btn-pin-primary">
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const backHref = user.role === 'KOL' ? '/applications/mine' : `/products/${application.productId}/applications`;

  return (
    <div className="min-h-screen bg-surface-soft">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <div className="bg-canvas rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <h1 className="font-display font-bold text-lg text-ink">Chat thương lượng</h1>
            <p className="text-xs text-mute mt-0.5">{productTitle}</p>
          </div>
          <div className="p-4">
            <ApplicationNegotiationChat
              applicationId={application.id}
              currentUserId={user.userId}
              currentUserRole={user.role as 'KOL' | 'BRAND'}
              isTerminal={TERMINAL_STATUSES.includes(application.status)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
