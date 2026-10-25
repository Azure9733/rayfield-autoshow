import '@testing-library/jest-dom/vitest';
import { server } from './server';

// jsdom has no matchMedia. Tests run as if the user prefers reduced motion, so animated
// open/close steps finish at once; a test can stub it to `false` to exercise the motion path.
window.matchMedia = (query: string) =>
  ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// Any request without a handler fails the test, so a missing mock can't silently pass.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  // The session lives in localStorage; clear it so no test starts logged in by accident.
  localStorage.clear();
});
afterAll(() => server.close());
