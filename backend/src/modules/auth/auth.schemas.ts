import { z } from 'zod';

/** Request body for POST /api/auth/register. Unknown keys (e.g. `role`) are stripped. */
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.email(),
  password: z
    .string()
    .min(8)
    // bcrypt silently ignores everything after byte 72, so cap bytes, not characters.
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password must be at most 72 bytes'),
});
