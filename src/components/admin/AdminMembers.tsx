'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setBanned, setMemberFlag } from '@/lib/actions/admin';

export interface MemberRow {
  id: number;
  handle: string;
  displayName: string;
  kind: string;
  banned: boolean;
  canManageMembers: boolean;
  createdAt: string;
}

export function AdminMembers({
  members,
  meId,
  canGrant,
}: {
  members: MemberRow[];
  meId: number;
  canGrant: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <table className="wt-simple-table wkt-admin-members">
      <tbody>
        <tr>
          <td>用户</td>
          <td>身份</td>
          <td>加入时间</td>
          <td>成员管理</td>
          <td>状态</td>
        </tr>
        {members.map((m) => {
          const isAdminRow = m.kind === 'admin';
          const self = m.id === meId;
          return (
            <tr key={m.id} className={m.banned ? 'wkt-row-banned' : ''}>
              <td>
                <span className="printuser w-user" data-wkt-user={m.handle}>
                  {m.displayName || m.handle}
                </span>
              </td>
              <td>{isAdminRow ? '管理员' : '成员'}</td>
              <td>{new Date(m.createdAt).toLocaleDateString()}</td>
              <td>
                {isAdminRow ? (
                  <span className="wkt-muted">—</span>
                ) : canGrant ? (
                  <label>
                    <input
                      type="checkbox"
                      checked={m.canManageMembers}
                      disabled={pending}
                      onChange={(e) => run(() => setMemberFlag(m.id, e.target.checked))}
                    />{' '}
                    可管理成员
                  </label>
                ) : m.canManageMembers ? (
                  '可管理成员'
                ) : (
                  <span className="wkt-muted">—</span>
                )}
              </td>
              <td>
                {isAdminRow || self ? (
                  <span className="wkt-muted">—</span>
                ) : (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      run(() => setBanned(m.id, !m.banned));
                    }}
                  >
                    {m.banned ? '解封' : '封禁'}
                  </a>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
