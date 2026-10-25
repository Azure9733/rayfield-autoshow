import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Default: an empty inventory, so tests that merely pass through / (login, register, logout)
// don't hit an unhandled request. Tests override it with server.use().
export const server = setupServer(http.get('/api/vehicles', () => HttpResponse.json([])));
