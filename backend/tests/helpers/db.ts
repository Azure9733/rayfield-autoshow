import { pool } from '../../src/db/client';

/**
 * Empties every table in the public schema. The table list is read from Postgres, so new
 * tables are covered without editing this helper. Refuses to run outside a *_test database
 * as a last line of defence against wiping dev or production data.
 */
export async function truncateAllTables(): Promise<void> {
  const { rows } = await pool.query<{ db: string; tables: string[] }>(
    `select current_database() as db,
            coalesce(array_agg(quote_ident(tablename)), '{}') as tables
       from pg_tables where schemaname = 'public'`,
  );
  const { db, tables } = rows[0];
  if (!db.endsWith('_test')) throw new Error(`Refusing to truncate non-test database "${db}"`);
  if (tables.length > 0) await pool.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
}
