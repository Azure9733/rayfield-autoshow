import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';

const BEARER = /^Bearer (\S+)$/;

/** Rejects requests that don't carry a `Bearer <token>` header with 401 UNAUTHENTICATED. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const match = BEARER.exec(req.headers.authorization ?? '');
  if (!match) {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication required');
  }
  next();
};
