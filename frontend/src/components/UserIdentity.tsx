import type { User } from '../api/session';

/** Person icon + name for users; shield icon + name + ADMIN badge for admins. */
export function UserIdentity({ user }: { user: User }) {
  const admin = user.role === 'admin';
  return (
    <span className="flex items-center gap-2 font-mono text-sm text-cp-text">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`size-5 ${admin ? 'text-cp-cyan' : 'text-cp-yellow'}`}
        role="img"
        aria-label={admin ? 'Admin account' : 'User account'}
      >
        {admin ? (
          <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3zM9 12l2 2 4-4" />
        ) : (
          <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
        )}
      </svg>
      <span>{user.name}</span>
      {admin && (
        <span className="cyber-badge">
          <span className="cyber-badge-value is-cyan">Admin</span>
        </span>
      )}
    </span>
  );
}
