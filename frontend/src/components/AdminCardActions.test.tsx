import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
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

  it.each([
    [
      'Save (add vehicle)',
      'post',
      '/api/vehicles',
      async (user: UserEvent) => {
        await user.click(screen.getByRole('button', { name: 'Add vehicle' }));
        const dialog = screen.getByRole('dialog', { name: 'Add vehicle' });
        const field = (label: string) => within(dialog).getByLabelText(label);
        await user.type(field('Make'), 'Toyota');
        await user.type(field('Model'), 'Supra');
        await user.type(field('Year'), '2024');
        await user.selectOptions(field('Category'), 'COUPE');
        await user.type(field('Price'), '55000');
        return within(dialog).getByRole('button', { name: 'Save' });
      },
    ],
    [
      'Add stock',
      'post',
      '/api/vehicles/a1/restock',
      async (user: UserEvent, card: HTMLElement) => {
        await user.click(within(card).getByRole('button', { name: 'Restock' }));
        await user.type(within(card).getByLabelText('Units to add'), '5');
        return within(card).getByRole('button', { name: 'Add stock' });
      },
    ],
    [
      'Confirm delete',
      'delete',
      '/api/vehicles/a1',
      async (user: UserEvent, card: HTMLElement) => {
        await user.click(within(card).getByRole('button', { name: 'Delete' }));
        return within(card).getByRole('button', { name: 'Confirm' });
      },
    ],
  ] as const)(
    '%s ignores a second click while its request is in flight',
    async (_case, method, path, open) => {
      let calls = 0;
      let respond = () => {};
      const responded = new Promise<void>((resolve) => (respond = resolve));
      server.use(
        http[method](path, async () => {
          calls++;
          await responded;
          return method === 'delete'
            ? new HttpResponse(null, { status: 204 })
            : HttpResponse.json({ ...inStock, id: 'c3', model: 'Supra' }, { status: 201 });
        }),
      );
      const { user, card } = await renderAsAdmin();
      const button = await open(user, card);

      await user.dblClick(button);

      expect(button).toBeDisabled();
      respond();
      await waitFor(() => expect(calls).toBe(1));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(calls).toBe(1);
    },
  );
});
