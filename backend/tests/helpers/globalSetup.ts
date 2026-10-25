import { runMigrations } from '../../src/db/migrate';
import { loadTestEnv } from './loadTestEnv';
import { resetTestDatabase } from './resetTestDatabase';

/** Runs once before the whole suite: wipes the test database and migrates it from scratch. */
export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  const url = process.env.DATABASE_URL as string;
  await resetTestDatabase(url);
  await runMigrations(url);
}
