import { api } from './client';
import type { Session, User } from './session';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** POST /api/auth/register: creates the account (it doesn't log in). */
export function register(input: RegisterInput) {
  return api.post<User>('/api/auth/register', input);
}

/** POST /api/auth/login: returns the token and user. */
export function login(email: string, password: string) {
  return api.post<Session>('/api/auth/login', { email, password });
}
