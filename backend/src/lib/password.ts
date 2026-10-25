import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/** Hashes a password with bcrypt; the cost comes from BCRYPT_COST (low in tests for speed). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_COST);
}

/** True when `plain` matches the stored bcrypt `hash`. */
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
