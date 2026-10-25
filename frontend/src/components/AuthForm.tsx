import type { FormEvent, ReactNode } from 'react';

interface Props {
  title: string;
  onSubmit: (event: FormEvent) => void;
  /** A form-level error (e.g. from the API), shown above the fields. */
  error?: string;
  /** Shown above the error, e.g. a "session expired" notice. */
  notice?: string;
  /** Fields and the submit button. */
  children: ReactNode;
  /** Shown under the submit button, e.g. a link to the other auth page. */
  footer: ReactNode;
}

/** Shared panel for the login and register forms. */
export function AuthForm({ title, onSubmit, error, notice, children, footer }: Props) {
  return (
    <main className="flex-1 flex justify-center px-4 py-10 md:py-16">
      {/* noValidate: our messages match the backend's, the browser's wouldn't */}
      <form
        noValidate
        onSubmit={onSubmit}
        className="cyber-panel w-full max-w-md p-6 md:p-8 space-y-5 self-start"
      >
        <h1 className="glitch text-3xl uppercase" data-text={title}>
          {title}
        </h1>
        {notice && (
          <p role="status" className="text-cp-cyan">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="cyber-error">
            {error}
          </p>
        )}
        {children}
        <p className="text-sm text-cp-muted">{footer}</p>
      </form>
    </main>
  );
}
