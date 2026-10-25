import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { onSessionExpired } from '../api/client';

const SESSION_EXPIRED = 'Your session expired. Please log in again.';

/** Holds the auth state for the app; must sit inside the router so it can redirect. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(
    () =>
      onSessionExpired(() =>
        navigate('/login', { replace: true, state: { notice: SESSION_EXPIRED } }),
      ),
    [navigate],
  );

  return children;
}
