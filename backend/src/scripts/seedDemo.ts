import { db, pool } from '../db/client';
import {
  createVehiclesRepository,
  type NewVehicle,
  type VehiclesRepository,
} from '../modules/vehicles/vehicles.repository';

/**
 * Sample inventory for local development, screenshots and the live demo. Includes sold-out
 * (quantity 0) and low-stock (1–3) vehicles so every card state is visible.
 */
export const DEMO_VEHICLES: NewVehicle[] = [
  { make: 'Toyota', model: 'Corolla', year: 2024, category: 'SEDAN', price: 24500, quantity: 6 },
  { make: 'Honda', model: 'Civic', year: 2024, category: 'HATCHBACK', price: 26900, quantity: 4 },
  { make: 'Ford', model: 'Ranger', year: 2023, category: 'TRUCK', price: 38999.99, quantity: 2 },
  { make: 'Tesla', model: 'Model Y', year: 2025, category: 'SUV', price: 47490, quantity: 3 },
  { make: 'BMW', model: 'M4', year: 2024, category: 'COUPE', price: 79100, quantity: 1 },
  {
    make: 'Mazda',
    model: 'MX-5 Miata',
    year: 2024,
    category: 'CONVERTIBLE',
    price: 30170,
    quantity: 0,
  },
  { make: 'Toyota', model: 'Sienna', year: 2025, category: 'VAN', price: 39185, quantity: 5 },
  {
    make: 'Porsche',
    model: '911 Carrera',
    year: 2025,
    category: 'COUPE',
    price: 120000,
    quantity: 0,
  },
  { make: 'Jeep', model: 'Wrangler', year: 2024, category: 'SUV', price: 33895, quantity: 7 },
  { make: 'Hyundai', model: 'Ioniq 5', year: 2025, category: 'SUV', price: 42600, quantity: 2 },
  {
    make: 'Chevrolet',
    model: 'Silverado 1500',
    year: 2024,
    category: 'TRUCK',
    price: 41500,
    quantity: 3,
  },
];

/** Replaces the whole inventory with DEMO_VEHICLES; safe to re-run (resets the demo). */
export async function seedDemo(
  vehicles: VehiclesRepository = createVehiclesRepository(db),
): Promise<void> {
  await vehicles.replaceAll(DEMO_VEHICLES);
}

// CLI: `npm run db:seed:demo`.
/* istanbul ignore next -- CLI entry point; the exported function above is what tests cover */
if (require.main === module) {
  seedDemo()
    .then(() => console.info(`Demo inventory reset: ${DEMO_VEHICLES.length} vehicles`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
