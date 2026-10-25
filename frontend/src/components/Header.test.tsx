import { screen } from '@testing-library/react';
import { loadSession, saveSession } from '../api/session';
import { renderApp } from '../test/renderApp';

const account = { id: 'u1', name: 'Vik', email: 'vik@example.com', role: 'user' as const };

describe('header', () => {
  it('logout clears the token and returns to /login', async () => {
    saveSession({ token: 'some.jwt.token', user: account });
    const { user } = renderApp('/');

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(loadSession()).toBeNull();
  });
});
