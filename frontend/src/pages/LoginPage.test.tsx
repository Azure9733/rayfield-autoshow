import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { loadSession } from '../api/session';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

async function logIn(user: UserEvent, email = 'vik@example.com', password = 'correct-horse') {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('login page', () => {
  it('shows the API error on 401', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderApp('/login');

    await logIn(user, 'vik@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('redirects to / after a successful login', async () => {
    const account = { id: 'u1', name: 'Vik', email: 'vik@example.com', role: 'user' };
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ token: 'good.jwt.token', user: account }),
      ),
    );
    const { user } = renderApp('/login');

    await logIn(user);

    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    expect(loadSession()).toEqual({ token: 'good.jwt.token', user: account });
  });
});
