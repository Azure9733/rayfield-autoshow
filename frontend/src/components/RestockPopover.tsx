import { useState, type FormEvent } from 'react';
import { TextField } from './TextField';

interface Props {
  onRestock: (quantity: number) => Promise<void>;
  onCancel: () => void;
}

/** Inline "units to add" form shown in a card (UI_PLAN.md §6). */
export function RestockPopover({ onRestock, onCancel }: Props) {
  const [quantity, setQuantity] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onRestock(Number(quantity));
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
        autoFocus
      />
      <div className="flex gap-2">
        <button type="submit" className="btn-ghost">
          Add stock
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
