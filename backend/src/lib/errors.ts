/** One invalid field in a request, as reported in `error.details`. */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Base class for errors the API reports to clients. The error handler turns any AppError
 * into `{ error: { code, message, details? } }` with its status; new error types only
 * need to extend this class.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: FieldError[],
  ) {
    super(message);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}

export class ValidationError extends AppError {
  constructor(details: FieldError[]) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
}
