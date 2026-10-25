import type { User } from '../api/session';

/** Person icon + name for the logged-in user (the role isn't shown). */
export function UserIdentity({ user }: { user: User }) {
  return (
    <span className="flex items-center gap-2 font-mono text-sm text-cp-text">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 text-cp-yellow"
        role="img"
        aria-label="User account"
      >
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
      <span>{user.name}</span>
    </span>
  );
}
