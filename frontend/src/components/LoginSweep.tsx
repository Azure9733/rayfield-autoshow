import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { prefersReducedMotion } from '../lib/motion';

// The .login-sweep animation is 350 ms; the overlay is removed just after, by timer.
const SWEEP_MS = 400;

/**
 * Right after a login (or register), a black panel wipes left to right across the screen,
 * revealing the inventory (UI_PLAN.md §1). Never on a reload: `logins` starts at 0.
 */
export function LoginSweep() {
  const { logins } = useAuth();
  if (logins === 0 || prefersReducedMotion()) return null;
  // Keyed by the login count, so each login plays it once.
  return <SweepPanel key={logins} />;
}

function SweepPanel() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), SWEEP_MS);
    return () => clearTimeout(timer);
  }, []);
  return done ? null : <div className="login-sweep" aria-hidden="true" />;
}
