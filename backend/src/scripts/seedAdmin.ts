import { db, pool } from '../db/client';
import { hashPassword } from '../lib/password';
import { registerSchema } from '../modules/auth/auth.schemas';
import {
  createUsersRepository,
  type PublicUser,
  type UsersRepository,
} from '../modules/auth/users.repository';

// Same email and password rules as registration (lowercased email, 8 chars to 72 bytes).
const credentialsSchema = registerSchema.pick({ email: true, password: true });

export interface AdminCredentials {
  email: string;
  password: string;
}

/**
 * Creates the admin account. Admins are never created through /register, so this script (run
 * with ADMIN_EMAIL / ADMIN_PASSWORD from the environment) is the only way in.
 */
export async function seedAdmin(
  credentials: AdminCredentials,
  users: UsersRepository = createUsersRepository(db),
): Promise<PublicUser> {
  const { email, password } = credentialsSchema.parse(credentials);
  return users.saveAdmin({ name: 'Admin', email, passwordHash: await hashPassword(password) });
}

// CLI: `npm run db:seed:admin` (reads ADMIN_EMAIL and ADMIN_PASSWORD from .env).
if (require.main === module) {
  seedAdmin({ email: process.env.ADMIN_EMAIL ?? '', password: process.env.ADMIN_PASSWORD ?? '' })
    .then((admin) => console.info(`Admin ready: ${admin.email}`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
