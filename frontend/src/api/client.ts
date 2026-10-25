import { clearSession, loadSession } from './session';

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

let sessionExpiredHandler: (() => void) | null = null;

/**
 * Registers what happens when the backend rejects the stored token (AuthProvider redirects to
 * /login). The client stays React-free, so it calls back instead of navigating itself.
 * Returns an unsubscribe function.
 */
export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null;
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = loadSession()?.token;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let response: Response;
  let data;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // 204 No Content (delete) has no body to parse.
    data = response.status === 204 ? undefined : await response.json();
  } catch {
    // The backend always answers JSON, so no answer or a non-JSON one (e.g. the proxy's HTML
    // 502 when the backend is down) means it wasn't reached.
    throw new ApiError(0, 'NETWORK_ERROR', "Can't reach the server. Please try again.");
  }
  if (!response.ok) {
    // On /api/auth/* a 401 means wrong credentials, not an expired session: the form shows it.
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      clearSession();
      sessionExpiredHandler?.();
    }
    // Our backend always sends { error: { code, message } }; anything else (a proxy, a
    // platform error page as JSON) still becomes an ApiError so callers handle one type.
    const error = data?.error;
    if (typeof error?.code !== 'string' || typeof error.message !== 'string') {
      throw new ApiError(
        response.status,
        'UNKNOWN_ERROR',
        'Something went wrong. Please try again.',
      );
    }
    throw new ApiError(response.status, error.code, error.message, error.details);
  }
  return data as T;
}

/** Fetch wrapper for the backend; paths are relative (`/api/...`), proxied in dev and prod. */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};
