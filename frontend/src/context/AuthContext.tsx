import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import * as authApi from '../api/auth';
import { onSessionExpired } from '../api/client';
import { clearSession, loadSession, saveSession, type Session, type User } from '../api/session';

const SESSION_EXPIRED = 'Your session expired. Please log in again.';

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  /** Creates the account, then logs in with the same credentials. */
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => void;
  /**
   * Counts logins (and registers, which log in) in this page load; 0 after a reload. Drives the
   * login sweep, which plays only right after logging in.
   */
  logins: number;
  /** True until the inventory has played its reveal for the latest login. */
  revealPending: boolean;
  /** Marks the latest login's reveal as played. */
  ackReveal: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Holds the auth state for the app; must sit inside the router so it can redirect. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(loadSession);
  const [logins, setLogins] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const ackReveal = useCallback(() => setRevealed(logins), [logins]);

  useEffect(
    () =>
      onSessionExpired(() => {
        // The client already cleared storage; drop the in-memory user too. React Router applies
        // navigations as transitions, so clear the user in one as well: otherwise it commits
        // first and ProtectedRoute redirects to /login without the notice.
        startTransition(() => setSession(null));
        navigate('/login', { replace: true, state: { notice: SESSION_EXPIRED } });
      }),
    [navigate],
  );

  async function login(email: string, password: string) {
    const next = await authApi.login(email, password);
    saveSession(next);
    setSession(next);
    setLogins((n) => n + 1);
  }

  async function register(input: authApi.RegisterInput) {
    await authApi.register(input);
    await login(input.email, input.password);
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        login,
        register,
        logout,
        logins,
        revealPending: logins > revealed,
        ackReveal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** The current user and auth actions; only valid inside AuthProvider. */
// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
