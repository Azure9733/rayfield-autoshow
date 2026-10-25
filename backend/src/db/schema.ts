import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { CATEGORIES } from '../modules/vehicles/categories';

// Drizzle table definitions. Each table and column is added in the TDD cycle whose first
// test needs it (PLAN.md §4). Column names come from the keys via snake_case casing.

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    passwordHash: text().notNull(),
    role: text({ enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // The DB enforces the role list too, so a bad role can't slip in through raw SQL or a seed.
  (t) => [check('users_role_check', sql`${t.role} in ('user', 'admin')`)],
);

const categoryList = sql.raw(CATEGORIES.map((c) => `'${c}'`).join(', '));

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid().primaryKey().defaultRandom(),
    make: text().notNull(),
    model: text().notNull(),
    year: integer().notNull(),
    category: text({ enum: CATEGORIES }).notNull(),
    // Exact decimal for money; node-postgres returns numeric as a string, so the
    // repository converts it to a number.
    price: numeric({ precision: 12, scale: 2 }).notNull(),
    quantity: integer().notNull().default(0),
    imageUrl: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // DB-level guards mirror the API rules (PLAN.md §2), so seeds and raw SQL can't break them.
  (t) => [
    check('vehicles_category_check', sql`${t.category} in (${categoryList})`),
    check('vehicles_price_check', sql`${t.price} > 0`),
    check('vehicles_quantity_check', sql`${t.quantity} >= 0`),
  ],
);

/**
 * One row per unit bought, for "My Garage". Make, model, year, category and price are copied
 * at purchase time, so the history stays right after the vehicle is edited or deleted.
 */
export const purchases = pgTable(
  'purchases',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Kept as null when the vehicle is deleted: the snapshot still says what was bought.
    vehicleId: uuid().references(() => vehicles.id, { onDelete: 'set null' }),
    make: text().notNull(),
    model: text().notNull(),
    year: integer().notNull(),
    category: text({ enum: CATEGORIES }).notNull(),
    // What was paid (the vehicle's price at the time).
    price: numeric({ precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('purchases_user_id_idx').on(t.userId)],
  // Supabase exposes public tables through its Data API; RLS with no policies closes that
  // (the backend connects as the owner and isn't affected).
).enableRLS();
