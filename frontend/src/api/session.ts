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

/** Forgets the stored session (logout, or the token was rejected). */
export function clearSession() {
  localStorage.removeItem(KEY);
}

/**
 * The stored session, or null when logged out. Anything unreadable (bad JSON, wrong shape,
 * e.g. edited by hand or left by an older version) counts as logged out and is removed.
 */
export function loadSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return null;
  try {
    const session = JSON.parse(raw) as Partial<Session> | null;
    if (typeof session?.token === 'string' && typeof session.user?.role === 'string') {
      return session as Session;
    }
  } catch {
    // fall through: unreadable
  }
  clearSession();
  return null;
}
