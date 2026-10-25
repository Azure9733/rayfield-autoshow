import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../lib/errors';

/**
 * Validates the request body with a Zod schema. Parsed (trimmed, defaulted, stripped) data
 * goes on `res.locals.body`; handlers read it from there rather than from `req.body`.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    res.locals.body = result.data;
    next();
  };
}
