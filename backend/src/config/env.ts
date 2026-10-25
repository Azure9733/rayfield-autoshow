import { validateEnv } from './envSchema';

export { validateEnv, type Env } from './envSchema';

/**
 * Validated environment. Parsed once at import, so a missing or malformed variable
 * fails at startup instead of on the first request that needs it.
 */
export const env = validateEnv(process.env);
