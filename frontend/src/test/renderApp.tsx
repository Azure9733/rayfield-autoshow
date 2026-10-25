import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

/** Renders the whole app at `path`, wired like main.tsx but with an in-memory router. */
export function renderApp(path = '/') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { user };
}
