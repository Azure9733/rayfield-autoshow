import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { loginAs, makeVehicle } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

/** The value next to a badge's label, e.g. badge(card, 'Stock') → the stock count element. */
function badge(card: HTMLElement, label: string) {
  return within(card).getByText(label).nextElementSibling;
}

function serveVehicles(...vehicles: ReturnType<typeof makeVehicle>[]) {
  server.use(http.get('/api/vehicles', () => HttpResponse.json(vehicles)));
}

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
});
