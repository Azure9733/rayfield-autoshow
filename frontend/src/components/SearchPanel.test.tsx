import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { inStock, loginAs, serveVehicles, soldOut } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

const searchBar = () => screen.getByRole('searchbox', { name: 'Make or model' });

async function openFilters(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Filters' }));
}

describe('search panel', () => {
  beforeEach(() => loginAs('user'));

  it('typing in the search bar loads matching vehicles, debounced to one request', async () => {
    serveVehicles(inStock, soldOut);
    const requests: Record<string, string>[] = [];
    server.use(
      http.get('/api/vehicles/search', ({ request }) => {
        requests.push(Object.fromEntries(new URL(request.url).searchParams));
        return HttpResponse.json([inStock]);
      }),
    );
    const { user } = renderApp('/');
    await screen.findByRole('article', { name: 'Porsche 911 Carrera' });

    await user.type(screen.getByRole('searchbox', { name: 'Make or model' }), 'cruis');

    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: 'Porsche 911 Carrera' }),
      ).not.toBeInTheDocument(),
    );
    // Without the debounce there'd be one request per keystroke ("c", "cr", …).
    expect(requests).toEqual([{ q: 'cruis' }]);
  });

  it('requests carry only the filled filters', async () => {
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

    await user.type(searchBar(), 'toy');
    await openFilters(user);
    await user.selectOptions(screen.getByLabelText('Category'), 'SUV');
    await user.type(screen.getByLabelText('Max price'), '200000');

    await waitFor(() => expect(params).toEqual({ q: 'toy', category: 'SUV', maxPrice: '200000' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: 'Porsche 911 Carrera' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('the Filters button shows and hides the other filters', async () => {
    serveVehicles(inStock);
    const { user } = renderApp('/');
    const filters = await screen.findByRole('button', { name: 'Filters' });
    expect(filters).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();

    await user.click(filters);

    expect(filters).toHaveAttribute('aria-expanded', 'true');
    for (const label of ['Category', 'Min price', 'Max price', 'In stock only']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }

    await user.click(filters);

    expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
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
    await openFilters(user);

    await user.click(screen.getByLabelText('In stock only'));

    expect(screen.queryByRole('article', { name: 'Porsche 911 Carrera' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(searched).toBe(false);
  });

  it('Clear resets the filters and the list', async () => {
    serveVehicles(inStock, soldOut);
    server.use(http.get('/api/vehicles/search', () => HttpResponse.json([soldOut])));
    const { user } = renderApp('/');
    await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    await user.type(searchBar(), 'por');
    await openFilters(user);
    await user.selectOptions(screen.getByLabelText('Category'), 'COUPE');
    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: 'Toyota Land Cruiser' }),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('In stock only'));

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(searchBar()).toHaveValue('');
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByLabelText('In stock only')).not.toBeChecked();
    expect(await screen.findByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Porsche 911 Carrera' })).toBeInTheDocument();
  });

  it('no results show ///NO.MATCH with a clear-filters button', async () => {
    serveVehicles(inStock, soldOut);
    server.use(http.get('/api/vehicles/search', () => HttpResponse.json([])));
    const { user } = renderApp('/');
    await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
    await user.type(searchBar(), 'zzz');

    expect(await screen.findByText('///NO.MATCH')).toBeInTheDocument();
    expect(screen.queryByText('///NO.UNITS.IN.STOCK')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(searchBar()).toHaveValue('');
  });

  it('a URL with filters restores them', async () => {
    serveVehicles(inStock, soldOut);
    let params: Record<string, string> | undefined;
    server.use(
      http.get('/api/vehicles/search', ({ request }) => {
        params = Object.fromEntries(new URL(request.url).searchParams);
        return HttpResponse.json([inStock, soldOut]);
      }),
    );

    renderApp('/?q=a&category=SUV&inStock=1');

    expect(await screen.findByRole('article', { name: 'Toyota Land Cruiser' })).toBeInTheDocument();
    expect(params).toEqual({ q: 'a', category: 'SUV' });
    expect(searchBar()).toHaveValue('a');
    // Hidden filters that are active open the Filters panel, so they're visible.
    expect(screen.getByLabelText('Category')).toHaveValue('SUV');
    expect(screen.getByLabelText('In stock only')).toBeChecked();
    expect(screen.queryByRole('article', { name: 'Porsche 911 Carrera' })).not.toBeInTheDocument();
  });

  it('changing the filters updates the URL', async () => {
    serveVehicles(inStock);
    server.use(http.get('/api/vehicles/search', () => HttpResponse.json([inStock])));
    const { user } = renderApp('/');
    await screen.findByRole('article', { name: 'Toyota Land Cruiser' });

    await user.type(searchBar(), 'toy');
    await openFilters(user);
    await user.click(screen.getByLabelText('In stock only'));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/?q=toy&inStock=1'),
    );
  });
});
