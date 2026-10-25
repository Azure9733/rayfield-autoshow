import { Link } from 'react-router';

/** Any unknown route (UI_PLAN.md §2). */
export function NotFoundPage() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-16">
      <div className="cyber-panel w-full max-w-xl space-y-6 p-10 text-center">
        <h1 className="glitch text-4xl" data-text="///SIGNAL.LOST">
          ///SIGNAL.LOST
        </h1>
        <p className="text-cp-muted">There's nothing at this address.</p>
        <Link to="/" className="btn-cyber" data-text="Back to inventory">
          Back to inventory
        </Link>
      </div>
    </main>
  );
}
