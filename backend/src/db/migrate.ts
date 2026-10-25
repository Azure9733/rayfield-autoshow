import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool, type PoolConfig } from 'pg';
import { validateDbEnv } from '../config/envSchema';
import { poolConfig } from './poolConfig';

const migrationsFolder = path.join(__dirname, 'migrations');

/**
 * Pool settings for a migration run: the app's DB settings (so DATABASE_SSL applies, e.g. on
 * Supabase) with a single connection, which is all an ordered migration run needs. Only the
 * database variables are required.
 */
export function migrationPoolConfig(source: NodeJS.ProcessEnv): PoolConfig {
  return { ...poolConfig(validateDbEnv(source)), max: 1 };
}

/**
 * Applies pending migrations. Opens its own short-lived pool so it can run before the app's
 * env and pool exist (Jest globalSetup, CLI).
 */
export async function runMigrations(config: PoolConfig): Promise<void> {
  const pool = new Pool(config);
  try {
    await migrate(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}

// CLI: `npm run db:migrate` (DATABASE_URL and DATABASE_SSL from .env).
if (require.main === module) {
  runMigrations(migrationPoolConfig(process.env)).then(() => console.info('Migrations applied'));
}
