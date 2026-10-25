import { loadSession } from './session';

export interface FieldError {
  field: string;
  message: string;
}

/** A failed API call, unpacked from the backend's `{ error: { code, message, details } }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: FieldError[] = [],
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string): Promise<T> {
  const token = loadSession()?.token;
  const response = await fetch(path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await response.json();
  if (!response.ok) {
    const { code, message, details } = body.error;
    throw new ApiError(response.status, code, message, details);
  }
  return body as T;
}

/** Fetch wrapper for the backend; paths are relative (`/api/...`), proxied in dev and prod. */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
};
