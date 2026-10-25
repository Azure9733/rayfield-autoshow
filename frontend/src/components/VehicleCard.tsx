import { useId, useState } from 'react';
import type { Vehicle } from '../api/vehicles';
import { formatPrice } from '../lib/format';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';
import { RestockPopover } from './RestockPopover';

/** At or below this many units (but not sold out) the card shows "Only N left". */
const LOW_STOCK = 3;

/** One vehicle in the inventory grid (UI_PLAN.md §4). */
export function VehicleCard({
  vehicle,
  onPurchase,
  admin,
}: {
  vehicle: Vehicle;
  /** Resolves when the purchase is done; the button stays disabled until then. */
  onPurchase: (vehicle: Vehicle) => Promise<void>;
  /** Admin actions; when absent (regular users) the admin buttons aren't rendered. */
  admin?: {
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (vehicle: Vehicle) => void;
    onRestock: (vehicle: Vehicle, quantity: number) => Promise<void>;
  };
}) {
  const { make, model, year, category, price, quantity, imageUrl } = vehicle;
  const id = useId();
  // Which admin panel replaces the admin buttons, if any.
  const [purchasing, setPurchasing] = useState(false);
  const [panel, setPanel] = useState<'none' | 'delete' | 'restock'>('none');

  // Disabled while in flight, so a double-click can't buy two units.
  async function handlePurchase() {
    setPurchasing(true);
    try {
      await onPurchase(vehicle);
    } finally {
      setPurchasing(false);
    }
  }

  return (
    // Named "<make> <model>" so tests and screen readers can tell cards apart.
    <article className="cyber-panel flex flex-col" aria-labelledby={`${id}-make ${id}-model`}>
      <div className="cyber-screen h-40">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <CategoryIcon category={category} className="h-20 w-40 text-cp-yellow/70" />
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
        <div className="flex flex-wrap gap-2">
          <dl className="contents">
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
          {quantity >= 1 && quantity <= LOW_STOCK && (
            <span className="cyber-badge">
              <span className="cyber-badge-value is-cyan">Only {quantity} left</span>
            </span>
          )}
        </div>
        <p className="font-mono text-xl">{formatPrice(price)}</p>
        <button
          type="button"
          className="btn-cyber mt-auto self-start"
          data-text="Purchase"
          disabled={quantity === 0 || purchasing}
          onClick={handlePurchase}
        >
          Purchase
        </button>
        {admin && panel === 'delete' && (
          <div className="border-t border-cp-yellow/15 pt-3">
            <ConfirmDialog
              message={`Delete ${model}?`}
              onConfirm={() => admin.onDelete(vehicle)}
              onCancel={() => setPanel('none')}
            />
          </div>
        )}
        {admin && panel === 'restock' && (
          <div className="border-t border-cp-yellow/15 pt-3">
            <RestockPopover
              onRestock={async (units) => {
                await admin.onRestock(vehicle, units);
                setPanel('none');
              }}
              onCancel={() => setPanel('none')}
            />
          </div>
        )}
        {admin && panel === 'none' && (
          <div className="flex flex-wrap gap-2 border-t border-cp-yellow/15 pt-3">
            <button type="button" className="btn-ghost" onClick={() => admin.onEdit(vehicle)}>
              Edit
            </button>
            <button type="button" className="btn-ghost" onClick={() => setPanel('restock')}>
              Restock
            </button>
            <button type="button" className="btn-danger" onClick={() => setPanel('delete')}>
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
