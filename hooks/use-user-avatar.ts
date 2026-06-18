'use client';

import { useEffect, useState } from 'react';
import { brandApi, kolApi } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api/client';
import type { Role } from '@/lib/api/types';

function initialsFrom(text: string | undefined): string {
  const trimmed = text?.trim();
  if (!trimmed) return 'U';
  return trimmed[0].toUpperCase();
}

export function useUserAvatar(email: string | undefined, role: Role | undefined) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!role) {
      setAvatarSrc(null);
      setLabel('');
      return;
    }

    if (role === 'ADMIN') {
      setAvatarSrc(null);
      setLabel(email ?? '');
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        if (role === 'KOL') {
          const profile = await kolApi.getMyProfile();
          if (cancelled) return;
          setAvatarSrc(profile.avatarUrl ? resolveMediaUrl(profile.avatarUrl) : null);
          setLabel(profile.displayName || email || '');
          return;
        }

        if (role === 'BRAND') {
          const profile = await brandApi.getMyProfile();
          if (cancelled) return;
          setAvatarSrc(profile.logoUrl ? resolveMediaUrl(profile.logoUrl) : null);
          setLabel(profile.companyName || profile.contactName || email || '');
        }
      } catch {
        if (!cancelled) {
          setAvatarSrc(null);
          setLabel(email ?? '');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [email, role]);

  return {
    avatarSrc,
    label,
    initials: initialsFrom(label || email),
  };
}
