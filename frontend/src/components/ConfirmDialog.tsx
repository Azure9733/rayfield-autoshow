import { useId, useState } from 'react';

interface Props {
  /** The question, e.g. "Delete Land Cruiser?"; also the dialog's accessible name. */
  message: string;
  /** May return a promise; Confirm stays disabled until it settles (no double delete). */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/** In-page confirmation (UI_PLAN.md §6), used instead of window.confirm. */
export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="alertdialog" aria-labelledby={id} className="space-y-3">
      <p id={id} className="font-bold uppercase tracking-[2px] text-cp-red">
        {message}
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn-danger" onClick={handleConfirm} disabled={busy}>
          Confirm
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} autoFocus>
          Cancel
        </button>
      </div>
    </div>
  );
}
