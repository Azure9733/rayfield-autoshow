import { z } from 'zod';

// Each field uses one plain-English message for every way it can be wrong (missing, wrong
// type, out of range); the UI shows it under the matching form field.

/**
 * Request body for POST /api/auth/login. No format rules: a malformed email simply matches
 * no user and gets the same generic 401 as a wrong password.
 */
export const loginSchema = z.object({
  // Emails are stored lowercased, so lowercase here to match them case-insensitively.
  email: z.string({ error: 'Email is required' }).toLowerCase(),
  password: z.string({ error: 'Password is required' }),
});

const nameMessage = 'Name must be 1–60 characters';
const emailMessage = 'Enter a valid email address';
const passwordMessage = 'Password must be at least 8 characters (and at most 72 bytes)';

/** Request body for POST /api/auth/register. Unknown keys (e.g. `role`) are stripped. */
export const registerSchema = z.object({
  name: z.string({ error: nameMessage }).trim().min(1, nameMessage).max(60, nameMessage),
  // Lowercased before it reaches the DB, so the unique constraint is effectively case-insensitive.
  email: z.email({ error: emailMessage }).toLowerCase(),
  password: z
    .string({ error: passwordMessage })
    .min(8, passwordMessage)
    // bcrypt silently ignores everything after byte 72, so cap bytes, not characters.
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, passwordMessage),
});
