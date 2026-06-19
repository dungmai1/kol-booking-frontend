import { redirect } from 'next/navigation';

/** Legacy path — email links use /auth/reset-password. */
export default async function LegacyResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const qs = params.token ? `?token=${encodeURIComponent(params.token)}` : '';
  redirect(`/auth/reset-password${qs}`);
}
