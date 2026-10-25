import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';
import { verifyToken } from '../lib/jwt';

const BEARER = /^Bearer (\S+)$/;

/**
 * Requires a `Bearer <token>` header with a valid, unexpired JWT; anything else gets
 * 401 UNAUTHENTICATED.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const match = BEARER.exec(req.headers.authorization ?? '');
  if (!match) {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication required');
  }
  try {
    verifyToken(match[1]);
  } catch {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Invalid or expired token');
  }
  next();
};
