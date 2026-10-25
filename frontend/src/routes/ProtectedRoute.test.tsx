import { screen } from '@testing-library/react';
import { renderApp } from '../test/renderApp';

describe('protected route', () => {
  it('redirects a guest to /login', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inventory' })).not.toBeInTheDocument();
  });

  it('treats a corrupt stored session as logged out instead of crashing', async () => {
    localStorage.setItem('rayfield.session', '{not json');

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(localStorage.getItem('rayfield.session')).toBeNull();
  });
});
