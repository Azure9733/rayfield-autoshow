import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ApiError } from '../api/client';
import {
  createVehicle,
  deleteVehicle,
  EMPTY_FILTERS,
  filledFilters,
  filtersFromParams,
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
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { validateFilters } from '../validation/search';
import { toFormValues } from '../validation/vehicle';
import { useAuth } from '../context/AuthContext';

const SUCCESS_TOAST_MS = 4000;
// Long enough to wait out a burst of keystrokes, short enough to feel live.
const SEARCH_DEBOUNCE_MS = 300;

/** All vehicles, or the search results when any filter is filled. */
function fetchVehicles(query: SearchFilters) {
  return Object.keys(query).length > 0 ? searchVehicles(query) : listVehicles();
}

/** `/`: the vehicle inventory. */
export function InventoryPage() {
  // null until a response arrives; with no error, that's the loading state.
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState('');
  // The load error stays (it explains the empty page) even once its toast is closed.
  const [errorToastClosed, setErrorToastClosed] = useState(false);
  // Feedback for the last purchase; the load error above has its own toast with Retry.
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  // What's typed in the search panel. The list follows it live: once typing pauses, the filled
  // filters become the query, and a new query reloads the list.
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(() => filtersFromParams(searchParams));
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get('inStock') === '1');
  const debouncedForm = useDebouncedValue(form, SEARCH_DEBOUNCE_MS);
  // The URL is the source of truth for the query, so a link or reload restores the search.
  const queryString = new URLSearchParams(
    filledFilters(filtersFromParams(searchParams)) as Record<string, string>,
  ).toString();
  const query = useMemo(
    () => Object.fromEntries(new URLSearchParams(queryString)) as SearchFilters,
    [queryString],
  );
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
        if (!active) return;
        setVehicles(list);
        // A live search can succeed after an earlier load failed; drop that stale error.
        setError('');
      })
      .catch((e: unknown) => {
        if (!(e instanceof ApiError)) throw e;
        if (!active) return;
        setError(e.message);
        // A fresh failure shows its toast again, even if an earlier one was closed.
        setErrorToastClosed(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, query]);

  // Settled form changes go into the URL (replacing the entry, so typing doesn't flood the
  // history). "In stock only" is client-side but kept there too, so links restore it.
  useEffect(() => {
    // An invalid price range stays in the form (with its message) but isn't searched.
    if (Object.keys(validateFilters(debouncedForm)).length > 0) return;
    const next = new URLSearchParams(filledFilters(debouncedForm) as Record<string, string>);
    if (inStockOnly) next.set('inStock', '1');
    // Only navigate on a real change; setSearchParams itself changes with every navigation.
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [debouncedForm, inStockOnly, searchParams, setSearchParams]);

  // Success toasts clear themselves; error toasts stay until the next action replaces them.
  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const timer = setTimeout(() => setNotice(null), SUCCESS_TOAST_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  /** Swaps an updated vehicle (from purchase, edit, restock) into the list in place. */
  function replaceVehicle(updated: Vehicle) {
    setVehicles((list) => list?.map((v) => (v.id === updated.id ? updated : v)) ?? null);
  }

  /** Shows an API failure as a red toast; anything else is a bug and is rethrown. */
  function showError(e: unknown) {
    if (!(e instanceof ApiError)) throw e;
    setNotice({ tone: 'error', message: e.message });
  }

  // On failure the card keeps its confirmation open, so the admin can retry or cancel.
  async function remove(vehicle: Vehicle) {
    try {
      await deleteVehicle(vehicle.id);
    } catch (e) {
      showError(e);
      return;
    }
    setVehicles((list) => list?.filter((v) => v.id !== vehicle.id) ?? null);
  }

  /** True when restocked; false (with a toast) when the API refused, so the popover stays. */
  async function restock(vehicle: Vehicle, quantity: number) {
    try {
      replaceVehicle(await restockVehicle(vehicle.id, quantity));
      return true;
    } catch (e) {
      showError(e);
      return false;
    }
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

  function clearFilters() {
    setForm(EMPTY_FILTERS);
    setInStockOnly(false);
  }

  function retry() {
    setError('');
    setErrorToastClosed(false);
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
      <main className="flex-1 space-y-6 px-4 py-8 md:px-8">
        <SearchPanel
          values={form}
          onChange={setForm}
          errors={validateFilters(form)}
          onClear={clearFilters}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={setInStockOnly}
        />
        <div>
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
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
      {notice && (
        <Toast
          tone={notice.tone}
          message={notice.message}
          onDismiss={notice.tone === 'error' ? () => setNotice(null) : undefined}
        />
      )}
      {error && !errorToastClosed && (
        <Toast
          tone="error"
          message={error}
          action={{ label: 'Retry', onClick: retry }}
          onDismiss={() => setErrorToastClosed(true)}
        />
      )}
    </>
  );
}
