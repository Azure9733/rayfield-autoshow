import { runMigrations } from '../../src/db/migrate';
import { loadTestEnv } from './loadTestEnv';

/** Runs once before the whole suite: brings the test database schema up to date. */
export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  await runMigrations(process.env.DATABASE_URL as string);
}
