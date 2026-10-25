import { pool } from '../src/db/client';

describe('test database setup', () => {
  it('connects to the Docker test database with migrations applied', async () => {
    const { rows } = await pool.query<{ db: string; migrations: number }>(
      `select current_database() as db,
              (select count(*)::int from drizzle.__drizzle_migrations) as migrations`,
    );

    expect(rows[0].db).toBe('rayfield_test');
    expect(rows[0].migrations).toBeGreaterThanOrEqual(1);
  });
});
