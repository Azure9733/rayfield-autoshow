import { pool } from '../../src/db/client';

export interface VehicleSeed {
  make?: string;
  model?: string;
  year?: number;
  category?: string;
  price?: number;
  quantity?: number;
  imageUrl?: string | null;
  /** Set explicitly in ordering tests: rows inserted together can share a timestamp. */
  createdAt?: Date;
}

/**
 * Inserts a vehicle with raw SQL, bypassing the app, so tests can set up data (including
 * createdAt) without depending on the code under test. Returns the generated id.
 */
export async function createVehicle(seed: VehicleSeed = {}): Promise<{ id: string }> {
  const v = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    category: 'SEDAN',
    price: 25000,
    quantity: 3,
    imageUrl: null,
    createdAt: new Date(),
    ...seed,
  };
  const { rows } = await pool.query<{ id: string }>(
    `insert into vehicles (make, model, year, category, price, quantity, image_url, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     returning id`,
    [v.make, v.model, v.year, v.category, v.price, v.quantity, v.imageUrl, v.createdAt],
  );
  return rows[0];
}
