import { screen } from '@testing-library/react';
import { loginAs } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

describe('not found page', () => {
  it('unknown routes show ///SIGNAL.LOST with a link home', async () => {
    loginAs('user');
    const { user } = renderApp('/no/such/page');

    expect(screen.getByRole('heading', { name: '///SIGNAL.LOST' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Back to inventory' }));

    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
  });
});
