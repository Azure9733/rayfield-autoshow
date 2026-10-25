import { useId, useState } from 'react';
import type { Vehicle } from '../api/vehicles';
import { formatPrice } from '../lib/format';

interface Props {
  vehicle: Vehicle;
  /** Buys one unit. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Confirm-before-buying modal (UI_PLAN.md §4): centred panel over a dark backdrop. */
export function PurchaseDialog({ vehicle, onConfirm, onClose }: Props) {
  const kickerId = useId();
  const titleId = useId();
  const [processing, setProcessing] = useState(false);

  async function confirm() {
    setProcessing(true);
    try {
      await onConfirm();
    } finally {
      setProcessing(false);
    }
  }

  // While the request runs the dialog stays put: closing it wouldn't cancel the purchase.
  function close() {
    if (!processing) onClose();
  }

  return (
    <div
      data-testid="dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      // Only a click on the backdrop itself closes; clicks inside the panel bubble up too.
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${kickerId} ${titleId}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
        className="cyber-panel relative w-full max-w-md overflow-hidden p-6 md:p-8"
      >
        <p id={kickerId} className="cyber-label">
          Purchase
        </p>
        <h2 id={titleId} className="text-2xl font-bold uppercase leading-tight">
          {vehicle.make} {vehicle.model}
        </h2>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono">
          <dt className="text-cp-muted">Year</dt>
          <dd>{vehicle.year}</dd>
          <dt className="text-cp-muted">Price</dt>
          <dd className="text-xl">{formatPrice(vehicle.price)}</dd>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-cyber"
            data-text={processing ? 'Processing...' : 'Confirm purchase'}
            autoFocus
            disabled={processing}
            onClick={confirm}
          >
            {processing ? 'Processing...' : 'Confirm purchase'}
          </button>
          <button type="button" className="btn-ghost h-12" disabled={processing} onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
