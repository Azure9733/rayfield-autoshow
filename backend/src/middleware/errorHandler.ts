import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors';

/** body-parser marks a JSON syntax error in the request body with this type. */
function isJsonParseError(err: unknown): boolean {
  return (err as { type?: string } | null)?.type === 'entity.parse.failed';
}

/**
 * Renders every error as `{ error: { code, message, details? } }`. AppErrors keep their status
 * and message; anything unexpected is logged server-side and answered with a generic 500, so
 * no internal message or stack trace ever reaches the client.
 */
// Express recognises an error handler by its four parameters, so _next must stay.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isJsonParseError(err)) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    });
    return;
  }
  if (err instanceof AppError) {
    const { status, code, message, details } = err;
    res.status(status).json({ error: { code, message, ...(details && { details }) } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
