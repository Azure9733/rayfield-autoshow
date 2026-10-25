import { useEffect, useState } from 'react';
import { listVehicles, type Vehicle } from '../api/vehicles';
import { SkeletonCard } from '../components/SkeletonCard';
import { VehicleCard } from '../components/VehicleCard';

/** `/`: the vehicle inventory. */
export function InventoryPage() {
  // null until the first response arrives: that's the loading state.
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);

  useEffect(() => {
    // Ignore a response that lands after unmount (or StrictMode's dev re-run).
    let active = true;
    listVehicles()
      .then((list) => {
        if (active) setVehicles(list);
      })
      // Placeholder until the error state (UI_PLAN.md §10, "API error shows the red toast").
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="module-strip">
        <h1 className="sr-only">Inventory</h1>
        <span aria-hidden="true">///INVENTORY.MODULE</span>
        {vehicles === null && (
          <span>
            loading<span className="animate-blink">...</span>
          </span>
        )}
      </div>
      <main className="flex-1 px-4 md:px-8 py-8">
        {vehicles?.length === 0 && (
          <div className="cyber-panel mx-auto max-w-xl p-10 text-center">
            <p className="glitch text-3xl" data-text="///NO.UNITS.IN.STOCK">
              ///NO.UNITS.IN.STOCK
            </p>
          </div>
        )}
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-busy={vehicles === null}
        >
          {vehicles === null
            ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
            : vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
        </div>
      </main>
    </>
  );
}
