import { loadSession } from './session';

async function request<T>(method: string, path: string): Promise<T> {
  const token = loadSession()?.token;
  const response = await fetch(path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return (await response.json()) as T;
}

/** Fetch wrapper for the backend; paths are relative (`/api/...`), proxied in dev and prod. */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
};
