'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveSiteSettings } from '@/lib/actions/admin';

export interface SiteSettings {
  title: string;
  headline: string;
  homePage: string;
  themeMode: string;
  themeCss: string;
  themeExternalUrl: string;
}

export function AdminSiteSettings({ initial, writable, dict }: { initial: SettingsSite; writable: boolean; dict: import('@/lib/locales/i18n').Dictionary }) {
  const [form, setForm] = useState<SiteSettings>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const set = (k: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveSiteSettings(form);
      if (res.ok) {
        setMsg('已保存');
        router.refresh();
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <div className="wkt-settings">
      {!writable ? (
        <p className="wkt-form-note">当前为线上只读环境。修改配置文件 <code>src/config/site.json</code> 后重新部署方可生效。</p>
      ) : null}
      <div className="wkt-field">
        <label>站点标题</label>
        <input type="text" value={form.title} onChange={set('title')} disabled={!writable || pending} />
      </div>
      <div className="wkt-field">
        <label>副标题</label>
        <input type="text" value={form.headline} onChange={set('headline')} disabled={!writable || pending} />
      </div>
      <div className="wkt-field">
        <label>首页</label>
        <input type="text" value={form.homePage} onChange={set('homePage')} disabled={!writable || pending} />
      </div>
      <div className="wkt-field">
        <label>版式来源</label>
        <select value={form.themeMode} onChange={set('themeMode')} disabled={!writable || pending}>
          <option value="external">外部样式表</option>
          <option value="inline">内联 CSS</option>
        </select>
      </div>
      {form.themeMode === 'external' ? (
        <div className="wkt-field">
          <label>样式表地址</label>
          <input type="text" value={form.themeExternalUrl} onChange={set('themeExternalUrl')} disabled={!writable || pending} />
        </div>
      ) : (
        <div className="wkt-field">
          <label>内联 CSS</label>
          <textarea rows={8} value={form.themeCss} onChange={set('themeCss')} disabled={!writable || pending} />
        </div>
      )}
      {writable ? (
        <div className="buttons alignleft">
          <input className="btn btn-primary" type="button" value={pending ? '保存中…' : '保存'} onClick={save} disabled={pending} />
        </div>
      ) : null}
      {msg ? <p className="wkt-form-note">{msg}</p> : null}
    </div>
  );
}
