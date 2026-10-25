import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
});

/**
 * Validated environment. Parsed once at import, so a missing or malformed variable
 * fails at startup instead of on the first request that needs it.
 */
export const env = envSchema.parse(process.env);
