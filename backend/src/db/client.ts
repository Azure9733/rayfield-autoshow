import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

/** Shared connection pool; tests close it in afterAll so Jest can exit. */
export const pool = new Pool({ connectionString: env.DATABASE_URL });

// snake_case casing maps camelCase TS keys to snake_case columns (API camelCase, DB snake_case).
export const db = drizzle(pool, { schema, casing: 'snake_case' });

export type Database = typeof db;
