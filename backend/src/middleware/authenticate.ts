import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';
import { verifyToken } from '../lib/jwt';

/** The authenticated caller, stored on `res.locals.user` for later middleware and handlers. */
export interface AuthUser {
  id: string;
  role: 'user' | 'admin';
}

const BEARER = /^Bearer (\S+)$/;

/**
 * Requires a `Bearer <token>` header with a valid, unexpired JWT; anything else gets
 * 401 UNAUTHENTICATED. On success the caller is available as `res.locals.user`.
 */
export const authenticate: RequestHandler = (req, res, next) => {
  const match = BEARER.exec(req.headers.authorization ?? '');
  if (!match) {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication required');
  }
  let user: AuthUser;
  try {
    const { sub, role } = verifyToken(match[1]);
    user = { id: sub, role };
  } catch {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Invalid or expired token');
  }
  res.locals.user = user;
  next();
};
