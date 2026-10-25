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
});
