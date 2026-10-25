import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './motion';

// Matches the .modal-*.is-closing animations in index.css.
const MODAL_CLOSE_MS = 160;

/**
 * Closing with an exit animation: `close()` marks the modal as closing (pass `closing` to
 * Modal), then calls `onClose` once the animation has had time to play. Reduced motion closes
 * at once.
 */
export function useModalClose(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const close = useCallback(() => {
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    clearTimeout(timer.current);
    // A timer rather than animationend, which may never fire (a background tab, CSS off).
    timer.current = window.setTimeout(onClose, MODAL_CLOSE_MS);
  }, [onClose]);

  return { closing, close };
}
