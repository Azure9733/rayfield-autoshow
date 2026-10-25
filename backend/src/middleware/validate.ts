import type { RequestHandler, RequestParamHandler } from 'express';
import { z, type ZodType } from 'zod';
import { ValidationError } from '../lib/errors';

type Source = 'body' | 'query';

/**
 * Validates one part of the request with a Zod schema. Parsed (trimmed, coerced, stripped)
 * data goes on `res.locals[source]`; Express 5's `req.query` is read-only, so handlers always
 * read parsed input from `res.locals`.
 */
function validate(source: Source, schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new ValidationError(
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    res.locals[source] = result.data;
    next();
  };
}

/** Validates `req.body`; parsed data on `res.locals.body`. */
export const validateBody = (schema: ZodType) => validate('body', schema);

/** Validates `req.query`; parsed data on `res.locals.query`. */
export const validateQuery = (schema: ZodType) => validate('query', schema);

const uuid = z.uuid();

/**
 * `router.param` handler shared by every `:id` route: rejects a malformed id with 400 before
 * any handler runs, instead of letting Postgres fail on invalid uuid syntax (a 500).
 */
export const validateUuidParam: RequestParamHandler = (_req, _res, next, value: string, name) => {
  if (uuid.safeParse(value).success) {
    next();
    return;
  }
  next(new ValidationError([{ field: String(name), message: 'Must be a valid UUID' }]));
};
