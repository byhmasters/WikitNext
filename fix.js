const fs = require('fs');

function replace(file, search, replaceStr) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes(search)) {
    fs.writeFileSync(file, code.split(search).join(replaceStr), 'utf8');
    console.log(`[OK] ${file} : ${search.substring(0, 20)}`);
  }
}

// 1. 修改函数签名，注入 dict 类型
const signatures = {
  'src/components/auth/AuthForm.tsx': "export function AuthForm({ mode, dict }: { mode: 'login' | 'register'; dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/auth/SettingsForm.tsx': "export function SettingsForm({ handle, initial, dict }: { handle: string; initial: ProfileInput; dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/page/PageOptions.tsx': "export function PageOptions(props: PageOptionsProps & { dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/page/HistoryView.tsx': "export function HistoryView({ pageId, onClose, dict }: { pageId: number; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/page/SourceView.tsx': "export function SourceView({ pageId, ordinal = null, onClose, dict }: { pageId: number, ordinal?: number | null, onClose: () => void, dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/page/CreatePagePanel.tsx': "export function CreatePagePanel({ category, name, title, basePath, canCreate, dict }: { category: string; name: string; title: string; basePath: string; canCreate: boolean; dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/page/EditorView.tsx': "export function EditorView({ category, name, title: initialTitle, source: initialSource, isNew, onCancel, onSaved, dict }: EditorViewProps & { dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/user/UserCard.tsx': "export function UserCard({ handle, onClose, dict }: { handle: string; onClose: () => void; dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/admin/AdminMembers.tsx': "export function AdminMembers({ members, meId, canGrant, dict }: { members: MemberRow[]; meId: number; canGrant: boolean; dict: import('@/lib/locales/i18n').Dictionary })",
  'src/components/admin/AdminSiteSettings.tsx': "export function AdminSiteSettings({ initial, writable, dict }: { initial: SettingsSite; writable: boolean; dict: import('@/lib/locales/i18n').Dictionary })"
};

Object.entries(signatures).forEach(([file, newSig]) => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  const regex = new RegExp(`export function ${newSig.split(' ')[2].split('(')[0]}\\([^)]+\\)\\s*\\{`);
  code = code.replace(regex, `${newSig} {`);
  fs.writeFileSync(file, code);
});

// 2. 批量替换硬编码
const replacements = [
  // Chrome
  ['src/components/chrome/LogoutButton.tsx', "{pending ? '登出中…' : '登出'}", "{pending ? dict.nav.loggingOut : dict.nav.logout}"],
  ['src/components/chrome/Dialog.tsx', "title = '请确认'", "title = dict.common.confirm"],
  ['src/components/chrome/Dialog.tsx', "confirmLabel = '确定'", "confirmLabel = dict.common.confirm"],
  ['src/components/chrome/Dialog.tsx', "cancelLabel = '取消'", "cancelLabel = dict.common.cancel"],
  
  // Auth
  ['src/components/auth/AuthForm.tsx', "{isLogin ? '登录' : '创建账户'}", "{isLogin ? dict.auth.loginTitle : dict.auth.registerTitle}"],
  ['src/components/auth/AuthForm.tsx', "用户名", "{dict.auth.username}"],
  ['src/components/auth/AuthForm.tsx', "密码", "{dict.auth.password}"],
  ['src/components/auth/AuthForm.tsx', "value={pending ? '请稍候…' : isLogin ? '登录' : '注册'}", "value={pending ? dict.auth.submitting : isLogin ? dict.common.login : dict.common.register}"],
  ['src/components/auth/AuthForm.tsx', "{isLogin ? '还没有账户？注册' : '已有账户？登录'}", "{isLogin ? dict.auth.toRegister : dict.auth.toLogin}"],

  ['src/components/auth/SettingsForm.tsx', "<h1>账户设置</h1>", "<h1>{dict.auth.settingsTitle}</h1>"],
  ['src/components/auth/SettingsForm.tsx', "用户名：{handle}（不可更改）", "{dict.auth.handleLabel.replace('{handle}', handle)}"],
  ['src/components/auth/SettingsForm.tsx', "<td>显示名</td>", "<td>{dict.auth.displayName}</td>"],
  ['src/components/auth/SettingsForm.tsx', "<td>性别</td>", "<td>{dict.auth.gender}</td>"],
  ['src/components/auth/SettingsForm.tsx', "<td>网站</td>", "<td>{dict.auth.website}</td>"],
  ['src/components/auth/SettingsForm.tsx', "<td>邮箱</td>", "<td>{dict.auth.email}</td>"],
  ['src/components/auth/SettingsForm.tsx', "<td>个人简介</td>", "<td>{dict.auth.bio}</td>"],
  ['src/components/auth/SettingsForm.tsx', 'placeholder="可不填"', "placeholder={dict.auth.optional}"],
  ['src/components/auth/SettingsForm.tsx', "value={pending ? '保存中…' : '保存资料'}", "value={pending ? dict.common.saving : dict.auth.saveProfile}"],
  ['src/components/auth/SettingsForm.tsx', "<h2>修改密码</h2>", "<h2>{dict.auth.changePassword}</h2>"],
  ['src/components/auth/SettingsForm.tsx', "<td>当前密码</td>", "<td>{dict.auth.currentPassword}</td>"],
  ['src/components/auth/SettingsForm.tsx', "<td>新密码</td>", "<td>{dict.auth.newPassword}</td>"],
  ['src/components/auth/SettingsForm.tsx', 'value="更新密码"', "value={dict.auth.updatePassword}"],

  // Page Options
  ['src/components/page/PageOptions.tsx', "{props.hasPage ? '编辑' : '创建'}", "{props.hasPage ? dict.page.edit : dict.page.createAction}"],
  ['src/components/page/PageOptions.tsx', "标签", "{dict.page.tags}"],
  ['src/components/page/PageOptions.tsx', "历史记录", "{dict.page.history}"],
  ['src/components/page/PageOptions.tsx', "选项", "{dict.page.options}"],
  ['src/components/page/PageOptions.tsx', "页面源代码", "{dict.page.source}"],
  ['src/components/page/PageOptions.tsx', "{props.locked ? '解锁页面' : '锁定页面'}", "{props.locked ? dict.page.unlock : dict.page.lock}"],
  ['src/components/page/PageOptions.tsx', "重新命名", "{dict.page.rename}"],
  ['src/components/page/PageOptions.tsx', "删除", "{dict.page.delete}"],

  // Editor
  ['src/components/page/EditorView.tsx', "关闭", "{dict.common.close}"],
  ['src/components/page/EditorView.tsx', "{isNew ? '创建页面' : '编辑页面'}", "{isNew ? dict.editor.createTitle : dict.editor.editTitle}"],
  ['src/components/page/EditorView.tsx', "页面标题:", "{dict.editor.pageTitle}"],
  ['src/components/page/EditorView.tsx', 'placeholder="在此输入 Wikidot 源代码…"', "placeholder={dict.editor.placeholder}"],
  ['src/components/page/EditorView.tsx', "更改摘要:", "{dict.editor.comment}"],
  ['src/components/page/EditorView.tsx', 'value="取消"', "value={dict.common.cancel}"],
  ['src/components/page/EditorView.tsx', "value={pending ? '保存中…' : '保存'}", "value={pending ? dict.common.saving : dict.editor.save}"],

  // Source/History
  ['src/components/page/SourceView.tsx', "关闭", "{dict.common.close}"],
  ['src/components/page/SourceView.tsx', "页面源代码", "{dict.page.source}"],
  ['src/components/page/SourceView.tsx', "加载中…", "{dict.common.loading}"],
  ['src/components/page/HistoryView.tsx', "关闭", "{dict.common.close}"],
  ['src/components/page/HistoryView.tsx', "<h1>页面更改历史</h1>", "<h1>{dict.history.title}</h1>"],
  ['src/components/page/HistoryView.tsx', 'value="更新列表"', "value={dict.history.refresh}"],
  ['src/components/page/HistoryView.tsx', "<td>版本</td>", "<td>{dict.history.colVersion}</td>"],
  ['src/components/page/HistoryView.tsx', "<td>标记</td>", "<td>{dict.history.colFlag}</td>"],
  ['src/components/page/HistoryView.tsx', "<td>操作</td>", "<td>{dict.history.colAction}</td>"],
  ['src/components/page/HistoryView.tsx', "<td>由</td>", "<td>{dict.history.colBy}</td>"],
  ['src/components/page/HistoryView.tsx', "<td>日期</td>", "<td>{dict.history.colDate}</td>"],
  ['src/components/page/HistoryView.tsx', "<td>评论</td>", "<td>{dict.history.colComment}</td>"],

  // Panels
  ['src/components/page/panels.tsx', "关闭", "{dict.common.close}"],
  ['src/components/page/panels.tsx', "<h1>页面标签</h1>", "<h1>{dict.panels.tagsTitle}</h1>"],
  ['src/components/page/panels.tsx', "用空格分隔多个标签。", "{dict.panels.tagsHint}"],
  ['src/components/page/panels.tsx', 'placeholder="例如：指南 帮助 草稿"', "placeholder={dict.panels.tagsPlaceholder}"],
  ['src/components/page/panels.tsx', "value={pending ? '保存中…' : '保存'}", "value={pending ? dict.common.saving : dict.common.save}"],
  ['src/components/page/panels.tsx', "<h1>页面评分</h1>", "<h1>{dict.panels.ratingTitle}</h1>"],
  ['src/components/page/panels.tsx', "当前得分", "{dict.panels.ratingScore}"],
  ['src/components/page/panels.tsx', 'value="▲ 赞成"', "value={dict.panels.voteUp}"],
  ['src/components/page/panels.tsx', 'value="▼ 反对"', "value={dict.panels.voteDown}"],
  ['src/components/page/panels.tsx', 'value="取消投票"', "value={dict.panels.voteCancel}"],
  ['src/components/page/panels.tsx', "<h1>讨论</h1>", "<h1>{dict.panels.discussTitle}</h1>"],
  ['src/components/page/panels.tsx', 'placeholder="发表评论…"', "placeholder={dict.panels.commentPlaceholder}"],
  ['src/components/page/panels.tsx', "value={pending ? '发送中…' : '发表'}", "value={pending ? dict.panels.posting : dict.panels.post}"],

  // UserCard
  ['src/components/user/UserCard.tsx', "关闭", "{dict.common.close}"],
  ['src/components/user/UserCard.tsx', "找不到该用户。", "{dict.userCard.notFound}"],
  ['src/components/user/UserCard.tsx', "资料", "{dict.userCard.tabAbout}"],
  ['src/components/user/UserCard.tsx', "加入时间", "{dict.userCard.joined}"],
  ['src/components/user/UserCard.tsx', "还没有创建页面。", "{dict.userCard.noPages}"],
  ['src/components/user/UserCard.tsx', "还没有编辑记录。", "{dict.userCard.noEdits}"],
  ['src/components/user/UserCard.tsx', "还没有评论。", "{dict.userCard.noComments}"]
];

replacements.forEach(([file, search, replaceStr]) => replace(file, search, replaceStr));

console.log('Batch replacement done.');
