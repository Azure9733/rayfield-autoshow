import { useEffect, useId, useState } from 'react';
import { listMyPurchases, type Purchase } from '../api/purchases';
import { formatDateTime, formatPrice } from '../lib/format';
import { Modal } from './Modal';

/** "My Garage" (UI_PLAN.md §1): the caller's purchase history, fetched fresh on every open. */
export function GarageDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);

  useEffect(() => {
    let active = true;
    listMyPurchases().then((list) => {
      if (active) setPurchases(list);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Modal labelledBy={titleId} onRequestClose={onClose} className="max-w-2xl">
      <div className="flex max-h-[80vh] flex-col">
        <h2 id={titleId} className="p-6 pb-4 text-2xl font-bold uppercase tracking-[3px]">
          My Garage
        </h2>
        {purchases === null && (
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
