import { pool } from '../../src/db/client';

export interface PurchaseSeed {
  vehicleId?: string | null;
  make?: string;
  model?: string;
  year?: number;
  category?: string;
  price?: number;
  /** Set explicitly in ordering tests: rows inserted together can share a timestamp. */
  createdAt?: Date;
}

/** Inserts a purchase row for `userId` with raw SQL, bypassing the app. Returns its id. */
export async function createPurchase(
  userId: string,
  seed: PurchaseSeed = {},
): Promise<{ id: string }> {
  const p = {
    vehicleId: null,
    make: 'Toyota',
    model: 'Corolla',
    year: 2024,
    category: 'SEDAN',
    price: 25000,
    createdAt: new Date(),
    ...seed,
  };
  const { rows } = await pool.query<{ id: string }>(
    `insert into purchases (user_id, vehicle_id, make, model, year, category, price, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [userId, p.vehicleId, p.make, p.model, p.year, p.category, p.price, p.createdAt],
  );
  return rows[0];
}
