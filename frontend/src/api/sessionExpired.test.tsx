import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { loginAs } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';
import { api } from './client';
import { loadSession, saveSession } from './session';

const user = { id: 'u1', name: 'Vik', email: 'vik@example.com', role: 'user' as const };

/** Stands in for any page that calls a protected endpoint on mount. */
function LoadsVehicles() {
  useEffect(() => {
    api.get('/api/vehicles').catch(() => {});
  }, []);
  return <p>Inventory page</p>;
}

function renderAt(path: string, page: React.ReactNode) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={page} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('session expiry', () => {
  it('a 401 from a non-auth call logs out and redirects to /login with a "session expired" message', async () => {
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } },
          { status: 401 },
        ),
      ),
    );
    saveSession({ token: 'expired.token', user });

    renderAt('/', <LoadsVehicles />);

    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument();
    expect(loadSession()).toBeNull();
  });

  it('a 401 from /api/auth/* does not trigger that redirect', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );
    saveSession({ token: 'still.valid', user });

    /** Stands in for a form that posts to an auth endpoint and shows the error itself. */
    function TriesLogin() {
      const [error, setError] = useState('');
      useEffect(() => {
        api
          .post('/api/auth/login', { email: 'vik@example.com', password: 'wrong-password' })
          .catch((e: Error) => setError(e.message));
      }, []);
      return <p>Login error: {error}</p>;
    }
    renderAt('/somewhere', <TriesLogin />);

    expect(await screen.findByText('Login error: Invalid email or password')).toBeInTheDocument();
    expect(screen.queryByText(/your session expired/i)).not.toBeInTheDocument();
    expect(loadSession()).not.toBeNull();
  });

  it('session expiry also logs the header out', async () => {
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } },
          { status: 401 },
        ),
      ),
    );
    loginAs('user');

    renderApp('/');

    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });
});
