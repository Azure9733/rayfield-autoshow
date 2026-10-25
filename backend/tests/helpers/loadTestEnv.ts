import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

/**
 * Loads .env.test into process.env, overriding anything already set, so a stray
 * DATABASE_URL in the shell can never point the tests at dev or Supabase.
 */
export function loadTestEnv(): void {
  const file = readFileSync(path.join(__dirname, '../../.env.test'), 'utf8');
  Object.assign(process.env, parseEnv(file));
}
