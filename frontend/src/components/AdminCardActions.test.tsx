import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { badge, inStock, loginAs, serveVehicles } from '../test/fixtures';
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

  it('restock adds units and updates the stock shown', async () => {
    let body: unknown;
    server.use(
      http.post('/api/vehicles/a1/restock', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...inStock, quantity: inStock.quantity + 5 });
      }),
    );
    const { user, card } = await renderAsAdmin();

    await user.click(within(card).getByRole('button', { name: 'Restock' }));
    await user.type(within(card).getByLabelText('Units to add'), '5');
    await user.click(within(card).getByRole('button', { name: 'Add stock' }));

    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('7'));
    expect(body).toEqual({ quantity: 5 });
    expect(within(card).queryByLabelText('Units to add')).not.toBeInTheDocument();
  });

  it.each(['0', '10001', '2.5'])(
    'restock rejects %s with the message under the field, sending nothing',
    async (units) => {
      let sent = false;
      server.use(
        http.post('/api/vehicles/a1/restock', () => {
          sent = true;
          return HttpResponse.json(inStock);
        }),
      );
      const { user, card } = await renderAsAdmin();

      await user.click(within(card).getByRole('button', { name: 'Restock' }));
      await user.type(within(card).getByLabelText('Units to add'), units);
      await user.click(within(card).getByRole('button', { name: 'Add stock' }));

      expect(within(card).getByLabelText('Units to add')).toHaveAccessibleDescription(
        'Restock quantity must be a whole number from 1 to 10,000',
      );
      expect(sent).toBe(false);
    },
  );

  const notFound = () =>
    HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
      { status: 404 },
    );

  it('a failed delete shows the API error as a red toast and keeps the confirmation open', async () => {
    server.use(http.delete('/api/vehicles/a1', notFound));
    const { user, card } = await renderAsAdmin();

    await user.click(within(card).getByRole('button', { name: 'Delete' }));
    await user.click(within(card).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle not found');
    expect(within(card).getByRole('alertdialog')).toBeInTheDocument();
  });

  it('a failed restock shows the API error as a red toast and keeps the popover open', async () => {
    server.use(http.post('/api/vehicles/a1/restock', notFound));
    const { user, card } = await renderAsAdmin();

    await user.click(within(card).getByRole('button', { name: 'Restock' }));
    await user.type(within(card).getByLabelText('Units to add'), '5');
    await user.click(within(card).getByRole('button', { name: 'Add stock' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle not found');
    expect(within(card).getByLabelText('Units to add')).toHaveValue(5);
  });
});
