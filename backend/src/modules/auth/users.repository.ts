import { eq } from 'drizzle-orm';
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

/** A user with the stored hash; only for login, never returned from the API. */
export interface UserWithHash extends PublicUser {
  passwordHash: string;
}

/** All SQL for the users table lives behind this interface, so tests can swap in a fake. */
export interface UsersRepository {
  /** Inserts a user; throws ConflictError if the email is already registered. */
  create(input: NewUser): Promise<PublicUser>;
  /** Exact match on the stored (lowercased) email; undefined if there's no such user. */
  findByEmail(email: string): Promise<UserWithHash | undefined>;
  /** Stores a user with role admin (used by the seed script, never by the API). */
  saveAdmin(input: NewUser): Promise<PublicUser>;
}

const publicColumns = { id: users.id, name: users.name, email: users.email, role: users.role };

/** Postgres-backed implementation of {@link UsersRepository}. */
export function createUsersRepository(db: Database): UsersRepository {
  return {
    async saveAdmin(input) {
      const [admin] = await db
        .insert(users)
        .values({ ...input, role: 'admin' })
        .returning(publicColumns);
      return admin;
    },

    async findByEmail(email) {
      const [user] = await db
        .select({ ...publicColumns, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, email));
      return user;
    },

    async create(input) {
      try {
        const [user] = await db.insert(users).values(input).returning(publicColumns);
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
