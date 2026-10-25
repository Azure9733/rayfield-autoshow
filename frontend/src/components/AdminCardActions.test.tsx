import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { inStock, loginAs, serveVehicles } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

async function renderAsAdmin() {
  loginAs('admin');
  serveVehicles(inStock);
  const { user } = renderApp('/');
  const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
  return { user, card };
}

describe('admin card actions', () => {
  it('Delete asks for in-page confirmation before sending anything', async () => {
    let sent = false;
    server.use(
      http.delete('/api/vehicles/a1', () => {
        sent = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, card } = await renderAsAdmin();

    await user.click(within(card).getByRole('button', { name: 'Delete' }));

    const confirm = within(card).getByRole('alertdialog', { name: 'Delete Land Cruiser?' });
    expect(within(confirm).getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(sent).toBe(false);

    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));

    expect(within(card).queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(sent).toBe(false);
  });

  it('confirming delete removes the card', async () => {
    server.use(http.delete('/api/vehicles/a1', () => new HttpResponse(null, { status: 204 })));
    const { user, card } = await renderAsAdmin();

    await user.click(within(card).getByRole('button', { name: 'Delete' }));
    await user.click(within(card).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(card).not.toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
