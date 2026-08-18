import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const account = pgTable(
  'account',
  {
    id: serial('id').primaryKey(),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    kind: text('kind').notNull().default('member'), // 'member' | 'admin'
    // salt:hash（hex），scrypt；空串表示尚未设置密码（占位账号）
    passwordHash: text('password_hash').notNull().default(''),
    email: text('email').notNull().default(''),
    gender: text('gender').notNull().default(''),
    website: text('website').notNull().default(''),
    bio: text('bio').notNull().default(''),
    banned: boolean('banned').notNull().default(false),
    // admin 可授予普通成员“成员管理”能力（封禁/授权他人）
    canManageMembers: boolean('can_manage_members').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('account_handle_uq').on(t.handle)],
);

export const session = pgTable(
  'session',
  {
    id: serial('id').primaryKey(),
    token: text('token').notNull(),
    accountId: integer('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex('session_token_uq').on(t.token)],
);

export const theme = pgTable(
  'theme',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    mode: text('mode').notNull().default('inline'),
    css: text('css').notNull().default(''),
    externalUrl: text('external_url').notNull().default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('theme_slug_uq').on(t.slug)],
);

export const site = pgTable('site', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().default('wikit'),
  title: text('title').notNull().default('WikitNext'),
  headline: text('headline').notNull().default(''),
  homePage: text('home_page').notNull().default('main'),
  activeThemeId: integer('active_theme_id').references(() => theme.id),
});

export const page = pgTable(
  'page',
  {
    id: serial('id').primaryKey(),
    category: text('category').notNull().default('_default'),
    name: text('name').notNull(),
    fullname: text('fullname').generatedAlwaysAs(sql`category || ':' || name`),
    title: text('title').notNull().default(''),
    parentId: integer('parent_id'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    locked: boolean('locked').notNull().default(false),
    // plain integer, no FK: a FK here would make page <-> revision circular
    headRevisionId: integer('head_revision_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('page_category_name_uq').on(t.category, t.name),
    uniqueIndex('page_fullname_uq').on(t.fullname),
  ],
);

export const revision = pgTable(
  'revision',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id')
      .notNull()
      .references(() => page.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    source: text('source').notNull().default(''),
    renderedHtml: text('rendered_html').notNull().default(''),
    meta: jsonb('meta'),
    backlinks: jsonb('backlinks'),
    comment: text('comment').notNull().default(''),
    authorId: integer('author_id').references(() => account.id),
    changeKind: text('change_kind').notNull().default('source'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('revision_page_ordinal_uq').on(t.pageId, t.ordinal),
    index('revision_page_created_idx').on(t.pageId, t.createdAt),
  ],
);

export const vote = pgTable(
  'vote',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id')
      .notNull()
      .references(() => page.id, { onDelete: 'cascade' }),
    accountId: integer('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(), // -1 or +1
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('vote_page_account_uq').on(t.pageId, t.accountId)],
);

export const comment = pgTable(
  'comment',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id')
      .notNull()
      .references(() => page.id, { onDelete: 'cascade' }),
    // top-level comments have parentId null; replies point at their top-level parent
    parentId: integer('parent_id').references((): AnyPgColumn => comment.id, {
      onDelete: 'cascade',
    }),
    // name shown as "re: X" when a reply targets another reply (kept at one nesting level)
    replyToName: text('reply_to_name'),
    accountId: integer('account_id').references(() => account.id),
    body: text('body').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comment_page_created_idx').on(t.pageId, t.createdAt)],
);

export const pageAuthor = pgTable(
  'page_author',
  {
    id: serial('id').primaryKey(),
    pageId: integer('page_id')
      .notNull()
      .references(() => page.id, { onDelete: 'cascade' }),
    accountId: integer('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('page_author_uq').on(t.pageId, t.accountId)],
);

export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Vote = typeof vote.$inferSelect;
export type Comment = typeof comment.$inferSelect;
export type PageAuthor = typeof pageAuthor.$inferSelect;
export type Theme = typeof theme.$inferSelect;
export type Site = typeof site.$inferSelect;
export type Page = typeof page.$inferSelect;
export type Revision = typeof revision.$inferSelect;
