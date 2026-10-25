import type { Database } from '../../db/client';
import { users } from '../../db/schema';
import { ConflictError } from '../../lib/errors';

/** The user fields that are safe to return from the API. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
}

/** All SQL for the users table lives behind this interface, so tests can swap in a fake. */
export interface UsersRepository {
  /** Inserts a user; throws ConflictError if the email is already registered. */
  create(input: NewUser): Promise<PublicUser>;
}

/** Postgres-backed implementation of {@link UsersRepository}. */
export function createUsersRepository(db: Database): UsersRepository {
  return {
    async create(input) {
      try {
        const [user] = await db
          .insert(users)
          .values(input)
          .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
        return user;
      } catch (err) {
        // Rely on the unique constraint rather than a prior lookup, so two concurrent
        // registrations with the same email can't both succeed.
        if (isUniqueViolation(err)) {
          throw new ConflictError('EMAIL_TAKEN', 'Email is already registered');
        }
        throw err;
      }
    },
  };
}

/** Postgres error 23505; Drizzle wraps driver errors, so the code may sit on `cause`. */
function isUniqueViolation(err: unknown): boolean {
  const code = (e: unknown) => (e as { code?: string } | undefined)?.code;
  return code(err) === '23505' || code((err as { cause?: unknown })?.cause) === '23505';
}
