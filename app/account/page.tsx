'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Mail, Shield } from 'lucide-react';
import { Header } from '@/components/header';
import { DeleteAccountPanel } from '@/components/delete-account-panel';
import { useAuth } from '@/contexts/AuthContext';

const roleLabel = {
  KOL: 'KOL',
  BRAND: 'Brand',
  ADMIN: 'Admin',
} as const;

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/account');
      return;
    }
    if (user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user || user.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-surface-soft">
        <Header />
        <div className="grid place-items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-pin-red" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft">
      <Header />
      <main className="max-w-[640px] mx-auto px-4 py-8">
        <Link
          href={user.role === 'KOL' ? '/kol-dashboard/me' : '/dashboard'}
          className="inline-flex items-center gap-2 text-sm font-semibold text-mute hover:text-ink mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Tài khoản</h1>
        <p className="text-sm text-mute mb-8">Quản lý thông tin đăng nhập và tuỳ chọn xoá tài khoản.</p>

        <div className="bg-canvas rounded-2xl border border-hairline p-5 md:p-6 mb-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-mute mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-mute font-bold mb-1">Email</p>
              <p className="font-semibold text-ink">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-mute mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-mute font-bold mb-1">Vai trò</p>
              <p className="font-semibold text-ink">{roleLabel[user.role]}</p>
            </div>
          </div>
        </div>

        <DeleteAccountPanel />
      </main>
    </div>
  );
}
