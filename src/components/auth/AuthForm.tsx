'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, register } from '@/lib/actions/auth';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  const params = useSearchParams();
  const to = params.get('to') || '/';

  const isLogin = mode === 'login';

  function submit() {
    setError('');
    start(async () => {
      const res = isLogin ? await login(handle, password) : await register(handle, password);
      if (res.ok) {
        router.replace(to);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="wkt-auth-layer">
      <div className="owindow">
        <div className="title">{isLogin ? '登录' : '创建账户'}</div>
        <div className="content">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <p>
              <label>
                用户名
                <input
                  className="wt-wide-input"
                  type="text"
                  autoFocus
                  autoComplete="username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
              </label>
            </p>
            <p>
              <label>
                密码
                <input
                  className="wt-wide-input"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </p>
            {error ? <p className="wkt-form-error">{error}</p> : null}
            <div className="buttons alignleft">
              <input
                className="btn btn-primary"
                type="submit"
                value={pending ? '请稍候…' : isLogin ? '登录' : '注册'}
                disabled={pending}
              />
              <a className="btn btn-default" href={isLogin ? '/register' : '/login'}>
                {isLogin ? '还没有账户？注册' : '已有账户？登录'}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
