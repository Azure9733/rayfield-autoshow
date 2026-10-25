import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { inStock, loginAs, serveVehicles, soldOut } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

describe('search panel', () => {
  beforeEach(() => loginAs('user'));

  it('submits only the filled params', async () => {
    serveVehicles(inStock, soldOut);
    let params: Record<string, string> | undefined;
    server.use(
      http.get('/api/vehicles/search', ({ request }) => {
        params = Object.fromEntries(new URL(request.url).searchParams);
        return HttpResponse.json([inStock]);
      }),
    );
    const { user } = renderApp('/');
    await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.type(screen.getByLabelText('Make'), 'toy');
    await user.type(screen.getByLabelText('Model'), '   ');
    await user.selectOptions(screen.getByLabelText('Category'), 'SUV');
    await user.type(screen.getByLabelText('Max price'), '200000');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() =>
      expect(params).toEqual({ make: 'toy', category: 'SUV', maxPrice: '200000' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: 'Porsche 911 Carrera' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('"In stock only" hides sold-out vehicles without a new request', async () => {
    serveVehicles(inStock, soldOut);
    let searched = false;
    server.use(
      http.get('/api/vehicles/search', () => {
        searched = true;
        return HttpResponse.json([]);
      }),
    );
    const { user } = renderApp('/');
    await screen.findByRole('article', { name: 'Porsche 911 Carrera' });

    await user.click(screen.getByLabelText('In stock only'));

    expect(screen.queryByRole('article', { name: 'Porsche 911 Carrera' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(searched).toBe(false);
  });
});
