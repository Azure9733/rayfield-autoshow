import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';

/** Rejects requests that don't carry a bearer token with 401 UNAUTHENTICATED. */
export const authenticate: RequestHandler = (req, _res, next) => {
  if (!req.headers.authorization) {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication required');
  }
  next();
};
