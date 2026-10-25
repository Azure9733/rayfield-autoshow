/** The logged-in user as returned by POST /api/auth/login. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Session {
  token: string;
  user: User;
}

// localStorage keeps the session across reloads. Trade-off: any script on the page (XSS) can
// read it, which an httpOnly cookie would prevent; accepted to keep the API stateless and simple.
const KEY = 'rayfield.session';

/** Stores the token and user after login. */
export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

/** The stored session, or null when logged out. */
export function loadSession(): Session | null {
  return JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null;
}
