import { setupServer } from 'msw/node';

/**
 * Mock API for component tests. Starts with no handlers: each test declares the responses it
 * needs with `server.use(http.get('/api/...', ...))`, so tests never hit a real backend.
 */
export const server = setupServer();
