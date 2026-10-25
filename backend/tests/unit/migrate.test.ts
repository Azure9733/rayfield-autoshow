import { migrationPoolConfig } from '../../src/db/migrate';

const url = 'postgres://postgres:secret@db.example.supabase.co:5432/postgres';

describe('migration pool config', () => {
  it.each([
    ['true', { rejectUnauthorized: false }],
    [undefined, false],
  ])('follows DATABASE_SSL=%s, with one connection', (ssl, expected) => {
    expect(migrationPoolConfig({ DATABASE_URL: url, DATABASE_SSL: ssl })).toEqual({
      connectionString: url,
      max: 1,
      ssl: expected,
    });
  });

  // Migrating Supabase from a laptop shouldn't need the app's JWT_SECRET and the rest.
  it('needs only the database variables', () => {
    expect(() => migrationPoolConfig({ DATABASE_URL: url })).not.toThrow();
  });

  it('still rejects a bad DATABASE_SSL', () => {
    expect(() => migrationPoolConfig({ DATABASE_URL: url, DATABASE_SSL: 'yes' })).toThrow();
  });
});
