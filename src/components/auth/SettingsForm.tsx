'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword, updateProfile, type ProfileInput } from '@/lib/actions/profile';

export function SettingsForm({ handle, initial }: { handle: string; initial: ProfileInput }) {
  const [form, setForm] = useState<ProfileInput>(initial);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const set = (k: keyof ProfileInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setMsg('');
    start(async () => {
      const res = await updateProfile(form);
      if (res.ok) {
        setMsg('已保存');
        router.refresh();
      } else setMsg(res.error ?? '保存失败');
    });
  }

  function savePw() {
    setPwMsg('');
    start(async () => {
      const res = await changePassword(curPw, newPw);
      if (res.ok) {
        setPwMsg('密码已更新');
        setCurPw('');
        setNewPw('');
      } else setPwMsg(res.error ?? '修改失败');
    });
  }

  return (
    <div className="wkt-settings">
      <h1>账户设置</h1>
      <p className="wkt-muted">用户名：{handle}（不可更改）</p>

      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
        <table className="form">
          <tbody>
            <tr><td>显示名</td><td><input className="wt-wide-input" value={form.displayName} onChange={set('displayName')} /></td></tr>
            <tr><td>性别</td><td><input className="wt-wide-input" value={form.gender} onChange={set('gender')} placeholder="可不填" /></td></tr>
            <tr><td>网站</td><td><input className="wt-wide-input" value={form.website} onChange={set('website')} placeholder="可不填" /></td></tr>
            <tr><td>邮箱</td><td><input className="wt-wide-input" type="email" value={form.email} onChange={set('email')} placeholder="可不填" /></td></tr>
            <tr><td>个人简介</td><td><textarea className="wt-wide-input" rows={4} value={form.bio} onChange={set('bio')} placeholder="可不填" /></td></tr>
          </tbody>
        </table>
        <div className="buttons alignleft">
          <input className="btn btn-primary" type="submit" value={pending ? '保存中…' : '保存资料'} disabled={pending} />
          {msg ? <span className="wkt-form-note">{msg}</span> : null}
        </div>
      </form>

      <h2>修改密码</h2>
      <form onSubmit={(e) => { e.preventDefault(); savePw(); }}>
        <table className="form">
          <tbody>
            <tr><td>当前密码</td><td><input className="wt-wide-input" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" /></td></tr>
            <tr><td>新密码</td><td><input className="wt-wide-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" /></td></tr>
          </tbody>
        </table>
        <div className="buttons alignleft">
          <input className="btn btn-primary" type="submit" value="更新密码" disabled={pending || !newPw} />
          {pwMsg ? <span className="wkt-form-note">{pwMsg}</span> : null}
        </div>
      </form>
    </div>
  );
}
