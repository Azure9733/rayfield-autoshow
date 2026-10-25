import { and, desc, eq, ilike } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { vehicles } from '../../db/schema';
import type { Category } from './categories';

type VehicleRow = typeof vehicles.$inferSelect;

/** A vehicle as the rest of the app sees it: price is a number, not numeric's string. */
export type Vehicle = Omit<VehicleRow, 'price'> & { price: number };

export interface NewVehicle {
  make: string;
  model: string;
  year: number;
  category: Category;
  price: number;
  /** Initial stock; the column defaults to 0 when omitted. */
  quantity?: number;
  imageUrl?: string;
}

/** Search filters; every filter is optional and they combine with AND. */
export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: Category;
}

/** All SQL for the vehicles table lives behind this interface, so tests can swap in a fake. */
export interface VehiclesRepository {
  list(): Promise<Vehicle[]>;
  search(filters: VehicleFilters): Promise<Vehicle[]>;
  create(input: NewVehicle): Promise<Vehicle>;
}

/** Postgres-backed implementation of {@link VehiclesRepository}. */
export function createVehiclesRepository(db: Database): VehiclesRepository {
  return {
    async list() {
      const rows = await db
        .select()
        .from(vehicles)
        .orderBy(desc(vehicles.createdAt), desc(vehicles.id));
      return rows.map(toVehicle);
    },

    async search({ make, model, category }) {
      // Each filter adds a condition; and() of the defined ones, ignoring undefined.
      const where = and(
        make === undefined ? undefined : ilike(vehicles.make, contains(make)),
        model === undefined ? undefined : ilike(vehicles.model, contains(model)),
        category === undefined ? undefined : eq(vehicles.category, category),
      );
      const rows = await db
        .select()
        .from(vehicles)
        .where(where)
        .orderBy(desc(vehicles.createdAt), desc(vehicles.id));
      return rows.map(toVehicle);
    },

    async create(input) {
      const [row] = await db
        .insert(vehicles)
        .values({ ...input, price: String(input.price) })
        .returning();
      return toVehicle(row);
    },
  };
}

/**
 * A LIKE pattern matching `text` anywhere. Escapes \, % and _ (backslash is Postgres's default
 * LIKE escape) so user input is matched literally rather than as wildcards.
 */
function contains(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

// numeric(12,2) holds at most 10 integer digits, well inside a double's exact range.
function toVehicle(row: VehicleRow): Vehicle {
  return { ...row, price: Number(row.price) };
}
