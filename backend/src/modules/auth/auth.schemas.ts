import { z } from 'zod';

/** Request body for POST /api/auth/register. Unknown keys (e.g. `role`) are stripped. */
export const registerSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});
