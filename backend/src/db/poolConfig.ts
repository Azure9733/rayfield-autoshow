import type { PoolConfig } from 'pg';
import type { DbEnv } from '../config/envSchema';

/**
 * pg pool options from the validated env. Kept free of side effects (unlike db/client.ts,
 * which opens the pool) so it can be unit-tested.
 */
export function poolConfig(env: DbEnv): PoolConfig {
  return {
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    // Supabase requires TLS, but its certificate chain doesn't pass Node's strict verification
    // out of the box (the CA isn't in Node's trust store). rejectUnauthorized: false keeps the
    // connection encrypted but skips verifying who's on the other end, so a network attacker
    // could impersonate the database. Accepted here for a demo app; the stricter fix is to
    // download Supabase's CA certificate and pass it as `ssl: { ca }`. Local Docker: no TLS.
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  };
}
