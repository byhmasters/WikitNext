import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { getCurrentAccount } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  if (await getCurrentAccount()) redirect('/');
  return (
    <Suspense>
      <AuthForm mode="register" />
    </Suspense>
  );
}
