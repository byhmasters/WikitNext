import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Vercel/Neon inject the connection string under different names depending on
// which storage integration you link; take whichever is present.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  throw new Error('No database URL set (DATABASE_URL / POSTGRES_URL — see web/.env)');
}

// localhost docker has no TLS; managed Postgres (Neon/Supabase/Vercel) requires it.
// postgres-js does NOT enable TLS from a `sslmode=require` query param in the URL —
// it only honours the explicit `ssl` option — so we set it ourselves for the remote
// case instead of relying on the connection string.
const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);
const ssl = isLocal ? false : 'require';

// reuse one client across dev hot reloads and warm serverless invocations
const globalForDb = globalThis as unknown as {
  __wktClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__wktClient ?? postgres(connectionString, { max: 1, ssl });
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__wktClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
