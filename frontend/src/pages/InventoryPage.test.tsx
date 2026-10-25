import { act, fireEvent, screen, within } from '@testing-library/react';
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

  it('shows only skeleton cards while loading (no module strip)', async () => {
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
    // The skeletons are the whole loading state: no ///INVENTORY.MODULE strip or "loading..."
    // text. The page keeps its (screen-reader-only) Inventory heading.
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.queryByText('///INVENTORY.MODULE')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument();

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

  describe('toast timing', () => {
    // shouldAdvanceTime keeps real time flowing too, so MSW and user-event still work.
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

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

  it('a card image loads lazily and falls back to the category icon if it fails', async () => {
    serveVehicles({ ...inStock, imageUrl: 'https://cdn.example.com/missing.jpg' });
    renderApp('/');
    const card = await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    const image = within(card).getByRole('img', { name: 'Toyota Land Cruiser' });
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(within(card).queryByTestId('category-icon')).not.toBeInTheDocument();

    fireEvent.error(image);

    expect(
      within(card).queryByRole('img', { name: 'Toyota Land Cruiser' }),
    ).not.toBeInTheDocument();
    expect(within(card).getByTestId('category-icon')).toBeInTheDocument();
  });
});
