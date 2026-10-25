import { useId } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  /** Label of the empty first option, e.g. "All" or "Choose…". */
  emptyLabel: string;
  error?: string;
}

/** Labelled select with its error message underneath (same wiring as TextField). */
export function SelectField({ label, value, onChange, options, emptyLabel, error }: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="cyber-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="cyber-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="cyber-error">
          {error}
        </p>
      )}
    </div>
  );
}
