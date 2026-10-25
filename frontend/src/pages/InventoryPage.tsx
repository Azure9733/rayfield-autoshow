import { useEffect, useState } from 'react';
import { listVehicles, type Vehicle } from '../api/vehicles';
import { VehicleCard } from '../components/VehicleCard';

/** `/`: the vehicle inventory. */
export function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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
      </div>
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </main>
    </>
  );
}
