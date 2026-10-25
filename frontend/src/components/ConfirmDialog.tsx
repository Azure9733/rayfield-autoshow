import { useId } from 'react';

interface Props {
  /** The question, e.g. "Delete Land Cruiser?"; also the dialog's accessible name. */
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-page confirmation (UI_PLAN.md §6), used instead of window.confirm. */
export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  const id = useId();

  return (
    <div role="alertdialog" aria-labelledby={id} className="space-y-3">
      <p id={id} className="font-bold uppercase tracking-[2px] text-cp-red">
        {message}
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn-danger" onClick={onConfirm}>
          Confirm
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} autoFocus>
          Cancel
        </button>
      </div>
    </div>
  );
}
