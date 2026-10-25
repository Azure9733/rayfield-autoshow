import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { listVehicles, purchaseVehicle, type Vehicle } from '../api/vehicles';
import { SkeletonCard } from '../components/SkeletonCard';
import { Toast } from '../components/Toast';
import { VehicleCard } from '../components/VehicleCard';

/** `/`: the vehicle inventory. */
export function InventoryPage() {
  // null until a response arrives; with no error, that's the loading state.
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState('');
  // Feedback for the last purchase; the load error above has its own toast with Retry.
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  // Bumped by Retry to run the load effect again.
  const [attempt, setAttempt] = useState(0);
  const loading = vehicles === null && !error;

  useEffect(() => {
    // Ignore a response that lands after unmount (or StrictMode's dev re-run).
    let active = true;
    listVehicles()
      .then((list) => {
        if (active) setVehicles(list);
      })
      .catch((e: unknown) => {
        if (!(e instanceof ApiError)) throw e;
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  async function purchase(vehicle: Vehicle) {
    let updated: Vehicle;
    try {
      updated = await purchaseVehicle(vehicle.id);
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 409)) throw e;
      // Someone bought the last unit first: our list is stale, so reload it quietly.
      setNotice({ tone: 'error', message: 'OUT OF STOCK' });
      setVehicles(await listVehicles());
      return;
    }
    setVehicles((list) => list?.map((v) => (v.id === updated.id ? updated : v)) ?? null);
    setNotice({ tone: 'success', message: 'UNIT ACQUIRED' });
  }

  function retry() {
    setError('');
    setVehicles(null);
    setAttempt((n) => n + 1);
  }

  return (
    <>
      <div className="module-strip">
        <h1 className="sr-only">Inventory</h1>
        <span aria-hidden="true">///INVENTORY.MODULE</span>
        {loading && (
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
          aria-busy={loading}
        >
          {loading
            ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
            : vehicles?.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onPurchase={purchase} />
              ))}
        </div>
      </main>
      {notice && <Toast tone={notice.tone} message={notice.message} />}
      {error && <Toast tone="error" message={error} action={{ label: 'Retry', onClick: retry }} />}
    </>
  );
}
