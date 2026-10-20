'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword, updateProfile, type ProfileInput } from '@/lib/actions/profile';

export function SettingsForm({ handle, initial, dict }: { handle: string; initial: ProfileInput; dict: import('@/lib/locales/i18n').Dictionary }) {
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
      <h1>{dict.auth.settingsTitle}</h1>
      <p className="wkt-muted">{dict.auth.handleLabel.replace('{handle}', handle)}</p>

      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
        <table className="form">
          <tbody>
            <tr><td>{dict.auth.displayName}</td><td><input className="wt-wide-input" value={form.displayName} onChange={set('displayName')} /></td></tr>
            <tr><td>{dict.auth.gender}</td><td><input className="wt-wide-input" value={form.gender} onChange={set('gender')} placeholder={dict.auth.optional} /></td></tr>
            <tr><td>{dict.auth.website}</td><td><input className="wt-wide-input" value={form.website} onChange={set('website')} placeholder={dict.auth.optional} /></td></tr>
            <tr><td>{dict.auth.email}</td><td><input className="wt-wide-input" type="email" value={form.email} onChange={set('email')} placeholder={dict.auth.optional} /></td></tr>
            <tr><td>{dict.auth.bio}</td><td><textarea className="wt-wide-input" rows={4} value={form.bio} onChange={set('bio')} placeholder={dict.auth.optional} /></td></tr>
          </tbody>
        </table>
        <div className="buttons alignleft">
          <input className="btn btn-primary" type="submit" value={pending ? dict.common.saving : dict.auth.saveProfile} disabled={pending} />
          {msg ? <span className="wkt-form-note">{msg}</span> : null}
        </div>
      </form>

      <h2>{dict.auth.changePassword}</h2>
      <form onSubmit={(e) => { e.preventDefault(); savePw(); }}>
        <table className="form">
          <tbody>
            <tr><td>{dict.auth.currentPassword}</td><td><input className="wt-wide-input" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" /></td></tr>
            <tr><td>{dict.auth.newPassword}</td><td><input className="wt-wide-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" /></td></tr>
          </tbody>
        </table>
        <div className="buttons alignleft">
          <input className="btn btn-primary" type="submit" value={dict.auth.updatePassword} disabled={pending || !newPw} />
          {pwMsg ? <span className="wkt-form-note">{pwMsg}</span> : null}
        </div>
      </form>
    </div>
  );
}
