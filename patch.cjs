const fs = require('fs');
function replace(file, search, replaceStr) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes(search)) {
    fs.writeFileSync(file, code.split(search).join(replaceStr), 'utf8');
    console.log(`[Patched] ${file}`);
  }
}

replace('src/app/layout.tsx', "import { loadSiteConfig } from '@/lib/wikit/config';", "import { loadSiteConfig } from '@/lib/wikit/config';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/app/layout.tsx', "const { theme } = await loadSiteConfig();", "const { theme } = await loadSiteConfig();\n  const dict = await getDictionary('zh-hans');");
replace('src/app/layout.tsx', "<UserCardHost />", "<UserCardHost dict={dict} />");

replace('src/app/[[...slug]]/page.tsx', "import { canEdit, canManagePage, isMember } from '@/lib/auth/perms';", "import { canEdit, canManagePage, isMember } from '@/lib/auth/perms';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/app/[[...slug]]/page.tsx', "const { slug } = await params;", "const { slug } = await params;\n  const dict = await getDictionary('zh-hans');");
replace('src/app/[[...slug]]/page.tsx', "<CreatePagePanel category=", "<CreatePagePanel dict={dict} category=");
replace('src/app/[[...slug]]/page.tsx', "<PageOptions\n", "<PageOptions\n            dict={dict}\n");

replace('src/app/%5Fadmin/page.tsx', "import { displayFullname, pagePath } from '@/lib/wikit/names';", "import { displayFullname, pagePath } from '@/lib/wikit/names';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/app/%5Fadmin/page.tsx', "const me = await getCurrentAccount();", "const me = await getCurrentAccount();\n  const dict = await getDictionary('zh-hans');");
replace('src/app/%5Fadmin/page.tsx', "<AdminMembers\n", "<AdminMembers\n          dict={dict}\n");
replace('src/app/%5Fadmin/page.tsx', "<AdminSiteSettings\n", "<AdminSiteSettings\n            dict={dict}\n");

replace('src/app/login/page.tsx', "import { getCurrentAccount } from '@/lib/auth/session';", "import { getCurrentAccount } from '@/lib/auth/session';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/app/login/page.tsx', "if (await getCurrentAccount()) redirect('/');", "if (await getCurrentAccount()) redirect('/');\n  const dict = await getDictionary('zh-hans');");
replace('src/app/login/page.tsx', '<AuthForm mode="login" />', '<AuthForm mode="login" dict={dict} />');

replace('src/app/register/page.tsx', "import { getCurrentAccount } from '@/lib/auth/session';", "import { getCurrentAccount } from '@/lib/auth/session';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/app/register/page.tsx', "if (await getCurrentAccount()) redirect('/');", "if (await getCurrentAccount()) redirect('/');\n  const dict = await getDictionary('zh-hans');");
replace('src/app/register/page.tsx', '<AuthForm mode="register" />', '<AuthForm mode="register" dict={dict} />');

replace('src/app/settings/page.tsx', "import { getCurrentAccount } from '@/lib/auth/session';", "import { getCurrentAccount } from '@/lib/auth/session';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/app/settings/page.tsx', "const me = await getCurrentAccount();", "const me = await getCurrentAccount();\n  const dict = await getDictionary('zh-hans');");
replace('src/app/settings/page.tsx', "<SettingsForm\n", "<SettingsForm\n        dict={dict}\n");

replace('src/components/chrome/LoginStatus.tsx', "import { isAdmin } from '@/lib/auth/perms';", "import { isAdmin } from '@/lib/auth/perms';\nimport { getDictionary } from '@/lib/locales/i18n';");
replace('src/components/chrome/LoginStatus.tsx', "const me = await getCurrentAccount();", "const me = await getCurrentAccount();\n  const dict = await getDictionary('zh-hans');");
replace('src/components/chrome/LoginStatus.tsx', "<LogoutButton />", "<LogoutButton dict={dict} />");

replace('src/components/page/PageOptions.tsx', "<EditorView\n", "<EditorView\n            dict={dict}\n");
replace('src/components/page/PageOptions.tsx', "<HistoryView pageId=", "<HistoryView dict={dict} pageId=");
replace('src/components/page/PageOptions.tsx', "<SourceView pageId=", "<SourceView dict={dict} pageId=");
replace('src/components/page/PageOptions.tsx', "<TagsView pageId=", "<TagsView dict={dict} pageId=");
replace('src/components/page/PageOptions.tsx', "<RatingView pageId=", "<RatingView dict={dict} pageId=");
replace('src/components/page/PageOptions.tsx', "<DiscussView pageId=", "<DiscussView dict={dict} pageId=");
replace('src/components/page/PageOptions.tsx', "<ConfirmDialog\n", "<ConfirmDialog\n          dict={dict}\n");

replace('src/components/user/UserCardHost.tsx', "import { UserCard } from './UserCard';", "import { UserCard } from './UserCard';\nimport type { Dictionary } from '@/lib/locales/i18n';");
replace('src/components/user/UserCardHost.tsx', "export function UserCardHost() {", "export function UserCardHost({ dict }: { dict: Dictionary }) {");
replace('src/components/user/UserCardHost.tsx', "<UserCard handle=", "<UserCard dict={dict} handle=");
