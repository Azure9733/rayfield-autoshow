import { and, desc, eq, gt, gte, ilike, lte, sql } from 'drizzle-orm';
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

/** The editable fields a PUT replaces; stock only changes through purchase / restock. */
export type VehicleUpdate = Omit<NewVehicle, 'quantity'>;

/** Search filters; every filter is optional and they combine with AND. */
export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: Category;
  /** Inclusive. */
  minPrice?: number;
  /** Inclusive. */
  maxPrice?: number;
}

/** All SQL for the vehicles table lives behind this interface, so tests can swap in a fake. */
export interface VehiclesRepository {
  /** Vehicles matching the filters, newest first; `{}` returns every vehicle. */
  search(filters: VehicleFilters): Promise<Vehicle[]>;
  create(input: NewVehicle): Promise<Vehicle>;
  /** The updated vehicle, or undefined if no vehicle has that id. */
  update(id: string, input: VehicleUpdate): Promise<Vehicle | undefined>;
  /** True if a vehicle was deleted, false if no vehicle has that id. */
  remove(id: string): Promise<boolean>;
  /**
   * Atomically takes one unit out of stock. Returns the updated vehicle, or undefined when
   * nothing was sold (unknown id, or quantity already 0).
   */
  purchaseOne(id: string): Promise<Vehicle | undefined>;
}

/** Postgres-backed implementation of {@link VehiclesRepository}. */
export function createVehiclesRepository(db: Database): VehiclesRepository {
  return {
    async search({ make, model, category, minPrice, maxPrice }) {
      // Each filter adds a condition; and() of the defined ones, ignoring undefined.
      const where = and(
        make === undefined ? undefined : ilike(vehicles.make, contains(make)),
        model === undefined ? undefined : ilike(vehicles.model, contains(model)),
        category === undefined ? undefined : eq(vehicles.category, category),
        minPrice === undefined ? undefined : gte(vehicles.price, String(minPrice)),
        maxPrice === undefined ? undefined : lte(vehicles.price, String(maxPrice)),
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

    async update(id, input) {
      const [row] = await db
        .update(vehicles)
        // A PUT replaces the whole record: an omitted imageUrl must become NULL, but set()
        // skips undefined fields, so map it explicitly.
        .set({
          ...input,
          price: String(input.price),
          imageUrl: input.imageUrl ?? null,
          updatedAt: sql`now()`,
        })
        .where(eq(vehicles.id, id))
        .returning();
      return row && toVehicle(row);
    },

    async remove(id) {
      const deleted = await db
        .delete(vehicles)
        .where(eq(vehicles.id, id))
        .returning({ id: vehicles.id });
      return deleted.length > 0;
    },

    async purchaseOne(id) {
      // One conditional UPDATE: Postgres row-locks it, so concurrent purchases can't both take
      // the last unit (no read-then-write race).
      const [row] = await db
        .update(vehicles)
        .set({ quantity: sql`${vehicles.quantity} - 1` })
        .where(and(eq(vehicles.id, id), gt(vehicles.quantity, 0)))
        .returning();
      return row && toVehicle(row);
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
