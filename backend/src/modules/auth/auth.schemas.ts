import { z } from 'zod';

/**
 * Request body for POST /api/auth/login. No format rules: a malformed email simply matches
 * no user and gets the same generic 401 as a wrong password.
 */
export const loginSchema = z.object({
  // Emails are stored lowercased, so lowercase here to match them case-insensitively.
  email: z.string().toLowerCase(),
  password: z.string(),
});

/** Request body for POST /api/auth/register. Unknown keys (e.g. `role`) are stripped. */
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  // Lowercased before it reaches the DB, so the unique constraint is effectively case-insensitive.
  email: z.email().toLowerCase(),
  password: z
    .string()
    .min(8)
    // bcrypt silently ignores everything after byte 72, so cap bytes, not characters.
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password must be at most 72 bytes'),
});
