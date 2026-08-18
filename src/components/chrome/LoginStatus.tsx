import { getCurrentAccount } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/perms';
import { LogoutButton } from './LogoutButton';

export async function LoginStatus() {
  const me = await getCurrentAccount();

  if (!me) {
    return (
      <>
        <a className="login-status-create-account btn btn-default" href="/register">
          注册
        </a>
        <a className="login-status-sign-in btn btn-primary" href="/login">
          登录
        </a>
      </>
    );
  }

  return (
    <span id="account-topbutton-wrap">
      <span className="printuser w-user" data-wkt-user={me.handle}>
        {me.displayName || me.handle}
      </span>
      {' | '}
      <a id="my-account" href="/settings">
        设置
      </a>
      {isAdmin(me) ? (
        <>
          {' | '}
          <a id="account-admin" href="/_admin">
            管理面板
          </a>
        </>
      ) : null}
      {' | '}
      <LogoutButton />
    </span>
  );
}
