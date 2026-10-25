import { desc } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { vehicles } from '../../db/schema';

type VehicleRow = typeof vehicles.$inferSelect;

/** A vehicle as the rest of the app sees it: price is a number, not numeric's string. */
export type Vehicle = Omit<VehicleRow, 'price'> & { price: number };

/** All SQL for the vehicles table lives behind this interface, so tests can swap in a fake. */
export interface VehiclesRepository {
  list(): Promise<Vehicle[]>;
}

/** Postgres-backed implementation of {@link VehiclesRepository}. */
export function createVehiclesRepository(db: Database): VehiclesRepository {
  return {
    async list() {
      const rows = await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
      return rows.map(toVehicle);
    },
  };
}

// numeric(12,2) holds at most 10 integer digits, well inside a double's exact range.
function toVehicle(row: VehicleRow): Vehicle {
  return { ...row, price: Number(row.price) };
}
