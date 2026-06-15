'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { brandApi } from '@/lib/api/brand';
import { isProfileApproved, normalizeProfileStatus } from '@/lib/profile-status';
import type { NormalizedProfileStatus } from '@/lib/profile-status';
import { useAuth } from '@/contexts/AuthContext';

type GateOptions = {
  /** Redirect path when not logged in as BRAND */
  loginRedirect?: string;
  /** Where to send non-BRAND roles (default `/products`) */
  wrongRoleRedirect?: string;
  /** When false, only checks approval without auth redirects */
  requireBrandRole?: boolean;
};

const defaultOptions: Required<GateOptions> = {
  loginRedirect: '/auth/login',
  wrongRoleRedirect: '/products',
  requireBrandRole: true,
};

/**
 * Ensures the current user is a BRAND with an APPROVED profile before gated actions
 * (e.g. creating a product posting).
 */
export function useBrandProfileGate(options: GateOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<NormalizedProfileStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      if (opts.requireBrandRole) {
        const redirect = opts.loginRedirect.includes('?')
          ? opts.loginRedirect
          : `${opts.loginRedirect}?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/products/new')}`;
        router.replace(redirect);
      }
      setChecking(false);
      return;
    }

    if (opts.requireBrandRole && user?.role !== 'BRAND') {
      router.replace(opts.wrongRoleRedirect);
      setChecking(false);
      return;
    }

    if (user?.role !== 'BRAND') {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    setLoadError(null);

    brandApi
      .getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setStatus(normalizeProfileStatus(profile.status));
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Không thể tải hồ sơ Brand.');
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.role, router, opts.loginRedirect, opts.requireBrandRole, opts.wrongRoleRedirect]);

  const isApproved = isProfileApproved(status ?? undefined);
  const isReady = !authLoading && !checking;
  const canProceed = isReady && isAuthenticated && user?.role === 'BRAND' && isApproved;

  return {
    user,
    isAuthenticated,
    authLoading,
    checking,
    isReady,
    status,
    isApproved,
    canProceed,
    loadError,
  };
}
