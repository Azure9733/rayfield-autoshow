import type { Database } from '../../db/client';
import { users } from '../../db/schema';

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
  create(input: NewUser): Promise<PublicUser>;
}

/** Postgres-backed implementation of {@link UsersRepository}. */
export function createUsersRepository(db: Database): UsersRepository {
  return {
    async create(input) {
      const [user] = await db
        .insert(users)
        .values(input)
        .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
      return user;
    },
  };
}
