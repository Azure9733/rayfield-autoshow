import { randomUUID } from 'node:crypto';
import { pool } from '../../src/db/client';
import { signToken } from '../../src/lib/jwt';

/**
 * Inserts a user with raw SQL (no password hashing; these users never log in) and returns its
 * id with a valid Authorization header. Needed wherever a row references users(id), e.g.
 * purchases; authHeader() alone signs tokens for users that don't exist.
 */
export async function createUser(
  role: 'user' | 'admin' = 'user',
): Promise<{ id: string; auth: string }> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into users (name, email, password_hash, role) values ($1, $2, 'not-a-hash', $3)
     returning id`,
    ['Buyer', `buyer-${randomUUID()}@example.com`, role],
  );
  const { id } = rows[0];
  return { id, auth: `Bearer ${signToken({ sub: id, role })}` };
}
