import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './server';

// Smoke test for the test setup itself: jsdom + Testing Library + jest-dom matchers + MSW.
describe('test setup', () => {
  it('renders into jsdom and intercepts relative /api requests with MSW', async () => {
    server.use(http.get('/api/health', () => HttpResponse.json({ status: 'ok' })));

    render(<button disabled>Purchase</button>);
    const body = await (await fetch('/api/health')).json();

    expect(screen.getByRole('button', { name: 'Purchase' })).toBeDisabled();
    expect(body).toEqual({ status: 'ok' });
  });
});
