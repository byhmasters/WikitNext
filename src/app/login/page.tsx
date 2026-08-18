import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { getCurrentAccount } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getCurrentAccount()) redirect('/');
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
