import { env } from '../../src/config/env';
import { pool } from '../../src/db/client';
import { poolConfig } from '../../src/db/poolConfig';

const url = 'postgres://postgres:secret@db.example.supabase.co:6543/postgres';

describe('database pool config', () => {
  it('uses TLS without strict certificate checks when DATABASE_SSL is on', () => {
    expect(poolConfig({ DATABASE_URL: url, DATABASE_SSL: true, DATABASE_POOL_MAX: 5 })).toEqual({
      connectionString: url,
      max: 5,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('uses no TLS when DATABASE_SSL is off (local Docker)', () => {
    expect(poolConfig({ DATABASE_URL: url, DATABASE_SSL: false, DATABASE_POOL_MAX: 10 })).toEqual({
      connectionString: url,
      max: 10,
      ssl: false,
    });
  });

  it('is what the shared pool is built from', () => {
    expect(pool.options).toMatchObject(poolConfig(env));
  });
});
