import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const migrationsFolder = path.join(__dirname, 'migrations');

/**
 * Applies pending migrations to the given database. Opens its own short-lived pool so
 * it can run before the app's env and pool exist (Jest globalSetup, CLI).
 */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}

// CLI: `npm run db:migrate` (uses DATABASE_URL from .env).
if (require.main === module) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  runMigrations(url).then(() => console.info('Migrations applied'));
}
