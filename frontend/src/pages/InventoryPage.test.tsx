import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { badge, inStock, loginAs, makeVehicle, serveVehicles, soldOut } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

describe('inventory page', () => {
  beforeEach(() => loginAs('user'));

  it('cards show make, model, year, category, USD price and stock', async () => {
    serveVehicles(makeVehicle());
    renderApp('/');

    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    for (const text of ['Toyota', 'Land Cruiser', '2024', '$125,000.00']) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }
    expect(badge(card, 'Category')).toHaveTextContent('SUV');
    expect(badge(card, 'Stock')).toHaveTextContent('3');
  });

  it('shows skeleton cards while loading', async () => {
    let respond = () => {};
    const responded = new Promise<void>((resolve) => (respond = resolve));
    server.use(
      http.get('/api/vehicles', async () => {
        await responded;
        return HttpResponse.json([makeVehicle()]);
      }),
    );
    renderApp('/');

    expect(await screen.findAllByTestId('skeleton-card')).not.toHaveLength(0);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    respond();

    expect(await screen.findByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
  });

  it('shows ///NO.UNITS.IN.STOCK when the inventory is empty', async () => {
    serveVehicles();
    renderApp('/');

    expect(await screen.findByText('///NO.UNITS.IN.STOCK')).toBeInTheDocument();
  });

  it('shows the red error toast on an API error, and Retry loads again', async () => {
    let calls = 0;
    server.use(
      http.get('/api/vehicles', () =>
        ++calls === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
              { status: 500 },
            )
          : HttpResponse.json([makeVehicle()]),
      ),
    );
    const { user } = renderApp('/');

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('Something went wrong');

    await user.click(within(toast).getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the Purchase button when quantity is 0', async () => {
    serveVehicles(inStock, soldOut);
    renderApp('/');

    const available = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    const unavailable = screen.getByRole('article', { name: 'Porsche 911 Carrera' });

    expect(within(available).getByRole('button', { name: 'Purchase' })).toBeEnabled();
    expect(within(unavailable).getByRole('button', { name: 'Purchase' })).toBeDisabled();
  });

  it('shows a Sold out stock badge at 0', async () => {
    serveVehicles(inStock, soldOut);
    renderApp('/');

    const available = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    const unavailable = screen.getByRole('article', { name: 'Porsche 911 Carrera' });

    expect(badge(available, 'Stock')).toHaveTextContent('2');
    expect(badge(unavailable, 'Stock')).toHaveTextContent('Sold out');
  });

  it('Purchase calls the API and updates the stock shown', async () => {
    serveVehicles(inStock, soldOut);
    server.use(
      http.post('/api/vehicles/a1/purchase', () =>
        HttpResponse.json({ ...inStock, quantity: inStock.quantity - 1 }),
      ),
    );
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.click(within(card).getByRole('button', { name: 'Purchase' }));

    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('1'));
  });

  it('a successful purchase shows the UNIT ACQUIRED toast', async () => {
    serveVehicles(inStock);
    server.use(
      http.post('/api/vehicles/a1/purchase', () => HttpResponse.json({ ...inStock, quantity: 1 })),
    );
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.click(within(card).getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByRole('status')).toHaveTextContent('UNIT ACQUIRED');
  });

  it('a 409 on purchase shows the OUT OF STOCK toast and refreshes the card', async () => {
    // The page loaded while 2 were left; someone else bought them before this click.
    let loads = 0;
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json([++loads === 1 ? inStock : { ...inStock, quantity: 0 }]),
      ),
      http.post('/api/vehicles/a1/purchase', () =>
        HttpResponse.json(
          { error: { code: 'OUT_OF_STOCK', message: 'Out of stock' } },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.click(within(card).getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('OUT OF STOCK');
    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('Sold out'));
    expect(within(card).getByRole('button', { name: 'Purchase' })).toBeDisabled();
  });

  it('disables Purchase while its request is in flight', async () => {
    serveVehicles(inStock);
    let respond = () => {};
    const responded = new Promise<void>((resolve) => (respond = resolve));
    server.use(
      http.post('/api/vehicles/a1/purchase', async () => {
        await responded;
        return HttpResponse.json({ ...inStock, quantity: 1 });
      }),
    );
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    const button = within(card).getByRole('button', { name: 'Purchase' });

    await user.click(button);

    expect(button).toBeDisabled();
    respond();
    await waitFor(() => expect(badge(card, 'Stock')).toHaveTextContent('1'));
    expect(button).toBeEnabled();
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
    server.use(http.post('/api/vehicles/a1/purchase', resolver));
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.click(within(card).getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(within(card).getByRole('button', { name: 'Purchase' })).toBeEnabled();
  });

  describe('toast timing', () => {
    // shouldAdvanceTime keeps real time flowing too, so MSW and user-event still work.
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it('the success toast dismisses itself after about 4 seconds', async () => {
      serveVehicles(inStock);
      server.use(
        http.post('/api/vehicles/a1/purchase', () =>
          HttpResponse.json({ ...inStock, quantity: 1 }),
        ),
      );
      const { user } = renderApp('/');
      const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
      await user.click(within(card).getByRole('button', { name: 'Purchase' }));
      const toast = await screen.findByRole('status');

      act(() => vi.advanceTimersByTime(3500));
      expect(toast).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1000));
      expect(toast).not.toBeInTheDocument();
    });

    it('the load-error toast with Retry stays', async () => {
      server.use(
        http.get('/api/vehicles', () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
            { status: 500 },
          ),
        ),
      );
      renderApp('/');
      const toast = await screen.findByRole('alert');

      act(() => vi.advanceTimersByTime(30_000));

      expect(toast).toBeInTheDocument();
    });
  });

  it.each([
    [1, 'Only 1 left'],
    [3, 'Only 3 left'],
    [4, null],
    [0, null],
  ])('a stock of %i shows the low-stock badge: %s', async (quantity, label) => {
    serveVehicles({ ...inStock, quantity });
    renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    if (label) expect(within(card).getByText(label)).toBeInTheDocument();
    else expect(within(card).queryByText(/only \d+ left/i)).not.toBeInTheDocument();
  });

  it('a purchase error toast closes with its close button', async () => {
    serveVehicles(inStock);
    server.use(
      http.post('/api/vehicles/a1/purchase', () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
          { status: 404 },
        ),
      ),
    );
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    await user.click(within(card).getByRole('button', { name: 'Purchase' }));
    const toast = await screen.findByRole('alert');

    await user.click(within(toast).getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('the load-error toast closes too, without going back to loading', async () => {
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
          { status: 500 },
        ),
      ),
    );
    const { user } = renderApp('/');
    const toast = await screen.findByRole('alert');

    await user.click(within(toast).getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
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
      http.post('/api/vehicles/a1/purchase', () =>
        HttpResponse.json(
          { error: { code: 'OUT_OF_STOCK', message: 'Out of stock' } },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.click(within(card).getByRole('button', { name: 'Purchase' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong'),
    );
  });
});
