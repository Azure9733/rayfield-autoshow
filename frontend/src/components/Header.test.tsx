import { screen, within } from '@testing-library/react';
import { loadSession, saveSession } from '../api/session';
import { loginAs } from '../test/fixtures';
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

  it('the Menu button opens and closes the mobile nav', async () => {
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
  });

  it('has no Inventory link, in the nav or the menu; the logo links to /', async () => {
    saveSession({ token: 'some.jwt.token', user: account });
    const { user } = renderApp('/');

    expect(screen.queryByRole('link', { name: 'Inventory' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.queryByRole('link', { name: 'Inventory' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /rayfield/i })).toHaveAttribute('href', '/');
  });

  it.each([
    ['a user', 'user' as const, 'Vik'],
    ['an admin', 'admin' as const, 'Ada'],
  ])(
    'shows %s a person icon and their name (no role), with Logout right-most, in the nav and the menu',
    async (_case, role, name) => {
      loginAs(role);
      const { user } = renderApp('/');
      await user.click(screen.getByRole('button', { name: 'Menu' }));

      for (const navName of ['Main', 'Mobile']) {
        const nav = screen.getByRole('navigation', { name: navName });
        expect(within(nav).getByRole('img', { name: 'User account' })).toBeInTheDocument();
        expect(within(nav).queryByRole('img', { name: 'Admin account' })).not.toBeInTheDocument();
        expect(within(nav).getByText(name)).toBeInTheDocument();
        expect(within(nav).queryByText(/admin/i)).not.toBeInTheDocument();
        expect(nav.lastElementChild).toBe(within(nav).getByRole('button', { name: 'Logout' }));
      }
    },
  );

  it.each(['/login', '/register'])(
    'a guest on %s sees only the brand: no Menu, Login or Register',
    (path) => {
      renderApp(path);
      const header = screen.getByRole('banner');

      expect(within(header).queryByRole('button')).not.toBeInTheDocument();
      expect(within(header).getAllByRole('link')).toHaveLength(1);
      expect(within(header).getByRole('link', { name: /rayfield/i })).toHaveAttribute('href', '/');
    },
  );
});
