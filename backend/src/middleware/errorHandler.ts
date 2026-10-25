import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';

/** body-parser marks a JSON syntax error in the request body with this type. */
function isJsonParseError(err: unknown): boolean {
  return (err as { type?: string } | null)?.type === 'entity.parse.failed';
}

/** Maps AppErrors to the API's JSON error format; anything else goes to Express's default. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (isJsonParseError(err)) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    });
    return;
  }
  if (!(err instanceof AppError)) {
    next(err);
    return;
  }
  const { status, code, message, details } = err;
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
};
