import { useEffect, useId, useState } from 'react';
import { ApiError } from '../api/client';
import { listMyPurchases, type Purchase } from '../api/purchases';
import { formatDateTime, formatPrice } from '../lib/format';
import { useModalClose } from '../lib/useModalClose';
import { Modal } from './Modal';

/** "My Garage" (UI_PLAN.md §1): the caller's purchase history, fetched fresh on every open. */
export function GarageDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  // null until the list arrives; with no error, that's the loading state.
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [error, setError] = useState('');
  // Bumped by Retry to load again.
  const [attempt, setAttempt] = useState(0);
  const loading = purchases === null && !error;
  const { closing, close } = useModalClose(onClose);

  useEffect(() => {
    // Ignore a response that lands after the dialog closed.
    let active = true;
    listMyPurchases()
      .then((list) => {
        if (active) setPurchases(list);
      })
      .catch((e: unknown) => {
        if (!(e instanceof ApiError)) throw e;
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setError('');
    setPurchases(null);
    setAttempt((n) => n + 1);
  }

  return (
    <Modal labelledBy={titleId} onRequestClose={close} closing={closing} className="max-w-2xl">
      <div className="flex max-h-[80vh] flex-col">
        <div className="flex items-center justify-between gap-4 p-6 pb-4">
          <h2 id={titleId} className="text-2xl font-bold uppercase tracking-[3px]">
            My Garage
          </h2>
          <button
            type="button"
            aria-label="Close"
            // Focus starts here: the garage is read-only, so closing is the likeliest action.
            autoFocus
            onClick={close}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center text-2xl text-cp-muted transition-colors hover:text-cp-yellow"
          >
            ×
          </button>
        </div>
        {error && (
          <div className="flex flex-col items-center gap-4 px-6 pt-4 pb-10 text-center">
            <p role="alert" className="font-bold text-cp-red">
              {error}
            </p>
            <button type="button" className="btn-ghost" onClick={retry}>
              Retry
            </button>
          </div>
        )}
        {loading && (
          <div className="space-y-3 px-6 pb-6" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                data-testid="garage-skeleton"
                className="animate-pulse space-y-2 border border-cp-yellow/15 p-4"
                aria-hidden="true"
              >
                <div className="h-5 w-1/2 bg-white/10" />
                <div className="h-4 w-3/4 bg-white/10" />
                <div className="h-3 w-2/3 bg-white/10" />
              </div>
            ))}
          </div>
        )}
        {purchases?.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 pt-4 pb-10 text-center">
            <p className="glitch text-3xl" data-text="///GARAGE.EMPTY">
              ///GARAGE.EMPTY
            </p>
            <p className="text-cp-muted">Your purchased vehicles will appear here.</p>
          </div>
        )}
        <ul className="space-y-3 overflow-y-auto px-6 pb-6">
          {purchases?.map((p) => (
            <li key={p.id} className="space-y-2 border border-cp-yellow/15 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="text-lg font-bold uppercase leading-tight">
                  {p.make} {p.model}
                </p>
                <p className="font-mono text-lg">{formatPrice(p.price)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-sm text-cp-muted">
                <span>{p.year}</span>
                <dl className="contents">
                  <div className="cyber-badge">
                    <dt className="cyber-badge-label">Category</dt>
                    <dd className="cyber-badge-value">{p.category}</dd>
                  </div>
                </dl>
                <time dateTime={p.purchasedAt}>{formatDateTime(p.purchasedAt)}</time>
              </div>
              <dl className="flex flex-wrap gap-x-2 font-mono text-[11px] text-cp-muted">
                <dt className="uppercase tracking-[2px]">Order ID</dt>
                <dd className="break-all">{p.id}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
