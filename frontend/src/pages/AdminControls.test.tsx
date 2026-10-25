import { screen, within } from '@testing-library/react';
import { inStock, loginAs, serveVehicles } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

describe('admin controls', () => {
  it.each([
    ['hidden from a regular user', 'user' as const, false],
    ['shown to an admin', 'admin' as const, true],
  ])('are %s', async (_case, role, visible) => {
    loginAs(role);
    serveVehicles(inStock);
    renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    const controls = [
      screen.queryByRole('button', { name: 'Add vehicle' }),
      ...['Edit', 'Restock', 'Delete'].map((name) => within(card).queryByRole('button', { name })),
    ];

    for (const control of controls) {
      if (visible) expect(control).toBeInTheDocument();
      else expect(control).not.toBeInTheDocument();
    }
  });
});
