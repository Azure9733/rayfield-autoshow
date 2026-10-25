import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { api } from './client';
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
});
