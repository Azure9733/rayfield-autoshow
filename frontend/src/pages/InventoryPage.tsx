import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import {
  createVehicle,
  deleteVehicle,
  EMPTY_FILTERS,
  filledFilters,
  listVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
  type SearchFilters,
  type Vehicle,
} from '../api/vehicles';
import { SearchPanel } from '../components/SearchPanel';
import { SkeletonCard } from '../components/SkeletonCard';
import { Toast } from '../components/Toast';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleFormModal } from '../components/VehicleFormModal';
import { toFormValues } from '../validation/vehicle';
import { useAuth } from '../context/AuthContext';

/** All vehicles, or the search results when any filter is filled. */
function fetchVehicles(query: SearchFilters) {
  return Object.keys(query).length > 0 ? searchVehicles(query) : listVehicles();
}

/** `/`: the vehicle inventory. */
export function InventoryPage() {
  // null until a response arrives; with no error, that's the loading state.
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState('');
  // Feedback for the last purchase; the load error above has its own toast with Retry.
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  // What's typed in the search panel, and the submitted search (filled filters only);
  // changing the query reloads the list.
  const [form, setForm] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState<SearchFilters>({});
  const [inStockOnly, setInStockOnly] = useState(false);
  const isAdmin = useAuth().user?.role === 'admin';
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  // Bumped by Retry to run the load effect again.
  const [attempt, setAttempt] = useState(0);
  const loading = vehicles === null && !error;
  const shown = inStockOnly ? vehicles?.filter((v) => v.quantity > 0) : vehicles;
  // An empty result means "no match" when filters are on, "empty inventory" otherwise.
  const filtering = inStockOnly || Object.keys(query).length > 0;

  useEffect(() => {
    // Ignore a response that lands after unmount (or StrictMode's dev re-run).
    let active = true;
    fetchVehicles(query)
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
  }, [attempt, query]);

  /** Swaps an updated vehicle (from purchase, edit, restock) into the list in place. */
  function replaceVehicle(updated: Vehicle) {
    setVehicles((list) => list?.map((v) => (v.id === updated.id ? updated : v)) ?? null);
  }

  async function remove(vehicle: Vehicle) {
    await deleteVehicle(vehicle.id);
    setVehicles((list) => list?.filter((v) => v.id !== vehicle.id) ?? null);
  }

  async function restock(vehicle: Vehicle, quantity: number) {
    replaceVehicle(await restockVehicle(vehicle.id, quantity));
  }

  async function purchase(vehicle: Vehicle) {
    let updated: Vehicle;
    try {
      updated = await purchaseVehicle(vehicle.id);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.status !== 409) {
        setNotice({ tone: 'error', message: e.message });
        return;
      }
      // Someone bought the last unit first: our list is stale, so reload it quietly.
      setNotice({ tone: 'error', message: 'OUT OF STOCK' });
      setVehicles(await fetchVehicles(query));
      return;
    }
    replaceVehicle(updated);
    setNotice({ tone: 'success', message: 'UNIT ACQUIRED' });
  }

  function search(filters: SearchFilters) {
    setError('');
    setVehicles(null);
    setQuery(filledFilters(filters));
  }

  function clearFilters() {
    setForm(EMPTY_FILTERS);
    setInStockOnly(false);
    search({});
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
      <main className="flex-1 gap-8 px-4 py-8 md:px-8 lg:grid lg:grid-cols-[17rem_1fr] lg:items-start">
        <SearchPanel
          values={form}
          onChange={setForm}
          onSearch={() => search(form)}
          onClear={clearFilters}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={setInStockOnly}
        />
        <div className="mt-8 lg:mt-0">
          {isAdmin && (
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                className="btn-cyber"
                data-text="Add vehicle"
                onClick={() => setAdding(true)}
              >
                Add vehicle
              </button>
            </div>
          )}
          {shown?.length === 0 &&
            (filtering ? (
              <div className="cyber-panel mx-auto max-w-xl space-y-6 p-10 text-center">
                <p className="glitch text-3xl" data-text="///NO.MATCH">
                  ///NO.MATCH
                </p>
                <button type="button" className="btn-ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="cyber-panel mx-auto max-w-xl p-10 text-center">
                <p className="glitch text-3xl" data-text="///NO.UNITS.IN.STOCK">
                  ///NO.UNITS.IN.STOCK
                </p>
              </div>
            ))}
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            aria-busy={loading}
          >
            {loading
              ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
              : shown?.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onPurchase={purchase}
                    admin={
                      isAdmin
                        ? { onEdit: setEditing, onDelete: remove, onRestock: restock }
                        : undefined
                    }
                  />
                ))}
          </div>
        </div>
      </main>
      {adding && (
        <VehicleFormModal
          title="Add vehicle"
          withQuantity
          onSave={async (input) => {
            const created = await createVehicle(input);
            // Newest first, matching the API's order.
            setVehicles((list) => [created, ...(list ?? [])]);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      )}
      {editing && (
        <VehicleFormModal
          title="Edit vehicle"
          initial={toFormValues(editing)}
          withQuantity={false}
          onSave={async (input) => {
            replaceVehicle(await updateVehicle(editing.id, input));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {notice && <Toast tone={notice.tone} message={notice.message} />}
      {error && <Toast tone="error" message={error} action={{ label: 'Retry', onClick: retry }} />}
    </>
  );
}
