import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { api, ApiError } from './client';
import { saveSession } from './session';

const user = { id: 'u1', name: 'Vik', email: 'vik@example.com', role: 'user' as const };

describe('api client', () => {
  it('attaches Authorization: Bearer <token> when logged in', async () => {
    let authorization: string | null = null;
    server.use(
      http.get('/api/vehicles', ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json([]);
      }),
    );
    saveSession({ token: 'abc.def.ghi', user });

    await api.get('/api/vehicles');

    expect(authorization).toBe('Bearer abc.def.ghi');
  });

  it('turns the error format into { code, message, details }', async () => {
    const details = [{ field: 'price', message: 'Price must be between $0.01 and $100,000,000' }];
    server.use(
      http.get('/api/vehicles', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } },
          { status: 400 },
        ),
      ),
    );

    await expect(api.get('/api/vehicles')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    });
  });

  it.each([
    // e.g. the dev proxy's HTML 502 page when the backend isn't running
    ['a non-JSON response', () => new HttpResponse('<h1>Bad Gateway</h1>', { status: 502 })],
    ['a network failure', () => HttpResponse.error()],
  ])('%s becomes an ApiError with a friendly message', async (_case, resolver) => {
    server.use(http.get('/api/vehicles', resolver));

    const error = await api.get('/api/vehicles').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Can't reach the server. Please try again." });
  });

  it.each([
    ['an empty object', {}],
    ['a different error shape', { message: 'Bad gateway' }],
    ['null', null],
  ])('a JSON error body that is %s still becomes an ApiError', async (_case, body) => {
    server.use(http.get('/api/vehicles', () => HttpResponse.json(body, { status: 502 })));

    const error = await api.get('/api/vehicles').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 502,
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.',
      details: [],
    });
  });
});
