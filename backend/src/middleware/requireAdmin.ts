import type { RequestHandler } from 'express';
import { ForbiddenError } from '../lib/errors';
import type { AuthUser } from './authenticate';

/** Allows only admins through; must run after `authenticate`. Others get 403 FORBIDDEN. */
export const requireAdmin: RequestHandler = (_req, res, next) => {
  if ((res.locals.user as AuthUser | undefined)?.role !== 'admin') {
    throw new ForbiddenError('FORBIDDEN', 'Admin access required');
  }
  next();
};
