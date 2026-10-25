import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import * as authApi from '../api/auth';
import { onSessionExpired } from '../api/client';
import { loadSession, saveSession, type Session, type User } from '../api/session';

const SESSION_EXPIRED = 'Your session expired. Please log in again.';

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  /** Creates the account, then logs in with the same credentials. */
  register: (input: authApi.RegisterInput) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Holds the auth state for the app; must sit inside the router so it can redirect. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(loadSession);

  useEffect(
    () =>
      onSessionExpired(() =>
        navigate('/login', { replace: true, state: { notice: SESSION_EXPIRED } }),
      ),
    [navigate],
  );

  async function login(email: string, password: string) {
    const next = await authApi.login(email, password);
    saveSession(next);
    setSession(next);
  }

  async function register(input: authApi.RegisterInput) {
    await authApi.register(input);
    await login(input.email, input.password);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, login, register }}>
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
