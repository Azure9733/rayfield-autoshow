import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

/** Exposes the in-memory URL (path + query) to tests via data-testid="location". */
function LocationProbe() {
  const { pathname, search } = useLocation();
  return (
    <output data-testid="location" hidden>
      {pathname + search}
    </output>
  );
}

/** Renders the whole app at `path`, wired like main.tsx but with an in-memory router. */
export function renderApp(path = '/') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
  return { user };
}
