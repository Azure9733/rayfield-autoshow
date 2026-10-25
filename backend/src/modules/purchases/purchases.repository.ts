import { eq } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { purchases } from '../../db/schema';
import type { Category } from '../vehicles/categories';

type PurchaseRow = typeof purchases.$inferSelect;

/** A purchase as the API returns it: the snapshot taken at purchase time, price as a number. */
export interface Purchase {
  id: string;
  /** null once the vehicle has been deleted; the snapshot still says what was bought. */
  vehicleId: string | null;
  make: string;
  model: string;
  year: number;
  category: Category;
  price: number;
  purchasedAt: Date;
}

/** All SQL for the purchases table. Recording a purchase lives in the vehicles repository,
 * inside the same transaction as the stock decrement. */
export interface PurchasesRepository {
  /** The purchases made by `userId`. */
  listForUser(userId: string): Promise<Purchase[]>;
}

/** Postgres-backed implementation of {@link PurchasesRepository}. */
export function createPurchasesRepository(db: Database): PurchasesRepository {
  return {
    async listForUser(userId) {
      const rows = await db.select().from(purchases).where(eq(purchases.userId, userId));
      return rows.map(toPurchase);
    },
  };
}

// numeric(12,2) comes back from pg as a string; the API always returns a number.
function toPurchase(row: PurchaseRow): Purchase {
  const { id, vehicleId, make, model, year, category, price, createdAt } = row;
  return {
    id,
    vehicleId,
    make,
    model,
    year,
    category,
    price: Number(price),
    purchasedAt: createdAt,
  };
}
