import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Drizzle table definitions. Each table and column is added in the TDD cycle whose first
// test needs it (PLAN.md §4). Column names come from the keys via snake_case casing.

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    passwordHash: text().notNull(),
    role: text({ enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // The DB enforces the role list too, so a bad role can't slip in through raw SQL or a seed.
  (t) => [check('users_role_check', sql`${t.role} in ('user', 'admin')`)],
);
