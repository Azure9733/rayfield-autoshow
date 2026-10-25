interface Props {
  message: string;
  tone: 'success' | 'error';
  /** Optional button inside the toast, e.g. Retry. */
  action?: { label: string; onClick: () => void };
  /** Shows a close (×) button; error toasts get one since they never dismiss themselves. */
  onDismiss?: () => void;
}

/**
 * Corner notification. Errors use role="alert" (announced immediately); successes use
 * role="status" (announced politely).
 */
export function Toast({ message, tone, action, onDismiss }: Props) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`cyber-toast flex items-center gap-4 ${tone === 'error' ? 'is-error' : ''}`}
    >
      <span>{message}</span>
      {action && (
        <button type="button" className="btn-ghost h-8" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          className="-mr-2 flex size-8 cursor-pointer items-center justify-center text-lg text-cp-muted hover:text-cp-text"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
}
