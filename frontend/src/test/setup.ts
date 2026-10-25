import '@testing-library/jest-dom/vitest';
import { server } from './server';

// Any request without a handler fails the test, so a missing mock can't silently pass.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  // The session lives in localStorage; clear it so no test starts logged in by accident.
  localStorage.clear();
});
afterAll(() => server.close());
