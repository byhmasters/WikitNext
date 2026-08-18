import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/auth/SettingsForm';
import { getCurrentAccount } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await getCurrentAccount();
  if (!me) redirect('/login?to=/settings');
  return (
    <div className="wkt-page-wrap">
      <SettingsForm
        handle={me.handle}
        initial={{
          displayName: me.displayName,
          gender: me.gender,
          website: me.website,
          bio: me.bio,
          email: me.email,
        }}
      />
    </div>
  );
}
