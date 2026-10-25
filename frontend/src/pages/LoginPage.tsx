import { useLocation } from 'react-router';

/** `/login`. Shows a notice passed in router state (e.g. "session expired"). */
export function LoginPage() {
  const notice = (useLocation().state as { notice?: string } | null)?.notice;

  return <main>{notice && <p role="status">{notice}</p>}</main>;
}
