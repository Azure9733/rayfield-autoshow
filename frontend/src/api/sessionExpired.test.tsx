import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
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
});
