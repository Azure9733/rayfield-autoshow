import type { Database } from '../../db/client';
import { vehicles } from '../../db/schema';

export type VehicleRow = typeof vehicles.$inferSelect;

/** All SQL for the vehicles table lives behind this interface, so tests can swap in a fake. */
export interface VehiclesRepository {
  list(): Promise<VehicleRow[]>;
}

/** Postgres-backed implementation of {@link VehiclesRepository}. */
export function createVehiclesRepository(db: Database): VehiclesRepository {
  return {
    list() {
      return db.select().from(vehicles);
    },
  };
}
