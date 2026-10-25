import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';

/** Maps AppErrors to the API's JSON error format; anything else goes to Express's default. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (!(err instanceof AppError)) {
    next(err);
    return;
  }
  const { status, code, message, details } = err;
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
};
