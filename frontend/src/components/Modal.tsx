import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** Space-separated ids of the elements that name the dialog. */
  labelledBy: string;
  /** Asked to close: Escape, or a click on the backdrop itself. */
  onRequestClose: () => void;
  /** Extra classes for the panel, e.g. its width. */
  className?: string;
  /** A click anywhere in the panel (e.g. "click to dismiss" states). */
  onPanelClick?: () => void;
  children: ReactNode;
}

/**
 * Centred cyber-panel over a dark backdrop, shared by the purchase dialog and My Garage.
 * Rendered into <body> so it sits above everything, whichever component opened it.
 */
export function Modal({
  labelledBy,
  onRequestClose,
  className = '',
  onPanelClick,
  children,
}: Props) {
  return createPortal(
    <div
      data-testid="dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      // Only a click on the backdrop itself closes; clicks inside the panel bubble up too.
      onClick={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onRequestClose();
        }}
        onClick={onPanelClick}
        className={`cyber-panel relative w-full overflow-hidden ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
