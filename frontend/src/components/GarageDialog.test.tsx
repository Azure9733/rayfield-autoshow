import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { Purchase } from '../api/purchases';
import { badge, loginAs } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: '3f6c1e0a-8b2d-4c7e-9a51-6d0f2b7c4e11',
    vehicleId: 'a1',
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2024,
    category: 'SUV',
    price: 125000,
    // Noon UTC is 25 Oct in every timezone from UTC-11 to UTC+11, so the date part is stable.
    purchasedAt: '2026-10-25T12:00:00.000Z',
    ...overrides,
  };
}

function serveGarage(...purchases: Purchase[]) {
  server.use(http.get('/api/purchases/me', () => HttpResponse.json(purchases)));
}

/** Opens My Garage from the desktop nav and returns the dialog. */
async function openGarage(user: UserEvent) {
  const nav = screen.getByRole('navigation', { name: 'Main' });
  await user.click(within(nav).getByRole('button', { name: 'My Garage' }));
  return screen.getByRole('dialog', { name: 'My Garage' });
}

describe('my garage', () => {
  beforeEach(() => loginAs('user'));

  it('lists each purchase with make, model, year, category, price, date and order id', async () => {
    // The same car bought twice is two rows.
    const later = makePurchase({ id: 'b7e4d2c9-1a3f-4e6b-8d20-5c9f7a1e3b44' });
    const earlier = makePurchase({ purchasedAt: '2026-10-24T12:00:00.000Z' });
    serveGarage(later, earlier);
    const { user } = renderApp('/');

    const dialog = await openGarage(user);

    const rows = await within(dialog).findAllByRole('listitem');
    expect(rows).toHaveLength(2);
    const [first, second] = rows;
    expect(within(first).getByText('Toyota Land Cruiser')).toBeInTheDocument();
    expect(within(first).getByText('2024')).toBeInTheDocument();
    expect(badge(first, 'Category')).toHaveTextContent('SUV');
    expect(within(first).getByText('$125,000.00')).toBeInTheDocument();
    expect(within(first).getByText(/^25 Oct 2026, \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(badge(first, 'Order ID')).toHaveTextContent(later.id);
    expect(within(second).getByText(/^24 Oct 2026, \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(badge(second, 'Order ID')).toHaveTextContent(earlier.id);
  });

  it('shows skeleton rows while loading', async () => {
    let respond = () => {};
    const responded = new Promise<void>((resolve) => (respond = resolve));
    server.use(
      http.get('/api/purchases/me', async () => {
        await responded;
        return HttpResponse.json([makePurchase()]);
      }),
    );
    const { user } = renderApp('/');

    const dialog = await openGarage(user);

    expect(within(dialog).getAllByTestId('garage-skeleton')).not.toHaveLength(0);
    respond();
    expect(await within(dialog).findByRole('listitem')).toBeInTheDocument();
    expect(within(dialog).queryByTestId('garage-skeleton')).not.toBeInTheDocument();
  });

  it('shows ///GARAGE.EMPTY when there are no purchases', async () => {
    serveGarage();
    const { user } = renderApp('/');

    const dialog = await openGarage(user);

    expect(await within(dialog).findByText('///GARAGE.EMPTY')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Your purchased vehicles will appear here.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows the error with Retry, which loads again', async () => {
    let calls = 0;
    server.use(
      http.get('/api/purchases/me', () =>
        ++calls === 1
          ? HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
              { status: 500 },
            )
          : HttpResponse.json([makePurchase()]),
      ),
    );
    const { user } = renderApp('/');
    const dialog = await openGarage(user);

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Something went wrong');

    await user.click(within(dialog).getByRole('button', { name: 'Retry' }));

    expect(await within(dialog).findByRole('listitem')).toBeInTheDocument();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('starts with focus on ×; ×, Escape and the backdrop each close it', async () => {
    serveGarage(makePurchase());
    const { user } = renderApp('/');

    const dialog = await openGarage(user);
    const close = within(dialog).getByRole('button', { name: 'Close' });
    expect(close).toHaveFocus();
    await user.click(close);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openGarage(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openGarage(user);
    await user.click(screen.getByTestId('dialog-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('from the mobile menu: tapping My Garage closes the menu and opens the garage', async () => {
    serveGarage(makePurchase());
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = screen.getByRole('navigation', { name: 'Mobile' });

    await user.click(within(menu).getByRole('button', { name: 'My Garage' }));

    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'My Garage' })).toBeInTheDocument();
  });
});
