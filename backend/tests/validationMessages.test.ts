import request from 'supertest';
import { createApp } from '../src/app';
import { authHeader } from './helpers/auth';

const user = { name: 'Ann Driver', email: 'ann@example.com', password: 'supersecret' };
const vehicle = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2024,
  category: 'SEDAN',
  price: 25000,
  quantity: 3,
};
const anyId = '00000000-0000-4000-8000-000000000000';

const register = (body: object) =>
  request(createApp())
    .post('/api/auth/register')
    .send({ ...user, ...body });
const login = (body: object) => request(createApp()).post('/api/auth/login').send(body);
const createVehicle = (body: object) =>
  request(createApp())
    .post('/api/vehicles')
    .set('Authorization', authHeader('admin'))
    .send({ ...vehicle, ...body });
const search = (query: Record<string, string>) =>
  request(createApp()).get('/api/vehicles/search').query(query).set('Authorization', authHeader());
const restock = (body: object) =>
  request(createApp())
    .post(`/api/vehicles/${anyId}/restock`)
    .set('Authorization', authHeader('admin'))
    .send(body);

// One row per validated field: the message the UI shows under that field. Each field uses a
// single message for every way it can be wrong (missing, wrong type, out of range).
it.each([
  ['register name', () => register({ name: '' }), 'name', 'Name must be 1–60 characters'],
  ['register email', () => register({ email: 'nope' }), 'email', 'Enter a valid email address'],
  [
    'register password',
    () => register({ password: 'short' }),
    'password',
    'Password must be at least 8 characters (and at most 72 bytes)',
  ],
  ['login email', () => login({ password: 'x' }), 'email', 'Email is required'],
  ['login password', () => login({ email: 'ann@example.com' }), 'password', 'Password is required'],
  ['vehicle make', () => createVehicle({ make: ' ' }), 'make', 'Make must be 1–50 characters'],
  [
    'vehicle model',
    () => createVehicle({ model: 'a'.repeat(51) }),
    'model',
    'Model must be 1–50 characters',
  ],
  [
    'vehicle year',
    () => createVehicle({ year: 1899 }),
    'year',
    'Year must be a whole number from 1900 to next year',
  ],
  [
    'vehicle category',
    () => createVehicle({ category: 'BOAT' }),
    'category',
    'Category must be one of: SEDAN, SUV, HATCHBACK, COUPE, CONVERTIBLE, TRUCK, VAN',
  ],
  [
    'vehicle price',
    () => createVehicle({ price: 0 }),
    'price',
    'Price must be more than 0 and at most 100,000,000, with up to 2 decimals',
  ],
  [
    'vehicle quantity',
    () => createVehicle({ quantity: -1 }),
    'quantity',
    'Quantity must be a whole number from 0 to 10,000',
  ],
  [
    'vehicle imageUrl',
    () => createVehicle({ imageUrl: 'http://example.com/car.jpg' }),
    'imageUrl',
    'Image URL must be a valid https:// address',
  ],
  [
    'search category',
    () => search({ category: 'BOAT' }),
    'category',
    'Category must be one of: SEDAN, SUV, HATCHBACK, COUPE, CONVERTIBLE, TRUCK, VAN',
  ],
  [
    'search price',
    () => search({ minPrice: 'abc' }),
    'minPrice',
    'Price filters must be numbers of 0 or more',
  ],
  [
    'restock quantity',
    () => restock({ quantity: 0 }),
    'quantity',
    'Restock quantity must be a whole number from 1 to 10,000',
  ],
])('%s has a plain-English validation message', async (_case, send, field, message) => {
  const res = await send();

  expect(res.status).toBe(400);
  expect(res.body.error.details).toEqual([{ field, message }]);
});
