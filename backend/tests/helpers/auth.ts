import { randomUUID } from 'node:crypto';
import { signToken } from '../../src/lib/jwt';

/** An Authorization header value with a valid token for a (not necessarily stored) user. */
export function authHeader(role: 'user' | 'admin' = 'user'): string {
  return `Bearer ${signToken({ sub: randomUUID(), role })}`;
}
