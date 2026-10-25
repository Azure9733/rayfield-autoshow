import { useState, type FormEvent } from 'react';
import { TextField } from './TextField';

interface Props {
  onRestock: (quantity: number) => Promise<void>;
  onCancel: () => void;
}

/** Inline "units to add" form shown in a card (UI_PLAN.md §6). */
export function RestockPopover({ onRestock, onCancel }: Props) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  // Disables Add stock while the request runs, so a double-click can't restock twice.
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const units = Number(quantity);
    // Same rule and message as the backend's restock schema.
    if (quantity.trim() === '' || !Number.isInteger(units) || units < 1 || units > 10_000) {
      setError('Restock quantity must be a whole number from 1 to 10,000');
      return;
    }
    setBusy(true);
    try {
      await onRestock(units);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label="Units to add"
        type="number"
        min="1"
        max="10000"
        value={quantity}
        onChange={setQuantity}
        error={error}
        autoFocus
      />
      <div className="flex gap-2">
        <button type="submit" className="btn-ghost" disabled={busy}>
          Add stock
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
