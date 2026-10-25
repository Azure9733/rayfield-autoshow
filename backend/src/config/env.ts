import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  // bcrypt's valid range is 4–31; each step doubles the hashing time.
  BCRYPT_COST: z.coerce.number().int().min(4).max(31).default(10),
  // HS256 needs a long random secret; 32+ characters rules out placeholder values.
  JWT_SECRET: z.string().min(32),
  // Any duration jsonwebtoken understands, e.g. "1h", "15m", "7d".
  JWT_EXPIRES_IN: z.string().default('1h'),
});

/**
 * Validated environment. Parsed once at import, so a missing or malformed variable
 * fails at startup instead of on the first request that needs it.
 */
export const env = envSchema.parse(process.env);
