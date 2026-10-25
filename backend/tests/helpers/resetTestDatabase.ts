import { Pool } from 'pg';
import { assertTestDatabase } from './assertTestDatabase';

/**
 * Drops every table and the migration history, so each test run migrates a fresh database
 * from scratch. Rows left over from the previous run would otherwise break migrations such as
 * adding a NOT NULL column, and starting empty mirrors what a new Supabase database sees.
 */
export async function resetTestDatabase(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const { rows } = await pool.query<{ db: string }>('select current_database() as db');
    assertTestDatabase(rows[0].db);
    await pool.query(
      'drop schema if exists drizzle cascade; drop schema public cascade; create schema public;',
    );
  } finally {
    await pool.end();
  }
}
