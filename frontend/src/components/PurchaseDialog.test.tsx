import { act, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { badge, inStock, loginAs, serveVehicles, soldOut } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

/** Renders the inventory and opens the purchase dialog for the Land Cruiser. */
async function openPurchase(user: UserEvent) {
  const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
  await user.click(within(card).getByRole('button', { name: 'Purchase' }));
  const dialog = screen.getByRole('dialog', { name: 'Purchase Toyota Land Cruiser' });
  return { card, dialog };
}

const confirmButton = (dialog: HTMLElement) =>
  within(dialog).getByRole('button', { name: 'Confirm purchase' });

/** Counts purchase requests and answers with `respond` (default: one unit sold). */
function servePurchase(respond = () => HttpResponse.json({ ...inStock, quantity: 1 })) {
  const calls = { count: 0 };
  server.use(
    http.post('/api/vehicles/a1/purchase', () => {
      calls.count++;
      return respond();
    }),
  );
  return calls;
}

describe('purchase dialog', () => {
  beforeEach(() => loginAs('user'));

  it('Purchase opens a confirmation dialog; Cancel, Escape and the backdrop close it without buying', async () => {
    serveVehicles(inStock, soldOut);
    const calls = servePurchase();
    const { user } = renderApp('/');

    const { dialog } = await openPurchase(user);
    for (const text of ['2024', '$125,000.00']) {
      expect(within(dialog).getByText(text)).toBeInTheDocument();
    }
    expect(confirmButton(dialog)).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openPurchase(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openPurchase(user);
    await user.click(screen.getByTestId('dialog-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(calls.count).toBe(0);
  });

  it('Confirm shows PROCESSING... and is disabled in flight; a double-click buys once', async () => {
    serveVehicles(inStock);
    let respond = () => {};
    const responded = new Promise<void>((resolve) => (respond = resolve));
    let calls = 0;
    server.use(
      http.post('/api/vehicles/a1/purchase', async () => {
        calls++;
        await responded;
        return HttpResponse.json({ ...inStock, quantity: 1 });
      }),
    );
    const { user } = renderApp('/');
    const { card, dialog } = await openPurchase(user);
    const confirm = confirmButton(dialog);

    await user.dblClick(confirm);

    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent('Processing...');
    respond();
    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('1'));
    expect(calls).toBe(1);
  });

  // The tests below predate the dialog; they now confirm in it first.

  it('Purchase calls the API and updates the stock shown', async () => {
    serveVehicles(inStock, soldOut);
    servePurchase();
    const { user } = renderApp('/');
    const { card, dialog } = await openPurchase(user);

    await user.click(confirmButton(dialog));

    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('1'));
  });

  it('a successful purchase shows the UNIT ACQUIRED toast', async () => {
    serveVehicles(inStock);
    servePurchase();
    const { user } = renderApp('/');
    const { dialog } = await openPurchase(user);

    await user.click(confirmButton(dialog));

    expect(await screen.findByRole('status')).toHaveTextContent('UNIT ACQUIRED');
  });

  it('a 409 on purchase shows the OUT OF STOCK toast and refreshes the card', async () => {
    // The page loaded while 2 were left; someone else bought them before this click.
    let loads = 0;
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json([++loads === 1 ? inStock : { ...inStock, quantity: 0 }]),
      ),
    );
    servePurchase(() =>
      HttpResponse.json(
        { error: { code: 'OUT_OF_STOCK', message: 'Out of stock' } },
        { status: 409 },
      ),
    );
    const { user } = renderApp('/');
    const { card, dialog } = await openPurchase(user);

    await user.click(confirmButton(dialog));

    expect(await screen.findByRole('alert')).toHaveTextContent('OUT OF STOCK');
    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('Sold out'));
    expect(within(card).getByRole('button', { name: 'Purchase' })).toBeDisabled();
  });

  it.each([
    [
      'a 404',
      () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
          { status: 404 },
        ),
      'Vehicle not found',
    ],
    ['a network failure', () => HttpResponse.error(), "Can't reach the server. Please try again."],
  ])('%s on purchase shows a red toast with the API message', async (_case, resolver, message) => {
    serveVehicles(inStock);
    servePurchase(resolver);
    const { user } = renderApp('/');
    const { dialog } = await openPurchase(user);

    await user.click(confirmButton(dialog));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('a failed refresh after a 409 shows its error as the red toast', async () => {
    let loads = 0;
    server.use(
      http.get('/api/vehicles', () =>
        ++loads === 1
          ? HttpResponse.json([inStock])
          : HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
              { status: 500 },
            ),
      ),
    );
    servePurchase(() =>
      HttpResponse.json(
        { error: { code: 'OUT_OF_STOCK', message: 'Out of stock' } },
        { status: 409 },
      ),
    );
    const { user } = renderApp('/');
    const { dialog } = await openPurchase(user);

    await user.click(confirmButton(dialog));

    await waitFor(() =>
      expect(
        screen.getAllByRole('alert').some((a) => a.textContent?.includes('Something went wrong')),
      ).toBe(true),
    );
  });

  describe('timing', () => {
    // shouldAdvanceTime keeps real time flowing too, so MSW and user-event still work.
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it('the success toast dismisses itself after about 4 seconds', async () => {
      serveVehicles(inStock);
      servePurchase();
      const { user } = renderApp('/');
      const { dialog } = await openPurchase(user);
      await user.click(confirmButton(dialog));
      const toast = await screen.findByRole('status');

      act(() => vi.advanceTimersByTime(3500));
      expect(toast).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1000));
      expect(toast).not.toBeInTheDocument();
    });
  });
});
