import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/db/client';
import { authHeader } from '../helpers/auth';
import { createVehicle } from '../helpers/vehicles';

function deleteVehicle(id: string, role: 'admin' | 'user' = 'admin') {
  return request(createApp()).delete(`/api/vehicles/${id}`).set('Authorization', authHeader(role));
}

async function vehicleExists(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('select 1 from vehicles where id = $1', [id]);
  return rowCount === 1;
}

describe('DELETE /api/vehicles/:id', () => {
  it('deletes the vehicle for an admin and returns 204 with no body', async () => {
    const { id } = await createVehicle();

    const res = await deleteVehicle(id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await vehicleExists(id)).toBe(false);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await deleteVehicle('00000000-0000-4000-8000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for a malformed id', async () => {
    const res = await deleteVehicle('not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'id', message: expect.any(String) }]);
  });
});
