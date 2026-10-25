import { z } from 'zod';

// The schema lives apart from env.ts, which validates process.env as soon as it's imported:
// the migration CLI needs the database variables without the app's JWT_SECRET and the rest.

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  // TLS to the database: "true" for Supabase, unset/"false" for local Docker. Only the two
  // literal words are accepted, so a typo fails at startup instead of silently meaning off.
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  // Max connections in the pg pool. On Vercel each function instance has its own pool, and
  // Supabase's pooler caps the total, so production may want this lower than the default.
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  // bcrypt's valid range is 4–31; each step doubles the hashing time.
  BCRYPT_COST: z.coerce.number().int().min(4).max(31).default(10),
  // HS256 needs a long random secret; 32+ characters rules out placeholder values.
  JWT_SECRET: z.string().min(32),
  // Any duration jsonwebtoken understands, e.g. "1h", "15m", "7d".
  JWT_EXPIRES_IN: z.string().default('1h'),
});

/** The validated, converted environment. */
export type Env = z.output<typeof envSchema>;

/** Validates and converts a set of env vars; separate from `env` so tests can pass their own. */
export function validateEnv(source: NodeJS.ProcessEnv): Env {
  return envSchema.parse(source);
}

/** Just the database settings, for tools that only talk to the DB (migrations). */
export type DbEnv = Pick<Env, 'DATABASE_URL' | 'DATABASE_SSL' | 'DATABASE_POOL_MAX'>;

/** Validates only the database variables; the app's other required ones may be missing. */
export function validateDbEnv(source: NodeJS.ProcessEnv): DbEnv {
  return envSchema
    .pick({ DATABASE_URL: true, DATABASE_SSL: true, DATABASE_POOL_MAX: true })
    .parse(source);
}
