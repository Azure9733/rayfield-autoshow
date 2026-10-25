import { useId } from 'react';
import type { Vehicle } from '../api/vehicles';
import { formatPrice } from '../lib/format';

/** One vehicle in the inventory grid (UI_PLAN.md §4). */
export function VehicleCard({
  vehicle,
  onPurchase,
  admin,
}: {
  vehicle: Vehicle;
  onPurchase: (vehicle: Vehicle) => void;
  /** Admin actions; when absent (regular users) the admin buttons aren't rendered. */
  admin?: { onEdit: (vehicle: Vehicle) => void };
}) {
  const { make, model, year, category, price, quantity, imageUrl } = vehicle;
  const id = useId();

  return (
    // Named "<make> <model>" so tests and screen readers can tell cards apart.
    <article className="cyber-panel flex flex-col" aria-labelledby={`${id}-make ${id}-model`}>
      <div className="cyber-screen h-40">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-cp-yellow/60">[ {category} ]</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex justify-between text-sm uppercase tracking-[2px] text-cp-muted">
          <span id={`${id}-make`}>{make}</span>
          <span className="font-mono">{year}</span>
        </div>
        <h2 id={`${id}-model`} className="text-2xl font-bold uppercase leading-tight">
          {model}
        </h2>
        <dl className="flex flex-wrap gap-2">
          <div className="cyber-badge">
            <dt className="cyber-badge-label">Category</dt>
            <dd className="cyber-badge-value">{category}</dd>
          </div>
          <div className="cyber-badge">
            <dt className="cyber-badge-label">Stock</dt>
            {quantity === 0 ? (
              <dd className="cyber-badge-value is-red">Sold out</dd>
            ) : (
              <dd className="cyber-badge-value">{quantity}</dd>
            )}
          </div>
        </dl>
        <p className="font-mono text-xl">{formatPrice(price)}</p>
        <button
          type="button"
          className="btn-cyber mt-auto self-start"
          data-text="Purchase"
          disabled={quantity === 0}
          onClick={() => onPurchase(vehicle)}
        >
          Purchase
        </button>
        {admin && (
          <div className="flex flex-wrap gap-2 border-t border-cp-yellow/15 pt-3">
            <button type="button" className="btn-ghost" onClick={() => admin.onEdit(vehicle)}>
              Edit
            </button>
            <button type="button" className="btn-ghost">
              Restock
            </button>
            <button type="button" className="btn-danger">
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
