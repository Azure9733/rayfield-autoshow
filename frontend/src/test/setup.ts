import '@testing-library/jest-dom/vitest';
import { server } from './server';

// Any request without a handler fails the test, so a missing mock can't silently pass.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
