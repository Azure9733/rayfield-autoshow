import { screen, within } from '@testing-library/react';
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

  it('the Menu button opens and closes the mobile nav; choosing a link closes it', async () => {
    saveSession({ token: 'some.jwt.token', user: account });
    const { user } = renderApp('/');
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();

    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile' });
    expect(within(mobileNav).getByRole('button', { name: 'Logout' })).toBeInTheDocument();

    await user.click(menu);
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();

    await user.click(menu);
    await user.click(
      within(screen.getByRole('navigation', { name: 'Mobile' })).getByRole('link', {
        name: 'Inventory',
      }),
    );
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  });
});
