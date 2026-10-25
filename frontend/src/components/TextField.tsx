import { useId, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange'> & {
  label: string;
  error?: string;
  onChange: (value: string) => void;
};

/**
 * Labelled input with its error message underneath. The message is wired up with
 * aria-describedby, so screen readers read it with the field.
 */
export function TextField({ label, error, onChange, ...input }: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="cyber-label" htmlFor={id}>
        {label}
      </label>
      <input
        {...input}
        id={id}
        className="cyber-input"
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="cyber-error">
          {error}
        </p>
      )}
    </div>
  );
}
